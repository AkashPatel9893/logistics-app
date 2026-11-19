import { TextField } from '@/components/ui';

import type { useContactDetailsForm } from '../hooks/use-contact-details-form';
import {
  PINNED_FALLBACK_LABEL,
  toLocalPhone,
  type PickerStep,
} from '../hooks/use-select-location-map';
import type { MapPickerMode } from '../map-picker-route';
import { ContactDetailsFields } from './contact-details-fields';
import { LocationDetailsPanel } from './location-details-panel';
import { PinStepPanel } from './pin-step-panel';
import { SaveAsChips, type SaveAsLabel } from './save-as-chips';

export interface MapPickerSheetBodyProps {
  step: PickerStep;
  picker: MapPickerMode;
  kind: 'pickup' | 'drop';
  isPickup: boolean;
  stopIndex?: number;
  bottomInset: number;
  hasPermission: boolean | null;
  isConfirming: boolean;
  currentLabel: string;
  currentAddress: string;
  editName: string;
  onChangeEditName: (value: string) => void;
  editAddress: string;
  onChangeEditAddress: (value: string) => void;
  houseNumber: string;
  onChangeHouseNumber: (value: string) => void;
  contactForm: ReturnType<typeof useContactDetailsForm>;
  ownPhone?: string | null;
  ownName?: string | null;
  hasSavedAddress: boolean;
  saveAs: SaveAsLabel | null;
  onChangeSaveAs: (value: SaveAsLabel | null) => void;
  takenLabels: SaveAsLabel[];
  customName: string;
  onChangeCustomName: (value: string) => void;
  onConfirmPin: () => void;
  onSaveEdit: () => void;
  onSaveDetails: () => void;
  onChangeLocation: () => void;
}

export function MapPickerSheetBody({
  step,
  picker,
  kind,
  isPickup,
  stopIndex,
  bottomInset,
  hasPermission,
  isConfirming,
  currentLabel,
  currentAddress,
  editName,
  onChangeEditName,
  editAddress,
  onChangeEditAddress,
  houseNumber,
  onChangeHouseNumber,
  contactForm,
  ownPhone,
  ownName,
  hasSavedAddress,
  saveAs,
  onChangeSaveAs,
  takenLabels,
  customName,
  onChangeCustomName,
  onConfirmPin,
  onSaveEdit,
  onSaveDetails,
  onChangeLocation,
}: MapPickerSheetBodyProps) {
  if (step === 'pin') {
    return (
      <PinStepPanel
        isPermissionDenied={hasPermission === false}
        isConfirming={isConfirming}
        onConfirm={onConfirmPin}
        bottomInset={bottomInset}
      />
    );
  }

  if (picker.mode === 'edit') {
    return (
      <LocationDetailsPanel
        title="Edit location"
        submitLabel="Save changes"
        onSubmit={onSaveEdit}
        bottomInset={bottomInset}
      >
        <TextField
          label="Label"
          value={editName}
          onChangeText={onChangeEditName}
          placeholder="e.g. Home, Work"
          className="mb-3"
        />
        <TextField
          label="Address"
          value={editAddress}
          onChangeText={onChangeEditAddress}
          placeholder="Full address"
          className="mb-3"
        />
      </LocationDetailsPanel>
    );
  }

  return (
    <LocationDetailsPanel
      title={currentLabel || PINNED_FALLBACK_LABEL}
      subtitle={currentAddress}
      stop={kind}
      submitLabel={contactForm.isValid ? 'Confirm & Proceed' : 'Enter Contact Details'}
      submitVariant="primary"
      onSubmit={onSaveDetails}
      onChangeLocation={onChangeLocation}
      bottomInset={bottomInset}
    >
      {isPickup && stopIndex === undefined ? (
        <TextField
          variant="outlined"
          value={houseNumber}
          onChangeText={onChangeHouseNumber}
          placeholder="House / Apartment / Shop (optional)"
          accessibilityLabel="House, apartment or shop (optional)"
          className="mb-3"
        />
      ) : null}
      <ContactDetailsFields
        form={contactForm}
        ownPhone={toLocalPhone(ownPhone)}
        ownName={ownName ?? undefined}
      />
      {hasSavedAddress ? null : (
        <SaveAsChips
          value={saveAs}
          onChange={onChangeSaveAs}
          taken={takenLabels}
          customName={customName}
          onChangeCustomName={onChangeCustomName}
        />
      )}
    </LocationDetailsPanel>
  );
}
