import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { getErrorMessage } from '@/lib/api/api-error';
import { authApi } from '@/lib/api/auth';

import { profileCreationSchema } from '../schema';
import { signOut, useAuthStore } from '../use-auth-store';

type FieldErrors = { name?: string; phone?: string };

export function useOnboardingForm() {
  const router = useRouter();
  const user = useAuthStore.use.user();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({});

  const updateProfile = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updated) => {
      useAuthStore.getState().setUser(updated);
      router.replace('/home');
    },
    onError: (error) => Alert.alert('Could not save profile', getErrorMessage(error)),
  });

  const handleNameChange = (text: string) => {
    setValidationErrors((prev) => ({ ...prev, name: undefined }));
    setName(text);
  };

  const handlePhoneChange = (text: string) => {
    setValidationErrors((prev) => ({ ...prev, phone: undefined }));
    setPhone(text.replace(/[^0-9+\s-]/g, ''));
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
    updateProfile.mutate(result.data);
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
    handlePhoneChange,
    handleSubmit,
    handleSignOut,
  };
}
