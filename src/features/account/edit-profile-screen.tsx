import { useState } from 'react';

import {
  AppKeyboardAwareScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  LiquidGlassBackButton,
  TextField,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import { goBack, useRouter } from '@/lib/navigation';
import { useProfileQuery, useUpdateProfileName } from '@/queries';
import { useAuthStore } from '@/stores';

import { EmailVerification } from './components/email-verification';

export function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: currentUser } = useProfileQuery();
  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string>();
  const updateName = useUpdateProfileName();

  return (
    <AppView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <AppKeyboardAwareScrollView
        bottomOffset={120}
        className="flex-1 pt-safe-offset-2"
        contentContainerClassName="px-6 pb-12"
      >
        <AppView className="mb-4 min-h-[48px] justify-center">
          <LiquidGlassBackButton onPress={() => goBack(router)} />
        </AppView>
        <AppText className="text-[28px] font-extrabold tracking-tight text-foreground">
          Edit profile
        </AppText>
        <AppText className="mt-1.5 text-[14px] text-muted">
          Your name, phone number and email.
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
            label="Save name"
            loading={updateName.isPending}
            onPress={() => {
              const trimmed = name.trim();
              if (!trimmed) {
                setNameError('Enter your name.');
                return;
              }
              updateName.mutate(trimmed, {
                onSuccess: () => goBack(router),
                onError: (error) => setNameError(getErrorMessage(error)),
              });
            }}
          />
        </AppView>

        <AppView className="mt-8 border-t border-divider pt-6">
          <EmailVerification />
        </AppView>
      </AppKeyboardAwareScrollView>
    </AppView>
  );
}
