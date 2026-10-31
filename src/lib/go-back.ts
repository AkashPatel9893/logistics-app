import type { useRouter } from 'expo-router';

/** Goes back, or to Home when the screen was opened without history (after a booking, a deep link, a restart). */
export function goBack(router: ReturnType<typeof useRouter>): void {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}
