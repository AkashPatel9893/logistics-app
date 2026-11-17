import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

import { AppText, AppView, Button, FocusAwareStatusBar, ScreenHeader } from '@/components/ui';
import { goBack } from '@/lib/go-back';

/** The website's business enquiry page. Set EXPO_PUBLIC_BUSINESS_URL to change it per environment. */
const BUSINESS_ENQUIRY_URL =
  process.env.EXPO_PUBLIC_BUSINESS_URL ?? 'https://www.54-252-167-25.sslip.io/business';

/** Account > Business enquiries: the website's business page, shown inside the app. */
export function BusinessEnquiryScreen() {
  const router = useRouter();
  // A new key remounts the web view, which is how Try again reloads it.
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    setAttempt((count) => count + 1);
  };

  return (
    <AppView className="flex-1 bg-surface">
      <FocusAwareStatusBar />
      <ScreenHeader title="Business enquiries" onBack={() => goBack(router)} className="pb-3" />

      {failed ? (
        <AppView className="flex-1 items-center justify-center px-8">
          <AppText className="text-center text-[15px] text-muted">
            Could not load the page. Check your connection and try again.
          </AppText>
          <Button label="Try again" variant="ghost" size="sm" onPress={retry} />
        </AppView>
      ) : (
        <AppView className="flex-1">
          <WebView
            key={attempt}
            source={{ uri: BUSINESS_ENQUIRY_URL }}
            onLoadEnd={() => setLoading(false)}
            onError={() => setFailed(true)}
            onHttpError={() => setFailed(true)}
            // Opening other sites or apps (tel:, mailto:) is left to the page's own links.
            setSupportMultipleWindows={false}
          />
          {loading ? (
            <AppView
              pointerEvents="none"
              className="absolute inset-0 items-center justify-center bg-surface"
            >
              <ActivityIndicator />
            </AppView>
          ) : null}
        </AppView>
      )}
    </AppView>
  );
}
