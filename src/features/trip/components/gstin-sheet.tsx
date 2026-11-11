import { useState } from 'react';
import { create } from 'zustand';

import { AppText, AppView, Button, IconBadge, TextField } from '@/components/ui';
import { kvStorage } from '@/lib/storage';

import { BookingSheet } from './booking-sheet';

const GSTIN_KEY = 'billing-gstin';
/** 2-digit state code, PAN, entity number, "Z", check character. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const isValidGstin = (value: string) => GSTIN_PATTERN.test(value);

/**
 * The customer's GSTIN, kept on this device. The backend has no place for it yet, so it is not
 * on invoices until a customer-profile field is added there.
 */
export const useGstinStore = create<{
  gstin: string | null;
  setGstin: (value: string | null) => void;
}>((set) => ({
  gstin: kvStorage.getString(GSTIN_KEY),
  setGstin: (value) => {
    if (value) kvStorage.setString(GSTIN_KEY, value);
    else kvStorage.delete(GSTIN_KEY);
    set({ gstin: value });
  },
}));

export interface GstinSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function GstinSheet({ visible, onClose }: GstinSheetProps) {
  const saved = useGstinStore((state) => state.gstin);
  const [value, setValue] = useState(saved ?? '');

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(saved ?? '');
  }

  const complete = value.length === 15;
  const invalid = complete && !isValidGstin(value);

  return (
    <BookingSheet
      visible={visible}
      onClose={onClose}
      title={saved ? 'Your GSTIN' : 'Add GSTIN'}
      footer={
        <AppView className="gap-2">
          <Button
            label="Confirm"
            className="h-14"
            disabled={!complete || invalid}
            onPress={() => {
              useGstinStore.getState().setGstin(value);
              onClose();
            }}
          />
          {saved ? (
            <Button
              label="Remove GSTIN"
              variant="ghost"
              onPress={() => {
                useGstinStore.getState().setGstin(null);
                onClose();
              }}
            />
          ) : null}
        </AppView>
      }
    >
      <AppView className="items-center pb-2">
        <AppView center className="size-20 rounded-full bg-brand-soft">
          <IconBadge
            name="wallet.pass.fill"
            tone="brand"
            iconSize={22}
            className="size-12 rounded-2xl bg-surface"
          />
        </AppView>
        <AppText className="mt-3 text-center text-[14px] leading-[20px] text-muted">
          Add your business GST number to claim Input Tax Credit on your trips.
        </AppText>
      </AppView>

      <GstinField
        value={value}
        onChange={setValue}
        error={invalid ? 'This doesn’t look like a valid GSTIN.' : undefined}
      />
    </BookingSheet>
  );
}

/** The GSTIN input: letters and digits only, upper-cased, 15 characters at most. */
function GstinField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <TextField
      variant="outlined"
      className="mt-3"
      value={value}
      onChangeText={(text) =>
        onChange(
          text
            .replace(/[^0-9a-z]/gi, '')
            .toUpperCase()
            .slice(0, 15),
        )
      }
      placeholder="GSTIN (15 characters)"
      autoCapitalize="characters"
      autoCorrect={false}
      accessibilityLabel="GSTIN"
      error={error}
      hint="For example 29ABCDE1234F1Z5"
    />
  );
}
