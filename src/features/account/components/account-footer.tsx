import { AppImage, AppText, AppView, Icon } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';

const ACCOUNT_FOOTER_DELIVERY = require('@/assets/images/account-footer-delivery.png');
const DELIVERY_ASPECT_RATIO = 1200 / 488;

export function AccountFooter({ version }: { version?: string }) {
  const artworkTint = useThemeColor('icon-subtle');

  return (
    <AppView className="mt-4">
      <AppView center className="mb-2 px-4">
        <AppView row center className="gap-1.5">
          <Icon name="box.truck.fill" size={14} tone="brand" />
          <AppText className="text-[14px] font-bold text-foreground-secondary">
            Always moving with you
          </AppText>
        </AppView>
        {version ? (
          <AppText className="mt-0.5 text-[12px] text-subtle">App version {version}</AppText>
        ) : null}
      </AppView>
      <AppImage
        source={ACCOUNT_FOOTER_DELIVERY}
        tintColor={artworkTint}
        contentFit="contain"
        transition={0}
        accessible={false}
        className="-mx-4 opacity-80"
        style={{ aspectRatio: DELIVERY_ASPECT_RATIO }}
      />
    </AppView>
  );
}
