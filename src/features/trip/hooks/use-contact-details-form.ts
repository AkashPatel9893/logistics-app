import { useState } from 'react';

const PHONE_LENGTH = 10;

export interface ContactDetails {
  contactName: string;
  contactPhone: string;
}

/** Sender/receiver name + phone with validation shown after the first submit. */
export function useContactDetailsForm(kind: 'pickup' | 'drop', initial?: Partial<ContactDetails>) {
  const [contactName, setContactName] = useState(initial?.contactName ?? '');
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? '');
  const [showErrors, setShowErrors] = useState(false);

  const role = kind === 'pickup' ? "Sender's" : "Receiver's";
  const name = contactName.trim();
  const phone = contactPhone.trim();

  const nameError = name.length === 0 ? `${role} name is required` : undefined;
  const phoneError =
    phone.length === 0
      ? `${role} phone number is required`
      : phone.length !== PHONE_LENGTH || !/^\d+$/.test(phone)
        ? 'Enter a valid 10-digit phone number'
        : undefined;

  /** Returns trimmed details when valid; otherwise reveals errors and returns null. */
  const submit = (): ContactDetails | null => {
    if (nameError || phoneError) {
      setShowErrors(true);
      return null;
    }
    return { contactName: name, contactPhone: phone };
  };

  return {
    role,
    contactName,
    contactPhone,
    setContactName,
    setContactPhone: (text: string) => setContactPhone(text.replace(/\D/g, '')),
    nameError: showErrors ? nameError : undefined,
    phoneError: showErrors ? phoneError : undefined,
    submit,
  };
}
