import { TextField } from '@/components/ui';

import type { useContactDetailsForm } from '../hooks/use-contact-details-form';

export function ContactDetailsFields({ form }: { form: ReturnType<typeof useContactDetailsForm> }) {
  return (
    <>
      <TextField
        label={`${form.role} name`}
        value={form.contactName}
        onChangeText={form.setContactName}
        placeholder="Who should we contact?"
        autoComplete="name"
        error={form.nameError}
        className="mb-3"
      />
      <TextField
        label={`${form.role} phone number`}
        value={form.contactPhone}
        onChangeText={form.setContactPhone}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={10}
        error={form.phoneError}
        className="mb-3"
      />
    </>
  );
}
