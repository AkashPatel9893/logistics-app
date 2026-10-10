import { AppPressable, AppText, AppView, Icon, TextField } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { useContactDetailsForm } from '../hooks/use-contact-details-form';

export interface ContactDetailsFieldsProps {
  form: ReturnType<typeof useContactDetailsForm>;
  /** The signed-in user's 10-digit number; offers a "use my mobile number" shortcut. */
  ownPhone?: string;
}

export function ContactDetailsFields({ form, ownPhone }: ContactDetailsFieldsProps) {
  const usesOwnPhone = Boolean(ownPhone) && form.contactPhone === ownPhone;

  return (
    <>
      <TextField
        variant="outlined"
        accessibilityLabel={`${form.role} name`}
        value={form.contactName}
        onChangeText={form.setContactName}
        placeholder={`${form.role} Name`}
        autoComplete="name"
        error={form.nameError}
        className="mb-3"
      />
      <TextField
        variant="outlined"
        accessibilityLabel={`${form.role} mobile number`}
        value={form.contactPhone}
        onChangeText={form.setContactPhone}
        placeholder={`${form.role} Mobile Number`}
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={10}
        error={form.phoneError}
        className="mb-3"
      />
      {ownPhone ? (
        <AppPressable
          onPress={() => form.setContactPhone(usesOwnPhone ? '' : ownPhone)}
          hitSlop={6}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: usesOwnPhone }}
          accessibilityLabel={`Use my mobile number ${ownPhone}`}
          className="mb-4 flex-row items-center gap-2.5"
        >
          <AppView
            center
            className={cn(
              'size-5 rounded-[5px] border-2',
              usesOwnPhone ? 'border-brand bg-brand' : 'border-border-strong bg-surface',
            )}
          >
            {usesOwnPhone ? <Icon name="checkmark" size={12} tone="brand-foreground" /> : null}
          </AppView>
          <AppText className="text-[14px] font-medium text-foreground">
            Use my mobile number : {ownPhone}
          </AppText>
        </AppPressable>
      ) : null}
    </>
  );
}
