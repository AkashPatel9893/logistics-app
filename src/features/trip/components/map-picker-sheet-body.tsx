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

export interface MapPickerPinProps {
  hasPermission: boolean | null;
  isConfirming: boolean;
  onConfirm: () => void;
}

export interface MapPickerPlaceProps {
  label: string;
  address: string;
  onChangeLocation: () => void;
}

export interface MapPickerEditFormProps {
  name: string;
  onChangeName: (value: string) => void;
  address: string;
  onChangeAddress: (value: string) => void;
  onSave: () => void;
}

export interface MapPickerDetailsFormProps {
  showHouseNumber: boolean;
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
  onSave: () => void;
}

export interface MapPickerSheetBodyProps {
  step: PickerStep;
  mode: MapPickerMode['mode'];
  kind: 'pickup' | 'drop';
  bottomInset: number;
  pin: MapPickerPinProps;
  place: MapPickerPlaceProps;
  editForm: MapPickerEditFormProps;
  detailsForm: MapPickerDetailsFormProps;
}

export function MapPickerSheetBody({
  step,
  mode,
  kind,
  bottomInset,
  pin,
  place,
  editForm,
  detailsForm,
}: MapPickerSheetBodyProps) {
  if (step === 'pin') {
    return (
      <PinStepPanel
        isPermissionDenied={pin.hasPermission === false}
        isConfirming={pin.isConfirming}
        onConfirm={pin.onConfirm}
        bottomInset={bottomInset}
      />
    );
  }

  if (mode === 'edit') {
    return (
      <LocationDetailsPanel
        title="Edit location"
        submitLabel="Save changes"
        onSubmit={editForm.onSave}
        bottomInset={bottomInset}
      >
        <TextField
          label="Label"
          value={editForm.name}
          onChangeText={editForm.onChangeName}
          placeholder="e.g. Home, Work"
          className="mb-3"
        />
        <TextField
          label="Address"
          value={editForm.address}
          onChangeText={editForm.onChangeAddress}
          placeholder="Full address"
          className="mb-3"
        />
      </LocationDetailsPanel>
    );
  }

  return (
    <LocationDetailsPanel
      title={place.label || PINNED_FALLBACK_LABEL}
      subtitle={place.address}
      stop={kind}
      submitLabel={detailsForm.contactForm.isValid ? 'Confirm & Proceed' : 'Enter Contact Details'}
      submitVariant="primary"
      onSubmit={detailsForm.onSave}
      onChangeLocation={place.onChangeLocation}
      bottomInset={bottomInset}
    >
      {detailsForm.showHouseNumber ? (
        <TextField
          variant="outlined"
          value={detailsForm.houseNumber}
          onChangeText={detailsForm.onChangeHouseNumber}
          placeholder="House / Apartment / Shop (optional)"
          accessibilityLabel="House, apartment or shop (optional)"
          className="mb-3"
        />
      ) : null}
      <ContactDetailsFields
        form={detailsForm.contactForm}
        ownPhone={toLocalPhone(detailsForm.ownPhone)}
        ownName={detailsForm.ownName ?? undefined}
      />
      {detailsForm.hasSavedAddress ? null : (
        <SaveAsChips
          value={detailsForm.saveAs}
          onChange={detailsForm.onChangeSaveAs}
          taken={detailsForm.takenLabels}
          customName={detailsForm.customName}
          onChangeCustomName={detailsForm.onChangeCustomName}
        />
      )}
    </LocationDetailsPanel>
  );
}
