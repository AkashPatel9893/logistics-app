import { useState } from 'react';

import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import { useIdentity, useRequestEmailCode, useVerifyEmail } from '@/queries';

/** The server's text for a bad code is technical ("Invalid OTP"). */
const CODE_ERRORS: Record<string, string> = {
  OTP_INVALID: 'Wrong code. Check the email and try again.',
  OTP_EXPIRED: 'The code has expired. Send a new one.',
  OTP_ATTEMPTS_EXCEEDED: 'Too many wrong tries. Send a new code.',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useEmailVerification() {
  const { data: identity } = useIdentity();
  const requestCode = useRequestEmailCode();
  const verify = useVerifyEmail();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const value = email ?? identity?.email ?? '';
  const trimmed = value.trim().toLowerCase();
  const isSavedAndVerified =
    !!identity?.emailVerified && trimmed === (identity.email ?? '').toLowerCase();
  const isSavedUnverified =
    !!identity?.email && trimmed === identity.email.toLowerCase() && !isSavedAndVerified;

  const handleEmailChange = (next: string) => {
    setEmail(next);
    setSentTo(null);
    setError(undefined);
  };

  const handleCodeChange = (next: string) => {
    setCode(next.replace(/\D/g, ''));
    setError(undefined);
  };

  const sendCode = () => {
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(undefined);
    requestCode.mutate(trimmed, {
      onSuccess: () => {
        setSentTo(trimmed);
        setCode('');
      },
      onError: (e) => setError(getErrorMessage(e)),
    });
  };

  const confirm = () => {
    if (!sentTo) return;
    setError(undefined);
    verify.mutate(
      { email: sentTo, code },
      {
        onSuccess: () => {
          setSentTo(null);
          setEmail(null);
          setCode('');
        },
        onError: (e) =>
          setError((e instanceof ApiError && e.code && CODE_ERRORS[e.code]) || getErrorMessage(e)),
      },
    );
  };

  return {
    value,
    trimmed,
    code,
    sentTo,
    error,
    isSavedAndVerified,
    isSavedUnverified,
    isSending: requestCode.isPending,
    isVerifying: verify.isPending,
    handleEmailChange,
    handleCodeChange,
    sendCode,
    confirm,
  };
}
