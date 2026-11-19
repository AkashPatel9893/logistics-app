import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { useIdentity, useRequestEmailCode, useVerifyEmail } from '@/queries';

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
