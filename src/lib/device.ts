import { Platform } from 'react-native';

import { kvStorage } from '@/lib/storage';

const DEVICE_ID_KEY = 'device_install_id';

/** A random id created once per install, so the backend can tell devices apart. */
function installId(): string {
  const existing = kvStorage.getString(DEVICE_ID_KEY);
  if (existing) return existing;
  const random = () => Math.random().toString(36).slice(2, 10);
  const id = `${Platform.OS}-${Date.now().toString(36)}-${random()}${random()}`;
  kvStorage.setString(DEVICE_ID_KEY, id);
  return id;
}

/** Device block sent at login. */
export function deviceInfo(): { device_uuid: string; platform: 'IOS' | 'ANDROID' | 'WEB' } {
  const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
  return { device_uuid: installId(), platform };
}
