import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, useWindowDimensions, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppMapCamera,
  AppMapUserLocation,
  AppMapView,
  AppView,
  FocusAwareStatusBar,
  TextField,
} from '@/components/ui';
import { distanceKm, type GeoPoint } from '@/lib/geo';
import {
  useSaveAddress,
  useSaveAddressContact,
  useSavedAddresses,
  useUpdateAddress,
} from '@/hooks/use-addresses';
import { getErrorMessage } from '@/lib/api/api-error';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { draftStops, useTripStore, type TripDraft } from '@/stores/trip-store';

import { DeliveryPin } from './components/delivery-pin';
import { DraggableSheet, useKeyboardHeight } from './components/draggable-sheet';
import { LocateMeButton } from './components/locate-me-button';
import { MapSearchBar } from './components/map-search-bar';
import { LocationDetailsPanel } from './components/location-details-panel';
import { PinStepPanel } from './components/pin-step-panel';
import { SaveAsChips, type SaveAsLabel } from './components/save-as-chips';
import { ContactDetailsFields } from './components/contact-details-fields';
import {
  getCurrentPosition,
  getLastKnownPosition,
  peekLastKnownPosition,
  reverseGeocodePlace,
} from './geocoding';
import { useContactDetailsForm } from './hooks/use-contact-details-form';
import { framePath, useMapCamera } from './hooks/use-map-camera';
import { usePickerLocation } from './hooks/use-picker-location';
import { mapPickerHref, parseMapPickerParams } from './map-picker-route';
import { alertNotServiceable, isServiceable } from './serviceability';
import { goBack } from '@/lib/go-back';

// Connaught Place, New Delhi — used until a real location is known.
const DEFAULT_CENTER: GeoPoint = { latitude: 28.6139, longitude: 77.209 };
const PINNED_FALLBACK_LABEL = 'Pinned location';

type Step = 'pin' | 'details';

/** Map centers within this distance count as "not moved" (the camera settles with float drift). */
const SAME_POINT_TOLERANCE_KM = 0.02;
/** Time for the native map to apply new padding before a camera move (ms). */
const PADDING_SETTLE_MS = 80;
const SAME_PLACE_KM = 0.1;

function isSamePoint(a: GeoPoint | null, b: GeoPoint): boolean {
  return a !== null && distanceKm(a, b) < SAME_POINT_TOLERANCE_KM;
}

/** The form takes a 10-digit number; saved contacts come back as E.164 (+91…). */
function toLocalPhone(phone: string | null | undefined): string | undefined {
  return phone?.replace(/\D/g, '').slice(-10);
}

/** The stop being edited: pickup, the single drop, or one stop of a multi-stop trip. */
function readSlot(draft: TripDraft, isPickup: boolean, stopIndex: number | undefined) {
  if (stopIndex !== undefined) {
    const stop = draftStops(draft)[stopIndex];
    return {
      label: stop?.label ?? '',
      address: stop?.address ?? '',
      details: stop?.details ?? null,
    };
  }
  return isPickup
    ? { label: draft.pickupLabel, address: draft.pickupAddress, details: draft.pickupDetails }
    : { label: draft.dropLabel, address: draft.dropAddress, details: draft.dropDetails };
}

