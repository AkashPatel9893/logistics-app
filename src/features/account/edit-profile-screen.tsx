import {
  AppKeyboardAwareScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  LiquidGlassBackButton,
  TextField,
} from '@/components/ui';

import { EmailVerification } from './components/email-verification';
import { useEditProfileForm } from './hooks/use-edit-profile-form';

export function EditProfileScreen() {
  const form = useEditProfileForm();

  return (
    <AppView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <AppKeyboardAwareScrollView
        bottomOffset={120}
        className="flex-1 pt-safe-offset-2"
        contentContainerClassName="px-6 pb-12"
      >
        <AppView className="mb-4 min-h-[48px] justify-center">
          <LiquidGlassBackButton onPress={form.navigateBack} />
        </AppView>
        <AppText className="text-[28px] font-extrabold tracking-tight text-foreground">
          Edit profile
        </AppText>
        <AppText className="mt-1.5 text-[14px] text-muted">
          Your name, phone number and email.
        </AppText>
        <AppView className="mt-7 gap-4">
          <TextField
            variant="outlined"
            label="Full name"
            value={form.name}
            onChangeText={form.handleNameChange}
            autoCapitalize="words"
            autoComplete="name"
            maxLength={160}
            error={form.nameError}
          />
          <AppView className="opacity-60">
            <TextField
              variant="outlined"
              label="Phone number"
              value={form.phone}
              editable={false}
              accessibilityState={{ disabled: true }}
              hint="Phone number cannot be changed here."
            />
          </AppView>
          <Button label="Save name" loading={form.isSaving} onPress={form.handleSave} />
        </AppView>

        <AppView className="mt-8 border-t border-divider pt-6">
          <EmailVerification />
        </AppView>
      </AppKeyboardAwareScrollView>
    </AppView>
  );
}
