import type { ComponentPropsWithRef } from 'react';
import { TextInput, type TextInputInstance } from 'react-native';

import { cn } from '@/lib/cn';

export type AppTextInputInstance = TextInputInstance;

export interface AppTextInputProps extends ComponentPropsWithRef<typeof TextInput> {
  className?: string;
}

export function AppTextInput({
  className,
  placeholderTextColorClassName = 'accent-icon-subtle',
  cursorColorClassName = 'accent-brand',
  selectionColorClassName = 'accent-brand/30',
  ...props
}: AppTextInputProps) {
  return (
    <TextInput
      placeholderTextColorClassName={placeholderTextColorClassName}
      cursorColorClassName={cursorColorClassName}
      selectionColorClassName={selectionColorClassName}
      className={cn('text-foreground', className)}
      {...props}
    />
  );
}
