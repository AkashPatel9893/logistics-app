import { useState } from 'react';
import type { KeyboardTypeOptions } from 'react-native';

import { Button, TextField } from '@/components/ui';

export interface AddMethodFormProps {
  placeholder: string;
  submitLabel: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences';
  isSubmitting?: boolean;
  /** Whether the entered value can be submitted. */
  isValid: (value: string) => boolean;
  onSubmit: (value: string) => void;
}

/** Single-field form used to add a UPI ID or card. */
export function AddMethodForm({
  placeholder,
  submitLabel,
  keyboardType,
  maxLength,
  autoCapitalize,
  isSubmitting = false,
  isValid,
  onSubmit,
}: AddMethodFormProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!isValid(value) || isSubmitting) return;
    onSubmit(value.trim());
  };

  return (
    <>
      <TextField
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        className="mb-3"
      />
      <Button
        label={submitLabel}
        variant="brand"
        onPress={handleSubmit}
        loading={isSubmitting}
        className="h-auto py-3"
        textClassName="text-[14px]"
      />
    </>
  );
}
