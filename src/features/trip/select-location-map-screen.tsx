import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppView, FocusAwareStatusBar, ScreenHeader, TextField } from '@/components/ui';
import { OlaMapCamera, OlaMapUserLocation, OlaMapView } from '@/components/ui/ola-map-view';
import { distanceKm, type GeoPoint } from '@/lib/geo';
import { useSaveAddressContact, useSavedAddresses, useUpdateAddress } from '@/hooks/use-addresses';
import { getErrorMessage } from '@/lib/api/api-error';
import { useTripStore } from '@/stores/trip-store';

import { DeliveryPin } from './components/delivery-pin';
import { DraggableSheet } from './components/draggable-sheet';
import { LocateMeButton } from './components/locate-me-button';
import { LocationDetailsPanel } from './components/location-details-panel';
import { PinStepPanel } from './components/pin-step-panel';
import { ContactDetailsFields } from './components/contact-details-fields';
import { reverseGeocodeLabel } from './geocoding';
import { useContactDetailsForm } from './hooks/use-contact-details-form';
import { useMapCamera } from './hooks/use-map-camera';
import { usePickerLocation } from './hooks/use-picker-location';
import { parseMapPickerParams } from './map-picker-route';

// Connaught Place, New Delhi — used until a real location is known.
const DEFAULT_CENTER: GeoPoint = { latitude: 28.6139, longitude: 77.209 };
const PINNED_FALLBACK_LABEL = 'Pinned location';

type Step = 'pin' | 'details';

/** Map centers within this distance count as "not moved" (the camera settles with float drift). */
const SAME_POINT_TOLERANCE_KM = 0.02;

function isSamePoint(a: GeoPoint | null, b: GeoPoint): boolean {
  return a !== null && distanceKm(a, b) < SAME_POINT_TOLERANCE_KM;
}

export function SelectLocationMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const picker = parseMapPickerParams(useLocalSearchParams());
  const kind = picker.mode === 'confirm' ? picker.kind : 'drop';
  const isPickup = kind === 'pickup';
  const initialRegion = (picker.mode !== 'pin' && picker.region) || DEFAULT_CENTER;

  const draft = useTripStore.use.draft();
  const { data: addresses } = useSavedAddresses();
  const savedAddress =
    picker.mode === 'confirm' ? addresses?.find((a) => a.id === picker.addressId) : undefined;
  const updateAddress = useUpdateAddress();
  const saveContact = useSaveAddressContact();
  const currentLabel = isPickup ? draft.pickupLabel : draft.dropLabel;

  const [step, setStep] = useState<Step>(picker.mode === 'pin' ? 'pin' : 'details');
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editName, setEditName] = useState(picker.mode === 'edit' ? picker.name : '');
  const [editAddress, setEditAddress] = useState(picker.mode === 'edit' ? picker.address : '');
  const contactForm = useContactDetailsForm(kind, {
    contactName: savedAddress?.contact?.name,
    contactPhone: savedAddress?.contact?.phone,
  });

  // The sheet covers the bottom of the map, so the camera (and the fixed pin)
  // center on the visible area between header and sheet.
  const cameraPadding = { top: insets.top + 80, bottom: sheetHeight + insets.bottom + 24 };
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

  const saveLocation = (region: GeoPoint, label: string) => {
    const trip = useTripStore.getState();
    if (isPickup) trip.setPickup(label, region);
    else trip.setDrop(label, region);
    committedRegionRef.current = region;
  };

  const handleUseCurrentLocation = async () => {
    const position = await location.locateUser();
    if (!position) return;
    animateTo(position, 500);
    saveLocation(position, await reverseGeocodeLabel(position, 'Current location'));
  };

  const handleConfirmPin = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    const region = center;
    saveLocation(region, await reverseGeocodeLabel(region, PINNED_FALLBACK_LABEL));
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
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Could not save address', getErrorMessage(error)),
      },
    );
  };

  const handleSaveDetails = async () => {
    const details = contactForm.submit();
    if (!details) return;

    const region = center;
    if (!isSamePoint(committedRegionRef.current, region)) {
      saveLocation(
        region,
        await reverseGeocodeLabel(region, currentLabel || PINNED_FALLBACK_LABEL),
      );
    }

    const trip = useTripStore.getState();
    const houseNumber = savedAddress?.contact?.houseNumber ?? '';
    const stopDetails = { houseNumber, ...details };
    if (isPickup) trip.setPickupDetails(stopDetails);
    else trip.setDropDetails(stopDetails);
    if (savedAddress) {
      // Remembered server-side so picking this place again pre-fills the contact.
      saveContact.mutate({
        id: savedAddress.id,
        name: details.contactName,
        phone: details.contactPhone,
        houseNumber,
      });
    }

    if (isPickup) {
      // Pickup is edited from the drop search screen — return to it.
      router.back();
    } else {
      // `replace` so the map picker isn't left stale in the back stack.
      router.replace('/trip-confirmation');
    }
  };

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />

      <OlaMapView
        style={{ position: 'absolute', inset: 0 }}
        compass={false}
        onDidFinishLoadingMap={handleMapReady}
        onRegionDidChange={(event) => {
          const [longitude, latitude] = event.nativeEvent.center;
          setCenter({ latitude, longitude });
        }}
      >
        <OlaMapCamera
          ref={cameraRef}
          initialViewState={{
            center: [initialRegion.longitude, initialRegion.latitude],
            zoom: zoom,
            padding: cameraPadding,
          }}
        />
        {location.hasPermission ? <OlaMapUserLocation /> : null}
      </OlaMapView>

      <DeliveryPin
        paddingTop={cameraPadding.top}
        paddingBottom={cameraPadding.bottom}
        showLabel={step === 'pin'}
      />
      <ScreenHeader floating onBack={() => router.back()} />

      {isPickup ? (
        <LocateMeButton
          onPress={handleUseCurrentLocation}
          isLocating={location.isLocating}
          bottomOffset={sheetHeight}
        />
      ) : null}

      <DraggableSheet onDismiss={() => router.back()} onHeightChange={setSheetHeight}>
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
            title={isPickup ? 'Add pickup details' : 'Add drop details'}
            subtitle={currentLabel || PINNED_FALLBACK_LABEL}
            submitLabel="Save address"
            onSubmit={handleSaveDetails}
            bottomInset={insets.bottom}
          >
            <ContactDetailsFields form={contactForm} />
          </LocationDetailsPanel>
        )}
      </DraggableSheet>
    </AppView>
  );
}
