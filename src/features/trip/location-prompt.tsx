import {
  AppModalBottomSheet,
  AppText,
  AppView,
  Button,
  Icon,
  type IconName,
} from '@/components/ui';
import {
  answerLocationPrompt,
  usePromptStore,
  type LocationPromptKind,
} from '@/stores/prompt-store';

interface PromptContent {
  icon: IconName;
  title: string;
  body: string;
  primary: string;
  secondary: string;
}

const CONTENT: Record<LocationPromptKind, PromptContent> = {
  'services-off': {
    icon: 'location',
    title: 'Turn on device location',
    body: 'Your phone’s location is turned off. Turn it on so we can find your pickup point accurately.',
    primary: 'Open Settings',
    secondary: 'Not now',
  },
};

/** Mounted once at the app root; renders the sheet when a location prompt is requested. */
export function LocationPromptHost() {
  const kind = usePromptStore((state) => state.kind);
  const content = kind ? CONTENT[kind] : null;

  return (
    <AppModalBottomSheet
      index={kind !== null ? 1 : 0}
      detents={[0, 'content']}
      onClose={() => answerLocationPrompt('secondary')}
    >
      {content ? (
        <AppView accessibilityViewIsModal className="px-6 pb-safe-offset-4 pt-3">
          <AppView className="mb-5 items-center">
            <AppView className="h-1 w-10 rounded-full bg-border-strong" />
          </AppView>

          {/* Layered rings around the icon, the way ride apps illustrate location. */}
          <AppView className="mb-5 items-center">
            <AppView center className="size-24 rounded-full bg-brand-tint">
              <AppView center className="size-16 rounded-full bg-brand/20">
                <AppView center className="size-11 rounded-full bg-brand">
                  <Icon name={content.icon} size={22} tone="brand-foreground" />
                </AppView>
              </AppView>
            </AppView>
          </AppView>

          <AppText
            accessibilityRole="header"
            className="text-center text-[21px] font-bold text-foreground"
          >
            {content.title}
          </AppText>
          <AppText className="mt-2 text-center text-[14px] leading-[21px] text-muted">
            {content.body}
          </AppText>

          <Button
            label={content.primary}
            variant="brand"
            onPress={() => answerLocationPrompt('primary')}
            className="mt-6 h-auto py-3.5"
            textClassName="text-[15px]"
          />
          <Button
            label={content.secondary}
            variant="ghost"
            onPress={() => answerLocationPrompt('secondary')}
            className="mt-1 h-auto py-3"
            textClassName="text-[14px]"
          />
        </AppView>
      ) : null}
    </AppModalBottomSheet>
  );
}
