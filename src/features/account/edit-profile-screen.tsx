import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppKeyboardAvoidingView,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  LiquidGlassBackButton,
  TextField,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getErrorMessage } from '@/lib/api/api-error';
import { authApi } from '@/lib/api/auth';
import { goBack } from '@/lib/go-back';

export function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore.use.user();
  const queryClient = useQueryClient();
  const { data: currentUser } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: ({ signal }) => authApi.getMe(signal),
    enabled: !!user?.isOnboarded,
  });
  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string>();
  const updateName = useMutation({
    mutationFn: authApi.updateName,
    onSuccess: (updated) => {
      useAuthStore.getState().setUser(updated);
      queryClient.setQueryData(['customer-profile'], updated);
      goBack(router);
    },
    onError: (error) => setNameError(getErrorMessage(error)),
  });

  return (
    <AppView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <AppKeyboardAvoidingView>
        <AppScrollView
          style={{ paddingTop: insets.top + 8 }}
          contentContainerClassName="px-6 pb-12"
        >
          <AppView className="mb-4 min-h-[48px] justify-center">
            <LiquidGlassBackButton onPress={() => goBack(router)} />
          </AppView>
          <AppText className="text-[28px] font-extrabold tracking-tight text-foreground">
            Edit profile
          </AppText>
          <AppText className="mt-1.5 text-[14px] text-muted">
            Update your name and view your account phone number.
          </AppText>
          <AppView className="mt-7 gap-4">
            <TextField
              variant="outlined"
              label="Full name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setNameError(undefined);
              }}
              autoCapitalize="words"
              autoComplete="name"
              maxLength={160}
              error={nameError}
            />
            <AppView className="opacity-60">
              <TextField
                variant="outlined"
                label="Phone number"
                value={currentUser?.phone ?? user?.phone ?? ''}
                editable={false}
                accessibilityState={{ disabled: true }}
                hint="Phone number cannot be changed here."
              />
            </AppView>
            <Button
              label="Save changes"
              loading={updateName.isPending}
              onPress={() => {
                const trimmed = name.trim();
                if (!trimmed) {
                  setNameError('Enter your name.');
                  return;
                }
                updateName.mutate(trimmed);
              }}
            />
          </AppView>
        </AppScrollView>
      </AppKeyboardAvoidingView>
    </AppView>
  );
}
