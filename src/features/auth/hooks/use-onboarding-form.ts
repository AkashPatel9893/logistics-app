import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useThrottleCallback } from '@/lib/throttle';

import { profileCreationSchema } from '../schema';
import { completeOnboarding, signOut, useAuthStore } from '../use-auth-store';

export function useOnboardingForm() {
  const router = useRouter();
  const user = useAuthStore.use.user();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const handleNameChange = (text: string) => {
    setValidationErrors((prev) => ({ ...prev, name: undefined }));
    setName(text);
  };

  const handlePhoneChange = (text: string) => {
    setValidationErrors((prev) => ({ ...prev, phone: undefined }));
    // Filter out non-numeric characters except + or space
    const cleaned = text.replace(/[^0-9+\s-]/g, '');
    setPhone(cleaned);
  };

  const handleSubmit = useThrottleCallback(async () => {
    setValidationErrors({});

    const result = profileCreationSchema.safeParse({
      name,
      phone,
      usageType: 'personal',
    });

    if (!result.success) {
      const fieldErrors: { name?: string; phone?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'name') fieldErrors.name = issue.message;
        if (issue.path[0] === 'phone') fieldErrors.phone = issue.message;
      }
      setValidationErrors(fieldErrors);

      const firstError = result.error.issues[0]?.message ?? 'Please complete all required fields';
      Alert.alert('Incomplete Profile', firstError);
      return;
    }

    setIsLoading(true);
    try {
      completeOnboarding({
        name: result.data.name,
        phone: result.data.phone,
        usageType: result.data.usageType,
      });

      router.replace('/home');
    } catch {
      Alert.alert('Error', 'Unable to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, 1000);

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

  const isFormValid = name.trim().length >= 2 && phone.trim().length >= 10;

  return {
    email: user?.email || '',
    name,
    phone,
    isLoading,
    isFormValid,
    validationErrors,
    handleNameChange,
    handlePhoneChange,
    handleSubmit,
    handleSignOut,
  };
}
