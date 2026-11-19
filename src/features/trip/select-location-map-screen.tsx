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
import { PINNED_FALLBACK_LABEL, useSelectLocationMap } from './hooks/use-select-location-map';

export function SelectLocationMapScreen() {
  const {
    insets,
    picker,
    kind,
    isPickup,
    stopIndex,
    initialRegion,
    zoom,
    center,
    setCenter,
    cameraRef,
    handleMapReady,
    cameraPadding,
    pinOffset,
    userPoint,
    location,
    step,
    sheetHeight,
    setSheetHeight,
    isConfirming,
    isMoving,
    setIsMoving,
    currentLabel,
    currentAddress,
    editName,
    setEditName,
    editAddress,
    setEditAddress,
    houseNumber,
    setHouseNumber,
    contactForm,
    user,
    savedAddress,
    saveAs,
    setSaveAs,
    customName,
    setCustomName,
    takenLabels,
    keyboardHeight,
    isSearchFocused,
    setIsSearchFocused,
    isTypingInSheet,
    isSheetCollapsed,
    setIsSheetCollapsed,
    searchInputRef,
    requestSearchFocus,
    handleSheetCollapsed,
    reopenSheet,
    handleUseCurrentLocation,
    handleSearchSelect,
    handleConfirmPin,
    handleSaveEdit,
    handleSaveDetails,
    goBack,
  } = useSelectLocationMap();

  const pinLabel =
    step === 'pin' || picker.mode === 'edit'
      ? 'Set pin here'
      : isPickup
        ? 'Pickup here'
        : stopIndex !== undefined
          ? `Stop ${stopIndex + 1} here`
          : 'Drop here';

  const searchPlaceholder =
    picker.mode === 'edit'
      ? 'Search a place'
      : isPickup
        ? 'Search pickup location'
        : stopIndex !== undefined
          ? `Search stop ${stopIndex + 1} location`
          : 'Search drop location';

  const expandedHeader =
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
          };

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
            onBack={goBack}
            placeholder={searchPlaceholder}
            inputRef={searchInputRef}
            onRequestFocus={isSheetCollapsed ? undefined : requestSearchFocus}
            topInset={insets.top}
            near={center}
            onSelect={handleSearchSelect}
            onFocusChange={setIsSearchFocused}
          />
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
        onDismiss={goBack}
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
          expanded: expandedHeader,
        }}
      >
        <MapPickerSheetBody
          step={step}
          picker={picker}
          kind={kind}
          isPickup={isPickup}
          stopIndex={stopIndex}
          bottomInset={insets.bottom}
          hasPermission={location.hasPermission}
          isConfirming={isConfirming}
          currentLabel={currentLabel}
          currentAddress={currentAddress}
          editName={editName}
          onChangeEditName={setEditName}
          editAddress={editAddress}
          onChangeEditAddress={setEditAddress}
          houseNumber={houseNumber}
          onChangeHouseNumber={setHouseNumber}
          contactForm={contactForm}
          ownPhone={user?.phone}
          ownName={user?.name}
          hasSavedAddress={Boolean(savedAddress)}
          saveAs={saveAs}
          onChangeSaveAs={setSaveAs}
          takenLabels={takenLabels}
          customName={customName}
          onChangeCustomName={setCustomName}
          onConfirmPin={handleConfirmPin}
          onSaveEdit={handleSaveEdit}
          onSaveDetails={handleSaveDetails}
          onChangeLocation={goBack}
        />
      </DraggableSheet>
    </AppView>
  );
}
