import { useCallback, useState } from 'react';

import { kvStorage, STORAGE_KEYS } from '@/lib/storage';

export const useIsFirstTime = () => {
  const [isFirstTime, setIsFirstTime] = useState<boolean>(() => {
    const value = kvStorage.getBoolean(STORAGE_KEYS.IS_FIRST_TIME);
    return value === undefined ? true : value;
  });

  const setIsFirstTimeValue = useCallback((value: boolean) => {
    kvStorage.setBoolean(STORAGE_KEYS.IS_FIRST_TIME, value);
    setIsFirstTime(value);
  }, []);

  return [isFirstTime, setIsFirstTimeValue] as const;
};
