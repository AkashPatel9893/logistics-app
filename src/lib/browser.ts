import * as WebBrowser from 'expo-web-browser';

import { openExternalUrl } from './native';

export async function openInAppBrowser(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    openExternalUrl(url, 'Could not open this link right now.');
  }
}
