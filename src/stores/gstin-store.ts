import { create } from 'zustand';

import { kvStorage } from '@/lib/storage';

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
