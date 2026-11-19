import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { distanceKm, type GeoPoint } from '@/lib/geo';
import { Alert } from '@/lib/native';
import { goBack, useRouter } from '@/lib/navigation';
import {
  useSaveAddress,
  useSaveAddressContact,
  useSavedAddresses,
  useUpdateAddress,
} from '@/queries';
import { useAuthStore, useTripStore, type TripDraft } from '@/stores';

import type { SaveAsLabel } from '../components/save-as-chips';
import { reverseGeocodePlace } from '../geocoding';
import { mapPickerHref, type MapPickerMode } from '../map-picker-route';
import { alertNotServiceable, isServiceable } from '../serviceability';
import { useContactDetailsForm } from './use-contact-details-form';
import {
  PINNED_FALLBACK_LABEL,
  readSlot,
  toLocalPhone,
  type SlotState,
} from './use-select-location-map';

const SAME_PLACE_KM = 0.1;

interface UseMapLocationDetailsFormOptions {
  picker: MapPickerMode;
  kind: 'pickup' | 'drop';
  isPickup: boolean;
  stopIndex?: number;
  stopKind: 'pickup' | 'drop' | 'stop';
  slot: SlotState;
  draft: TripDraft;
  isRegionCommitted: (region: GeoPoint) => boolean;
  saveLocation: (region: GeoPoint, place: { label: string; address: string }) => void;
}

export function useMapLocationDetailsForm({
  picker,
  kind,
  isPickup,
  stopIndex,
  stopKind,
  slot,
  draft,
  isRegionCommitted,
  saveLocation,
}: UseMapLocationDetailsFormOptions) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: addresses } = useSavedAddresses();
  const savedAddress =
    picker.mode === 'confirm' ? addresses?.find((a) => a.id === picker.addressId) : undefined;
  const updateAddress = useUpdateAddress();
  const saveContact = useSaveAddressContact();
  const saveAddress = useSaveAddress();

  const [saveAs, setSaveAs] = useState<SaveAsLabel | null>(null);
  const [customName, setCustomName] = useState('');
  const takenLabels: SaveAsLabel[] = [
    ...(addresses?.some((a) => a.label === 'home') ? (['home'] as const) : []),
    ...(addresses?.some((a) => a.label === 'work') ? (['shop'] as const) : []),
  ];

  const [editName, setEditName] = useState(picker.mode === 'edit' ? picker.name : '');
  const [editAddress, setEditAddress] = useState(picker.mode === 'edit' ? picker.address : '');

  const ownContact = isPickup ? user : null;
  const [houseNumber, setHouseNumber] = useState(
    slot.details?.houseNumber ?? savedAddress?.contact?.houseNumber ?? '',
  );
  const contactForm = useContactDetailsForm(kind, {
    contactName: slot.details?.contactName ?? savedAddress?.contact?.name ?? ownContact?.name,
    contactPhone: toLocalPhone(
      slot.details?.contactPhone ?? savedAddress?.contact?.phone ?? ownContact?.phone,
    ),
  });

  const fillOwnContact = () => {
    if (user?.name) contactForm.setContactName(user.name);
    if (user?.phone) contactForm.setContactPhone(toLocalPhone(user.phone) ?? '');
  };

  const handleSaveEdit = (region: GeoPoint) => {
    if (picker.mode !== 'edit' || editName.trim().length === 0) return;
    updateAddress.mutate(
      {
        id: picker.addressId,
        name: editName.trim(),
        address: editAddress.trim(),
        location: region,
      },
      {
        onSuccess: () => goBack(router),
        onError: (error) => Alert.alert('Could not save address', getErrorMessage(error)),
      },
    );
  };

  const navigateAfterConfirm = () => {
    if (stopIndex !== undefined) {
      router.dismissTo('/add-stops');
      return;
    }
    if (isPickup && picker.mode === 'confirm' && picker.returnHome) {
      router.dismissTo('/home');
      return;
    }
    if (isPickup) {
      const now = useTripStore.getState().draft;
      if (now.dropRegion && now.dropDetails) router.replace('/trip-confirmation');
      else goBack(router);
      return;
    }
    if (!useTripStore.getState().draft.pickupRegion) {
      router.replace(mapPickerHref({ mode: 'confirm', kind: 'pickup' }));
      return;
    }
    router.replace('/trip-confirmation');
  };

  const handleSaveDetails = async (region: GeoPoint) => {
    const details = contactForm.submit();
    if (!details) return;

    const otherEnd = isPickup ? draft.dropRegion : draft.pickupRegion;
    if (stopIndex === undefined && otherEnd && distanceKm(otherEnd, region) < SAME_PLACE_KM) {
      Alert.alert(
        'Pickup and drop are the same place',
        `Move the pin to where the ${isPickup ? 'parcel is collected' : 'parcel should go'}.`,
      );
      return;
    }

    if (!isRegionCommitted(region)) {
      if (!(await isServiceable(region))) {
        alertNotServiceable(stopKind);
        return;
      }
      saveLocation(region, await reverseGeocodePlace(region, slot.label || PINNED_FALLBACK_LABEL));
    }

    const trip = useTripStore.getState();
    const stopDetails = { houseNumber: houseNumber.trim(), ...details };
    if (stopIndex !== undefined) trip.setStopDetails(stopIndex, stopDetails);
    else if (isPickup) trip.setPickupDetails(stopDetails);
    else trip.setDropDetails(stopDetails);

    if (savedAddress) {
      saveContact.mutate({
        id: savedAddress.id,
        name: details.contactName,
        phone: details.contactPhone,
        houseNumber: stopDetails.houseNumber,
      });
    } else if (saveAs) {
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

    navigateAfterConfirm();
  };

  return {
    houseNumber,
    setHouseNumber,
    contactForm,
    savedAddress,
    ownPhone: user?.phone,
    ownName: user?.name,
    saveAs,
    setSaveAs,
    customName,
    setCustomName,
    takenLabels,
    editName,
    setEditName,
    editAddress,
    setEditAddress,
    fillOwnContact,
    handleSaveEdit,
    handleSaveDetails,
  };
}
