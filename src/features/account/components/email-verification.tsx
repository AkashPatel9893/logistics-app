import { AnimatedView, AppText, AppView, Button, Icon, TextField } from '@/components/ui';
import { DURATION, ENTER_EASE_OUT, FadeInDown } from '@/lib/motion';

import { useEmailVerification } from '../hooks/use-email-verification';

export function EmailVerification() {
  const email = useEmailVerification();

  return (
    <AppView className="gap-3">
      <TextField
        variant="outlined"
        label="Email"
        value={email.value}
        onChangeText={email.handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        maxLength={254}
        error={email.sentTo ? undefined : email.error}
        hint={email.isSavedAndVerified ? undefined : "We'll send a code to confirm it."}
        leading={
          email.isSavedAndVerified ? (
            <Icon name="checkmark.circle.fill" size={16} tone="success" />
          ) : null
        }
      />

      {email.sentTo ? (
        <AnimatedView
          entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}
          className="gap-3"
        >
          <AppText className="text-[13px] text-muted">
            Enter the code we sent to{' '}
            <AppText className="font-bold text-foreground">{email.sentTo}</AppText>
          </AppText>
          <TextField
            variant="outlined"
            label="Verification code"
            value={email.code}
            onChangeText={email.handleCodeChange}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={8}
            error={email.error}
          />
          <AppView row className="gap-3">
            <Button
              label="Resend"
              variant="outline"
              className="flex-1"
              loading={email.isSending}
              onPress={email.sendCode}
            />
            <Button
              label="Verify"
              className="flex-1"
              disabled={email.code.length < 4}
              loading={email.isVerifying}
              onPress={email.confirm}
            />
          </AppView>
        </AnimatedView>
      ) : email.isSavedAndVerified ? (
        <AppText className="text-[13px] font-semibold text-success">Email verified</AppText>
      ) : (
        <Button
          label={email.isSavedUnverified ? 'Verify email' : 'Send code'}
          variant="outline"
          disabled={!email.trimmed}
          loading={email.isSending}
          onPress={email.sendCode}
        />
      )}
    </AppView>
  );
}
