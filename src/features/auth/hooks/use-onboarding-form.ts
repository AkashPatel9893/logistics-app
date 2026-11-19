import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { Alert } from '@/lib/native';
import { useRouter } from '@/lib/navigation';
import { useUpdateProfile } from '@/queries';
import { signOut, useAuthStore } from '@/stores';

import { profileCreationSchema } from '../schema';

type FieldErrors = { name?: string; phone?: string };

export function useOnboardingForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name ?? '');
  const phone = (user?.phone ?? '').replace(/\D/g, '').slice(-10);
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({});

  const updateProfile = useUpdateProfile();

  const handleNameChange = (text: string) => {
    setValidationErrors((prev) => ({ ...prev, name: undefined }));
    setName(text);
  };

  const handleSubmit = () => {
    if (updateProfile.isPending) return;
    const result = profileCreationSchema.safeParse({ name, phone, usageType: 'personal' });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'name') errors.name = issue.message;
        if (issue.path[0] === 'phone') errors.phone = issue.message;
      }
      setValidationErrors(errors);
      return;
    }
    updateProfile.mutate(result.data, {
      onSuccess: () => router.replace('/home'),
      onError: (error) => Alert.alert('Could not save profile', getErrorMessage(error)),
    });
  };

  const handleSignOut = () => {
    Alert.alert('Switch Account', 'Are you sure you want to go back and use a different account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch Account',
        style: 'destructive',
        onPress: () => {
          signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return {
    name,
    phone,
    isLoading: updateProfile.isPending,
    isFormValid: name.trim().length >= 2 && phone.trim().length >= 10,
    validationErrors,
    handleNameChange,
    handleSubmit,
    handleSignOut,
  };
}
