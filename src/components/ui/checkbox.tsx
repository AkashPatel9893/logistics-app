import React from 'react';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { cn } from '@/lib/cn';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  testID,
}: CheckboxProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <AppPressable
      onPress={handleToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      testID={testID}
      className={cn('flex-row items-center gap-3', disabled && 'opacity-50', className)}
    >
      <AppView
        className={cn(
          'w-6 h-6 rounded-lg items-center justify-center border-[1.5px] transition-colors',
          checked
            ? 'bg-orange-500 border-orange-500'
            : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700',
        )}
      >
        {checked && (
          <AppText className="text-white text-xs font-bold leading-none -mt-0.5">✓</AppText>
        )}
      </AppView>

      {label && (
        <AppText className="text-base font-normal text-neutral-800 dark:text-neutral-200">
          {label}
        </AppText>
      )}
    </AppPressable>
  );
}
