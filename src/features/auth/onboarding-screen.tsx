import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  LiquidGlassBackButton,
  TextField,
} from '@/components/ui';

import { useOnboardingForm } from './hooks/use-onboarding-form';

function CountryCode() {
  return (
    <AppView row className="mr-2.5 border-r border-border pr-2.5">
      <Icon name="phone" size={16} tone="icon-subtle" />
      <AppText className="ml-1.5 text-[14px] font-bold text-foreground-secondary">+91</AppText>
    </AppView>
  );
}

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const form = useOnboardingForm();

  return (
    <AppView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <AppKeyboardAvoidingView>
        <AppScrollView
          style={{ paddingTop: insets.top + 8 }}
          contentContainerClassName="px-6 pb-12"
        >
          <AppView className="mb-4 min-h-[48px] justify-center">
            <LiquidGlassBackButton onPress={form.handleSignOut} />
          </AppView>

          <AppView className="mb-6 mt-2">
            <AppText className="text-[28px] font-extrabold leading-8 tracking-tight text-foreground">
              Complete your profile
            </AppText>
            <AppText className="mt-1.5 text-[14px] leading-5 text-muted">
              Set up your account details before heading to the dashboard.
            </AppText>
          </AppView>

          <AppView className="mt-2 gap-4">
            <TextField
              variant="outlined"
              label="Full Name"
              required
              value={form.name}
              onChangeText={form.handleNameChange}
              placeholder="e.g. John Doe"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              error={form.validationErrors.name}
              leading={<Icon name="person" size={18} tone="icon-subtle" />}
              inputClassName="ml-3"
            />
            <TextField
              variant="outlined"
              label="Phone Number"
              required
              value={form.phone}
              onChangeText={form.handlePhoneChange}
              placeholder="98765 43210"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={15}
              error={form.validationErrors.phone}
              hint="Couriers will call this number for pickup & delivery coordination."
              leading={<CountryCode />}
            />
          </AppView>

          <AppView className="mt-8">
            <Button
              label={form.isLoading ? 'Creating Profile...' : 'Complete Profile & Continue'}
              onPress={form.handleSubmit}
              disabled={!form.isFormValid}
              loading={form.isLoading}
              textClassName="font-bold"
            />
            <AppText className="mt-3 px-4 text-center text-[11px] text-subtle">
              By proceeding, you agree to our Terms of Service & Privacy Policy.
            </AppText>
          </AppView>
        </AppScrollView>
      </AppKeyboardAvoidingView>
    </AppView>
  );
}
