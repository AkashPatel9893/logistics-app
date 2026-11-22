import {
  AnimatedView,
  AppKeyboardAwareScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  LiquidGlassBackButton,
  TextField,
} from '@/components/ui';
import { enterFromBelow } from '@/lib/motion';

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
        <AnimatedView entering={enterFromBelow(0)}>
          <AppText className="text-[28px] font-extrabold tracking-tight text-foreground">
            Edit profile
          </AppText>
          <AppText className="mt-1.5 text-[14px] text-muted">
            Your name, phone number and email.
          </AppText>
        </AnimatedView>
        <AnimatedView entering={enterFromBelow(1)} className="mt-7 gap-4">
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
        </AnimatedView>

        <AnimatedView entering={enterFromBelow(2)} className="mt-8 border-t border-divider pt-6">
          <EmailVerification />
        </AnimatedView>
      </AppKeyboardAwareScrollView>
    </AppView>
  );
}
