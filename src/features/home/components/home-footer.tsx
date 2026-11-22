import { AppImage, AppText, AppView, Icon } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';

const HOME_FOOTER_SKYLINE = require('@/assets/images/home-footer-skyline.png');
const SKYLINE_ASPECT_RATIO = 1200 / 487;

export function HomeFooter() {
  const skylineTint = useThemeColor('subtle');

  return (
    <AppView className="mt-10">
      <AppView center className="mb-2 px-5">
        <AppText className="text-[21px] font-bold leading-[26px] tracking-[-0.4px] text-foreground-secondary">
          Proudly made
        </AppText>
        <AppView row center className="mt-0.5">
          <AppText className="text-[27px] font-extrabold leading-[32px] tracking-[-0.6px] text-foreground">
            in India
          </AppText>
          <AppView className="-mt-2.5 ml-1.5 rotate-12">
            <Icon name="heart.fill" size={20} tone="brand" />
          </AppView>
        </AppView>
      </AppView>
      <AppImage
        source={HOME_FOOTER_SKYLINE}
        tintColor={skylineTint}
        contentFit="contain"
        transition={0}
        accessible={false}
        className="w-full opacity-55"
        style={{ aspectRatio: SKYLINE_ASPECT_RATIO }}
      />
    </AppView>
  );
}
