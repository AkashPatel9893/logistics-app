import { useState } from 'react';
import { FadeInDown } from 'react-native-reanimated';

import { AnimatedView, AppText, AppView, Button, Icon, TextField } from '@/components/ui';
import { useIdentity, useRequestEmailCode, useVerifyEmail } from '@/hooks/use-content';
import { getErrorMessage } from '@/lib/api/api-error';
import { DURATION, ENTER_EASE_OUT } from '@/lib/motion';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Adds or changes the account email: the backend mails a code, the customer types it here, and
 * the address is saved as verified.
 */
export function EmailVerification() {
  const { data: identity } = useIdentity();
  const requestCode = useRequestEmailCode();
  const verify = useVerifyEmail();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  // Until the customer types, the field shows the saved address.
  const value = email ?? identity?.email ?? '';
  const trimmed = value.trim().toLowerCase();
  const isSavedAndVerified =
    !!identity?.emailVerified && trimmed === (identity.email ?? '').toLowerCase();

  const sendCode = () => {
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    requestCode.mutate(trimmed, {
      onSuccess: () => {
        setSentTo(trimmed);
        setCode('');
      },
      onError: (e) => setError(getErrorMessage(e)),
    });
  };

  const confirm = () =>
    sentTo &&
    verify.mutate(
      { email: sentTo, code },
      {
        onSuccess: () => {
          setSentTo(null);
          setEmail(null);
          setCode('');
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );

  return (
    <AppView className="gap-3">
      <TextField
        variant="outlined"
        label="Email"
        value={value}
        onChangeText={(next) => {
          setEmail(next);
          setSentTo(null);
          setError(undefined);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        maxLength={254}
        error={sentTo ? undefined : error}
        hint={isSavedAndVerified ? undefined : "We'll send a code to confirm it."}
        leading={
          isSavedAndVerified ? <Icon name="checkmark.circle.fill" size={16} tone="success" /> : null
        }
      />

      {sentTo ? (
        <AnimatedView
          entering={FadeInDown.duration(DURATION.enter).easing(ENTER_EASE_OUT)}
          className="gap-3"
        >
          <AppText className="text-[13px] text-muted">
            Enter the code we sent to{' '}
            <AppText className="font-bold text-foreground">{sentTo}</AppText>
          </AppText>
          <TextField
            variant="outlined"
            label="Verification code"
            value={code}
            onChangeText={(next) => {
              setCode(next.replace(/\D/g, ''));
              setError(undefined);
            }}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={8}
            error={error}
          />
          <AppView row className="gap-3">
            <Button
              label="Resend"
              variant="outline"
              className="flex-1"
              loading={requestCode.isPending}
              onPress={sendCode}
            />
            <Button
              label="Verify"
              className="flex-1"
              disabled={code.length < 4}
              loading={verify.isPending}
              onPress={confirm}
            />
          </AppView>
        </AnimatedView>
      ) : isSavedAndVerified ? (
        <AppText className="text-[13px] font-semibold text-success">Email verified</AppText>
      ) : (
        <Button
          label={
            identity?.email && trimmed === identity.email.toLowerCase()
              ? 'Verify email'
              : 'Send code'
          }
          variant="outline"
          disabled={!trimmed}
          loading={requestCode.isPending}
          onPress={sendCode}
        />
      )}
    </AppView>
  );
}
