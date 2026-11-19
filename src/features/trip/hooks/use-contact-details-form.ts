import { useState } from 'react';

const PHONE_LENGTH = 10;

export interface ContactDetails {
  contactName: string;
  contactPhone: string;
}

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

  const submit = (): ContactDetails | null => {
    if (nameError || phoneError) {
      setShowErrors(true);
      return null;
    }
    return { contactName: name, contactPhone: phone };
  };

  const toggleOwnContact = (ownName?: string, ownPhone?: string) => {
    if (!ownPhone) return;
    if (contactPhone === ownPhone) {
      setContactPhone('');
      if (ownName && contactName === ownName) setContactName('');
      return;
    }
    setContactPhone(ownPhone);
    if (ownName && !contactName.trim()) setContactName(ownName);
  };

  return {
    role,
    contactName,
    contactPhone,
    setContactName,
    setContactPhone: (text: string) => setContactPhone(text.replace(/\D/g, '')),
    isValid: !nameError && !phoneError,
    nameError: showErrors ? nameError : undefined,
    phoneError: showErrors ? phoneError : undefined,
    submit,
    toggleOwnContact,
  };
}
