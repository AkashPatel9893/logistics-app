import { useState } from 'react';

import { getErrorMessage } from '@/lib/api/api-error';
import { goBack, useRouter } from '@/lib/navigation';
import { useProfileQuery, useUpdateProfileName } from '@/queries';
import { useAuthStore } from '@/stores';

export function useEditProfileForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: currentUser } = useProfileQuery();
  const updateName = useUpdateProfileName();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string>();

  const name = draftName ?? currentUser?.name ?? user?.name ?? '';
  const phone = currentUser?.phone ?? user?.phone ?? '';

  const handleNameChange = (value: string) => {
    setDraftName(value);
    setNameError(undefined);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Enter your name.');
      return;
    }
    updateName.mutate(trimmed, {
      onSuccess: () => goBack(router),
      onError: (error) => setNameError(getErrorMessage(error)),
    });
  };

  return {
    name,
    phone,
    nameError,
    isSaving: updateName.isPending,
    handleNameChange,
    handleSave,
    navigateBack: () => goBack(router),
  };
}