export function SelectLocationMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const picker = parseMapPickerParams(useLocalSearchParams());
  const kind = picker.mode === 'confirm' ? picker.kind : 'drop';
  const isPickup = kind === 'pickup';
  const stopIndex = picker.mode !== 'edit' ? picker.stopIndex : undefined;

  const draft = useTripStore.use.draft();
  // A pickup asked for after the drop starts next to that drop, not in the default city.
  const initialRegion =
    (picker.mode !== 'pin' && picker.region) || (isPickup && draft.dropRegion) || DEFAULT_CENTER;
  const { data: addresses } = useSavedAddresses();
  const savedAddress =
    picker.mode === 'confirm' ? addresses?.find((a) => a.id === picker.addressId) : undefined;
  const updateAddress = useUpdateAddress();
  const saveContact = useSaveAddressContact();
  const saveAddress = useSaveAddress();
  const [saveAs, setSaveAs] = useState<SaveAsLabel | null>(null);
  const [customName, setCustomName] = useState('');
  // Home and Shop can only be saved once; the customer names any further place themselves via Other.
  const takenLabels: SaveAsLabel[] = [
    ...(addresses?.some((a) => a.label === 'home') ? (['home'] as const) : []),
    ...(addresses?.some((a) => a.label === 'work') ? (['shop'] as const) : []),
  ];
  const slot = readSlot(draft, isPickup, stopIndex);
  const currentLabel = slot.label;
  const currentAddress = slot.address;

  const [step, setStep] = useState<Step>(picker.mode === 'pin' ? 'pin' : 'details');
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editName, setEditName] = useState(picker.mode === 'edit' ? picker.name : '');
  const [editAddress, setEditAddress] = useState(picker.mode === 'edit' ? picker.address : '');
  // The search screen stores the picked place's contact on the draft; saved
  // addresses fall back to the contact remembered server-side, and a pickup
  // with neither (e.g. the current location) defaults to the signed-in user.
  const user = useAuthStore.use.user();
  const draftDetails = slot.details;
  const ownContact = isPickup ? user : null;
  // Pickup only, like Porter: where in the building the driver collects from.
  const [houseNumber, setHouseNumber] = useState(
    draftDetails?.houseNumber ?? savedAddress?.contact?.houseNumber ?? '',
  );
  const contactForm = useContactDetailsForm(kind, {
    contactName: draftDetails?.contactName ?? savedAddress?.contact?.name ?? ownContact?.name,
    contactPhone: toLocalPhone(
      draftDetails?.contactPhone ?? savedAddress?.contact?.phone ?? ownContact?.phone,
    ),
  });

  // The sheet covers the bottom of the map, so the camera (and the fixed pin)
  // center on the visible area between header and sheet.
  const baseInset = { top: insets.top + 80, bottom: sheetHeight + insets.bottom + 24 };
  // Where the pin stands relative to the middle of that area. Zero, except after framing the path
  // to the user's dot, when the pin moves aside so the path as a whole is centered. The map's
  // padding moves its center along with the pin, so the pin always marks what gets saved.
  const [pinOffset, setPinOffset] = useState({ x: 0, y: 0 });
  const cameraPadding = {
    top: baseInset.top + Math.max(0, 2 * pinOffset.y),
    bottom: baseInset.bottom + Math.max(0, -2 * pinOffset.y),
    left: Math.max(0, 2 * pinOffset.x),
    right: Math.max(0, -2 * pinOffset.x),
  };
  const { cameraRef, center, setCenter, animateTo, handleMapReady, zoom } = useMapCamera(
    initialRegion,
    cameraPadding,
  );
  // Last coordinate saved to the store — lets "save" tell whether the user
  // dragged the map since, and only then re-geocode over a nicer search label.
  const committedRegionRef = useRef<GeoPoint | null>(
    picker.mode !== 'pin' ? (picker.region ?? null) : null,
  );

  const location = usePickerLocation({
    picker,
    animateTo: animateTo,
    onAddressResolved: (point) => {
      committedRegionRef.current = point;
    },
  });

  // Where the customer is, so the pin can show how far away it is (like the walking line in Uber).
  // Drawn from the last known fix at once (a straight line needs no routing API), then refined.
  const [userPoint, setUserPoint] = useState<GeoPoint | null>(peekLastKnownPosition);
  useEffect(() => {
    if (!location.hasPermission) return;
    let cancelled = false;
    getLastKnownPosition().then((point) => {
      if (!cancelled && point) setUserPoint((current) => current ?? point);
    });
    getCurrentPosition().then((point) => {
      if (!cancelled && point) setUserPoint(point);
    });
    return () => {
      cancelled = true;
    };
  }, [location.hasPermission]);

  // Frame the whole path from the user's dot to the pin, centered in the visible map (above the
  // sheet), like a route preview. On open (once the place, the user and the sheet are known) and
  // after a search; never during a drag, which would fight the finger.
  const screen = useWindowDimensions();
  const frameLine = (pin: GeoPoint, from: GeoPoint | null, duration: number) => {
    const metres = from ? distanceKm(from, pin) * 1000 : 0;
    // Beyond 20 km no line is drawn, so there is nothing to frame: the pin goes back to the middle.
    if (!from || metres <= 15 || metres > 20_000) {
      setPinOffset({ x: 0, y: 0 });
      animateTo(pin, duration);
      return;
    }
    const frame = framePath(pin, from, {
      width: screen.width,
      height: screen.height - baseInset.top - baseInset.bottom,
    });
    setPinOffset(frame.pinOffset);
    // Moved after the new padding reaches the map: changing padding mid-animation cancels it.
    setPendingFrame({ pin, zoom: frame.zoom, duration });
  };
  const [pendingFrame, setPendingFrame] = useState<{
    pin: GeoPoint;
    zoom: number;
    duration: number;
  } | null>(null);
  useEffect(() => {
    if (!pendingFrame) return;
    // The native map applies new padding a frame or two after React does, and a padding change
    // cancels a camera move already under way: start the move once it has settled.
    const timer = setTimeout(() => {
      animateTo(pendingFrame.pin, pendingFrame.duration, pendingFrame.zoom);
      setPendingFrame(null);
    }, PADDING_SETTLE_MS);
    return () => clearTimeout(timer);
    // animateTo is recreated each render; the pending frame is what triggers this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFrame]);
  const hasFramedRef = useRef(false);
  const openedAt = picker.mode !== 'pin' ? (picker.region ?? null) : null;
  useEffect(() => {
    // Waits for the picker's own opening move (made once permission is known), so that move
    // can't land after this one and undo the framing.
    if (
      hasFramedRef.current ||
      !openedAt ||
      !userPoint ||
      sheetHeight === 0 ||
      location.hasPermission === null
    )
      return;
    hasFramedRef.current = true;
    frameLine(openedAt, userPoint, 500);
    // Runs once the inputs are ready; later camera moves belong to the customer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedAt?.latitude, openedAt?.longitude, userPoint, sheetHeight, location.hasPermission]);

  // Lifts the pin while the map moves. Set once at the start and once at the end of a move: the
  // per-frame work (the line following the pin) happens inside the map, not in this screen.
  const [isMoving, setIsMoving] = useState(false);

  const saveLocation = (region: GeoPoint, place: { label: string; address: string }) => {
    const trip = useTripStore.getState();
    if (stopIndex !== undefined) {
      trip.setStopLocation(stopIndex, place.label, region, place.address);
    } else if (isPickup) trip.setPickup(place.label, region, place.address);
    else trip.setDrop(place.label, region, place.address);
    committedRegionRef.current = region;
  };

  const handleUseCurrentLocation = async () => {
    const position = await location.locateUser();
    if (!position) return;
    // At the user's own spot there is no path to frame: the pin goes back to the middle.
    setPinOffset({ x: 0, y: 0 });
    animateTo(position, 500);
    // For a drop the button only brings the map back to you; the customer still places the pin.
    if (!isPickup) {
      setUserPoint(position);
      return;
    }
    if (!(await isServiceable(position))) {
      alertNotServiceable(stopKind);
      return;
    }
    saveLocation(position, await reverseGeocodePlace(position, 'Current location'));
    // The sender at the user's own location is the user.
    if (user?.name) contactForm.setContactName(user.name);
    if (user?.phone) contactForm.setContactPhone(toLocalPhone(user.phone) ?? '');
  };

  const stopKind = stopIndex !== undefined ? 'stop' : isPickup ? 'pickup' : 'drop';
  // Typing in the sheet lifts it up to the search bar and locate button, which would cover its fields.
  const keyboardHeight = useKeyboardHeight();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isTypingInSheet = keyboardHeight > 0 && !isSearchFocused;

  // Searching the map slides the sheet away; a button brings it back. With the sheet open, a tap
  // on the search bar first lets the sheet slide down, then opens the keyboard: one motion, then
  // the next, instead of the sheet and the keyboard fighting over the screen.
  // Opens as the pill, so the map (and the path to the pin) is what the customer sees first.
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(true);
  const searchInputRef = useRef<TextInputInstance>(null);
  const focusSearchAfterCollapseRef = useRef(false);
  const requestSearchFocus = () => {
    focusSearchAfterCollapseRef.current = true;
    setIsSheetCollapsed(true);
  };
  const handleSheetCollapsed = () => {
    if (!focusSearchAfterCollapseRef.current) return;
    focusSearchAfterCollapseRef.current = false;
    searchInputRef.current?.focus();
  };
  const reopenSheet = () => {
    Keyboard.dismiss();
    setIsSheetCollapsed(false);
  };

  const handleSearchSelect = async (point: GeoPoint, place: { label: string; address: string }) => {
    if (!(await isServiceable(point))) {
      alertNotServiceable(stopKind);
      return;
    }
    frameLine(point, userPoint, 500);
    // While placing the pin or editing a saved address the pin is saved on confirm; otherwise the
    // searched place becomes the stop right away, keeping its name instead of a street guess.
    if (step === 'details' && picker.mode !== 'edit') saveLocation(point, place);
  };

  const handleConfirmPin = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    const region = center;
    if (!(await isServiceable(region))) {
      alertNotServiceable(stopKind);
      setIsConfirming(false);
      return;
    }
    saveLocation(region, await reverseGeocodePlace(region, PINNED_FALLBACK_LABEL));
    setIsConfirming(false);
    setStep('details');
  };

  const handleSaveEdit = () => {
    if (picker.mode !== 'edit' || editName.trim().length === 0) return;
    updateAddress.mutate(
      {
        id: picker.addressId,
        name: editName.trim(),
        address: editAddress.trim(),
        location: center,
      },
      {
        onSuccess: () => goBack(router),
        onError: (error) => Alert.alert('Could not save address', getErrorMessage(error)),
      },
    );
  };

  const handleSaveDetails = async () => {
    const details = contactForm.submit();
    if (!details) return;

    const region = center;
    const otherEnd = isPickup ? draft.dropRegion : draft.pickupRegion;
    if (stopIndex === undefined && otherEnd && distanceKm(otherEnd, region) < SAME_PLACE_KM) {
      Alert.alert(
        'Pickup and drop are the same place',
        `Move the pin to where the ${isPickup ? 'parcel is collected' : 'parcel should go'}.`,
      );
      return;
    }
    if (!isSamePoint(committedRegionRef.current, region)) {
      // The pin was dragged after the place was checked.
      if (!(await isServiceable(region))) {
        alertNotServiceable(stopKind);
        return;
      }
      saveLocation(
        region,
        await reverseGeocodePlace(region, currentLabel || PINNED_FALLBACK_LABEL),
      );
    }

    const trip = useTripStore.getState();
    const stopDetails = { houseNumber: houseNumber.trim(), ...details };
    if (stopIndex !== undefined) trip.setStopDetails(stopIndex, stopDetails);
    else if (isPickup) trip.setPickupDetails(stopDetails);
    else trip.setDropDetails(stopDetails);
    if (savedAddress) {
      // Remembered server-side so picking this place again pre-fills the contact.
      saveContact.mutate({
        id: savedAddress.id,
        name: details.contactName,
        phone: details.contactPhone,
        houseNumber: stopDetails.houseNumber,
      });
    } else if (saveAs) {
      // Read after the await above so a moved pin saves its re-geocoded label.
      const label =
        readSlot(useTripStore.getState().draft, isPickup, stopIndex).label || PINNED_FALLBACK_LABEL;
      saveAddress.mutate({
        name: label,
        address: label,
        location: region,
        label: saveAs,
        customName: saveAs === 'other' ? customName.trim() || undefined : undefined,
        contact: { name: details.contactName, phone: details.contactPhone },
      });
    }

    if (stopIndex !== undefined) {
      // Part of a multi-stop trip — back to the stop list for the next one.
      router.dismissTo('/add-stops');
    } else if (isPickup && picker.mode === 'confirm' && picker.returnHome) {
      // Changed from Home's pickup card: back to Home with the new pickup, as Porter does.
      router.dismissTo('/home');
    } else if (isPickup) {
      const now = useTripStore.getState().draft;
      // Drop already chosen (pickup was the missing piece): carry on to the booking screen.
      if (now.dropRegion && now.dropDetails) router.replace('/trip-confirmation');
      // Otherwise pickup is edited from the drop search screen — return to it.
      else goBack(router);
    } else if (!useTripStore.getState().draft.pickupRegion) {
      // No pickup yet (location permission denied): ask for it before pricing.
      router.replace(mapPickerHref({ mode: 'confirm', kind: 'pickup' }));
    } else {
      // `replace` so the map picker isn't left stale in the back stack.
      router.replace('/trip-confirmation');
    }
  };

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />

      <AppMapView
        style={{ position: 'absolute', inset: 0 }}
        compass={false}
        onDidFinishLoadingMap={handleMapReady}
        // The pin sits in the middle of the area between header and sheet: make that the map's center.
        contentInset={cameraPadding}
        onMoveStart={() => setIsMoving(true)}
        tether={userPoint ? { from: userPoint, to: center, color: '#1D4ED8' } : null}
        onRegionDidChange={(event) => {
          const [longitude, latitude] = event.nativeEvent.center;
          setIsMoving(false);
          setCenter({ latitude, longitude });
        }}
      >
        <AppMapCamera
          ref={cameraRef}
          initialViewState={{
            center: [initialRegion.longitude, initialRegion.latitude],
            zoom: zoom,
            padding: cameraPadding,
          }}
        />
        {location.hasPermission ? <AppMapUserLocation /> : null}
      </AppMapView>

      <DeliveryPin
        isMoving={isMoving}
        paddingTop={cameraPadding.top}
        paddingBottom={cameraPadding.bottom}
        paddingLeft={cameraPadding.left}
        paddingRight={cameraPadding.right}
        calloutSide={pinOffset.x > 110 ? 'right' : pinOffset.x < -110 ? 'left' : 'center'}
        label={
          step === 'pin' || picker.mode === 'edit'
            ? 'Set pin here'
            : isPickup
              ? 'Pickup here'
              : stopIndex !== undefined
                ? `Stop ${stopIndex + 1} here`
                : 'Drop here'
        }
      />
      {isTypingInSheet ? null : (
        <>
          {/* Search right on the map: picking a result moves the pin there and frames the line. */}
          <MapSearchBar
            onBack={() => goBack(router)}
            placeholder={
              picker.mode === 'edit'
                ? 'Search a place'
                : isPickup
                  ? 'Search pickup location'
                  : stopIndex !== undefined
                    ? `Search stop ${stopIndex + 1} location`
                    : 'Search drop location'
            }
            inputRef={searchInputRef}
            onRequestFocus={isSheetCollapsed ? undefined : requestSearchFocus}
            topInset={insets.top}
            near={center}
            onSelect={handleSearchSelect}
            onFocusChange={setIsSearchFocused}
          />
          {/* Out of the way of the search results while the search is open. */}
          {isSearchFocused ? null : (
            <LocateMeButton
              onPress={handleUseCurrentLocation}
              isLocating={location.isLocating}
              bottomOffset={isSheetCollapsed ? insets.bottom + 64 + 24 : sheetHeight}
            />
          )}
        </>
      )}

      <DraggableSheet
        onDismiss={() => goBack(router)}
        onHeightChange={setSheetHeight}
        collapsed={isSheetCollapsed}
        onCollapsedChange={(next) => (next ? setIsSheetCollapsed(true) : reopenSheet())}
        onCollapseEnd={handleSheetCollapsed}
        hidden={isSheetCollapsed && keyboardHeight > 0}
        header={{
          collapsed: {
            title: currentLabel || PINNED_FALLBACK_LABEL,
            subtitle: step === 'pin' ? 'Tap to confirm this spot' : 'Tap to add details',
          },
          expanded:
            step === 'pin'
              ? { title: 'Set the exact spot', subtitle: 'Move the map under the pin' }
              : picker.mode === 'edit'
                ? { title: 'Edit location', subtitle: 'Name and address of this place' }
                : {
                    title:
                      stopIndex !== undefined
                        ? `Stop ${stopIndex + 1} details`
                        : isPickup
                          ? 'Pickup details'
                          : 'Drop details',
                    subtitle: isPickup ? 'Who hands over the goods' : 'Who receives the goods',
                  },
        }}
      >
        {step === 'pin' ? (
          <PinStepPanel
            isPermissionDenied={location.hasPermission === false}
            isConfirming={isConfirming}
            onConfirm={handleConfirmPin}
            bottomInset={insets.bottom}
          />
        ) : picker.mode === 'edit' ? (
          <LocationDetailsPanel
            title="Edit location"
            submitLabel="Save changes"
            onSubmit={handleSaveEdit}
            bottomInset={insets.bottom}
          >
            <TextField
              label="Label"
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Home, Work"
              className="mb-3"
            />
            <TextField
              label="Address"
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Full address"
              className="mb-3"
            />
          </LocationDetailsPanel>
        ) : (
          <LocationDetailsPanel
            title={currentLabel || PINNED_FALLBACK_LABEL}
            subtitle={currentAddress}
            stop={kind}
            submitLabel={contactForm.isValid ? 'Confirm & Proceed' : 'Enter Contact Details'}
            submitVariant="primary"
            onSubmit={handleSaveDetails}
            onChangeLocation={() => goBack(router)}
            bottomInset={insets.bottom}
          >
            {isPickup && stopIndex === undefined ? (
              <TextField
                variant="outlined"
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="House / Apartment / Shop (optional)"
                accessibilityLabel="House, apartment or shop (optional)"
                className="mb-3"
              />
            ) : null}
            <ContactDetailsFields
              form={contactForm}
              ownPhone={toLocalPhone(user?.phone)}
              ownName={user?.name ?? undefined}
            />
            {savedAddress ? null : (
              <SaveAsChips
                value={saveAs}
                onChange={setSaveAs}
                taken={takenLabels}
                customName={customName}
                onChangeCustomName={setCustomName}
              />
            )}
          </LocationDetailsPanel>
        )}
      </DraggableSheet>
    </AppView>
  );
}
