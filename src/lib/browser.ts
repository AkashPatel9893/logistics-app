import * as WebBrowser from 'expo-web-browser';

/** Opens an external URL in the system's in-app browser sheet (SFSafariViewController / Custom Tabs). */
export async function openInAppBrowser(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url).catch(() => undefined);
}
