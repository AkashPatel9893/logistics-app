import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  TextField,
} from '@/components/ui';

import { HeroBanner } from './components/hero-banner';
import { LanguagePickerSheet } from './components/language-picker-sheet';
import { LanguagePill } from './components/language-pill';
import { useLoginForm } from './hooks/use-login-form';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const form = useLoginForm();

  return (
    <AppView className="flex-1 bg-canvas">
      <FocusAwareStatusBar />
      <AppKeyboardAvoidingView>
        <AppScrollView style={{ paddingTop: insets.top }} contentContainerClassName="pb-6">
          <HeroBanner />

          <AppView className="px-6 pt-20">
            <AppText className="text-2xl font-bold text-foreground">Lets get started</AppText>
            <AppText className="mt-1 text-sm font-normal text-muted">
              Login/ Signup with Email
            </AppText>

            <TextField
              variant="outlined"
              value={form.email}
              onChangeText={form.handleEmailChange}
              placeholder="you@example.com"
              accessibilityLabel="Email address"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={form.handleContinue}
              error={form.validationError ?? undefined}
              className="mt-4"
              inputClassName="text-[16px]"
            />

            <AppView className="mt-4">
              <Button
                label={form.isLoading ? 'Sending code...' : 'Continue'}
                onPress={form.handleContinue}
                disabled={!form.isEmailValid}
                loading={form.isLoading}
                textClassName="font-bold"
              />
            </AppView>

            <AppView className="mt-6">
              <LanguagePill
                language={form.language}
                onPress={() => form.setShowLanguageSheet(true)}
              />
            </AppView>
          </AppView>
        </AppScrollView>
      </AppKeyboardAvoidingView>

      <LanguagePickerSheet
        languages={form.languages}
        isPresented={form.showLanguageSheet}
        selectedLanguage={form.language}
        onSelect={form.handleLanguageSelect}
        onDismiss={() => form.setShowLanguageSheet(false)}
      />
    </AppView>
  );
}
