import {
  AppMapCamera,
  AppMapUserLocation,
  AppMapView,
  AppView,
  FocusAwareStatusBar,
} from '@/components/ui';

import { DeliveryPin } from './components/delivery-pin';
import { DraggableSheet } from './components/draggable-sheet';
import { LocateMeButton } from './components/locate-me-button';
import { MapPickerSheetBody } from './components/map-picker-sheet-body';
import { MapSearchBar } from './components/map-search-bar';
import { useMapLocationDetailsForm } from './hooks/use-map-location-details-form';
import { useMapPinFraming } from './hooks/use-map-pin-framing';
import { useMapSheetSearchFocus } from './hooks/use-map-sheet-search-focus';
import { usePinAddress } from './hooks/use-pin-address';
import {
  PINNED_FALLBACK_LABEL,
  useSelectLocationMap,
  type PickerStep,
} from './hooks/use-select-location-map';
import type { MapPickerMode } from './map-picker-route';

function resolveSheetCopy(
  step: PickerStep,
  mode: MapPickerMode['mode'],
  isPickup: boolean,
  stopIndex?: number,
) {
  const pinLabel =
    step === 'pin' || mode === 'edit'
      ? 'Set pin here'
      : isPickup
        ? 'Pickup here'
        : stopIndex !== undefined
          ? `Stop ${stopIndex + 1} here`
          : 'Drop here';

  const searchPlaceholder =
    mode === 'edit'
      ? 'Search a place'
      : isPickup
        ? 'Search pickup location'
        : stopIndex !== undefined
          ? `Search stop ${stopIndex + 1} location`
          : 'Search drop location';

  const expandedHeader =
    step === 'pin'
      ? { title: 'Set the exact spot', subtitle: 'Move the map under the pin' }
      : mode === 'edit'
        ? { title: 'Edit location', subtitle: 'Name and address of this place' }
        : {
            title:
              stopIndex !== undefined
                ? `Stop ${stopIndex + 1} details`
                : isPickup
                  ? 'Pickup details'
                  : 'Drop details',
            subtitle: isPickup ? 'Who hands over the goods' : 'Who receives the goods',
          };

  return { pinLabel, searchPlaceholder, expandedHeader };
}

export function SelectLocationMapScreen() {
  const map = useSelectLocationMap();
  const detailsForm = useMapLocationDetailsForm({
    picker: map.picker,
    kind: map.kind,
    isPickup: map.isPickup,
    stopIndex: map.stopIndex,
    stopKind: map.stopKind,
    slot: map.slot,
    draft: map.draft,
    isRegionCommitted: map.isRegionCommitted,
    saveLocation: map.saveLocation,
  });
  const {
    initialRegion,
    zoom,
    center,
    setCenter,
    isMoving,
    setIsMoving,
    pinOffset,
    cameraPadding,
    userPoint,
    cameraRef,
    handleMapReady,
    location,
    handleSearchSelect,
    handleUseCurrentLocation,
  } = useMapPinFraming({
    picker: map.picker,
    isPickup: map.isPickup,
    stopKind: map.stopKind,
    dropRegion: map.draft.dropRegion,
    step: map.step,
    sheetHeight: map.sheetHeight,
    topInset: map.insets.top,
    bottomInset: map.insets.bottom,
    onAddressResolved: map.markRegionCommitted,
    onSaveLocation: map.saveLocation,
    onPickupLocated: detailsForm.fillOwnContact,
  });
  const pinAddress = usePinAddress(map.step === 'pin' ? center : null, isMoving);
  const {
    isSheetCollapsed,
    setIsSheetCollapsed,
    isSearchFocused,
    setIsSearchFocused,
    isTypingInSheet,
    keyboardHeight,
    searchInputRef,
    requestSearchFocus,
    handleSheetCollapsed,
    reopenSheet,
  } = useMapSheetSearchFocus();

  const { pinLabel, searchPlaceholder, expandedHeader } = resolveSheetCopy(
    map.step,
    map.picker.mode,
    map.isPickup,
    map.stopIndex,
  );

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />

      <AppMapView
        className="absolute inset-0"
        compass={false}
        onDidFinishLoadingMap={handleMapReady}
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
            zoom,
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
        label={pinLabel}
      />

      {isTypingInSheet ? null : (
        <>
          <MapSearchBar
            onBack={map.goBack}
            placeholder={searchPlaceholder}
            inputRef={searchInputRef}
            onRequestFocus={isSheetCollapsed ? undefined : requestSearchFocus}
            topInset={map.insets.top}
            near={center}
            onSelect={handleSearchSelect}
            onFocusChange={setIsSearchFocused}
          />
          {isSearchFocused ? null : (
            <LocateMeButton
              onPress={handleUseCurrentLocation}
              isLocating={location.isLocating}
              bottomOffset={isSheetCollapsed ? map.insets.bottom + 64 + 24 : map.sheetHeight}
            />
          )}
        </>
      )}

      <DraggableSheet
        onDismiss={map.goBack}
        onHeightChange={map.setSheetHeight}
        collapsed={isSheetCollapsed}
        onCollapsedChange={(next) => (next ? setIsSheetCollapsed(true) : reopenSheet())}
        onCollapseEnd={handleSheetCollapsed}
        hidden={isSheetCollapsed && keyboardHeight > 0}
        header={{
          collapsed: {
            title:
              map.step === 'pin'
                ? pinAddress.isLooking
                  ? 'Finding address…'
                  : pinAddress.place?.label || pinAddress.place?.address || PINNED_FALLBACK_LABEL
                : map.slot.label || PINNED_FALLBACK_LABEL,
            subtitle: map.step === 'pin' ? 'Tap to confirm this spot' : 'Tap to add details',
          },
          expanded: expandedHeader,
        }}
      >
        <MapPickerSheetBody
          step={map.step}
          mode={map.picker.mode}
          kind={map.kind}
          bottomInset={map.insets.bottom}
          pin={{
            hasPermission: location.hasPermission,
            isConfirming: map.isConfirming,
            onConfirm: () => map.confirmPin(center),
            address: pinAddress.place,
            isFindingAddress: pinAddress.isLooking,
          }}
          place={{
            label: map.slot.label,
            address: map.slot.address,
            onChangeLocation: map.goBack,
          }}
          editForm={{
            name: detailsForm.editName,
            onChangeName: detailsForm.setEditName,
            address: detailsForm.editAddress,
            onChangeAddress: detailsForm.setEditAddress,
            isSaving: detailsForm.isUpdating,
            onSave: () => detailsForm.handleSaveEdit(center),
          }}
          detailsForm={{
            showHouseNumber: map.isPickup && map.stopIndex === undefined,
            houseNumber: detailsForm.houseNumber,
            onChangeHouseNumber: detailsForm.setHouseNumber,
            contactForm: detailsForm.contactForm,
            ownPhone: detailsForm.ownPhone,
            ownName: detailsForm.ownName,
            hasSavedAddress: Boolean(detailsForm.savedAddress),
            saveAs: detailsForm.saveAs,
            onChangeSaveAs: detailsForm.setSaveAs,
            takenLabels: detailsForm.takenLabels,
            customName: detailsForm.customName,
            onChangeCustomName: detailsForm.setCustomName,
            isSaving: detailsForm.isSaving,
            onSave: () => detailsForm.handleSaveDetails(center),
          }}
        />
      </DraggableSheet>
    </AppView>
  );
}
