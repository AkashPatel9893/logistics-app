import {
  AppKeyboardAwareScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  TextField,
} from '@/components/ui';

import { HeroBanner } from './components/hero-banner';
import { useLoginForm } from './hooks/use-login-form';

export function LoginScreen() {
  const form = useLoginForm();

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <AppKeyboardAwareScrollView
        // Scrolls in step with the keyboard animation; the offset keeps the Continue button visible.
        bottomOffset={144}
        className="flex-1 pt-safe"
      >
        <HeroBanner />

        <AppView className="px-6 pb-16 pt-2.5">
          <AppText className="text-2xl font-bold text-foreground">Lets get started</AppText>
          <AppText className="mt-1 text-sm font-normal text-muted">
            Login/ Signup with Mobile
          </AppText>

          <TextField
            variant="outlined"
            value={form.phone}
            onChangeText={form.handlePhoneChange}
            placeholder="00000 00000"
            accessibilityLabel="Mobile number"
            keyboardType="number-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={10}
            leading={<AppText className="mr-3 text-[16px] font-bold text-foreground">+91</AppText>}
            returnKeyType="done"
            onSubmitEditing={form.handleContinue}
            error={form.validationError ?? undefined}
            className="mt-4"
            inputClassName="text-[16px]"
          />

          <AppView className="mt-4">
            <Button
              label={form.isLoading ? 'Sending code...' : 'Continue'}
              onPress={form.handleContinue}
              disabled={!form.isPhoneValid}
              loading={form.isLoading}
              textClassName="font-bold"
            />
          </AppView>
        </AppView>
      </AppKeyboardAwareScrollView>
    </AppView>
  );
}
