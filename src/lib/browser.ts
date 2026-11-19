import * as WebBrowser from 'expo-web-browser';

export async function openInAppBrowser(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url).catch(() => undefined);
}
