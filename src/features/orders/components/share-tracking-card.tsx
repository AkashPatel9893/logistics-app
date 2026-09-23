import { AppPressable, AppSpinner, AppText, AppView, Icon } from '@/components/ui';

export interface ShareTrackingCardProps {
  deliveryOtp: string;
  isSharing: boolean;
  onShare: () => void;
}

/**
 * Receiver hand-off: the delivery OTP the receiver gives the driver at drop,
 * and a link so they can follow the delivery live.
 */
export function ShareTrackingCard({ deliveryOtp, isSharing, onShare }: ShareTrackingCardProps) {
  return (
    <AppView
      row
      className="mt-3 rounded-2xl border border-dashed border-brand-border bg-brand-tint px-3 py-2.5"
    >
      <AppView className="flex-1">
        <AppText className="text-[12px] text-muted">Receiver&apos;s delivery OTP</AppText>
        <AppText className="text-[16px] font-extrabold tracking-[4px] text-foreground">
          {deliveryOtp}
        </AppText>
      </AppView>
      <AppPressable
        onPress={onShare}
        disabled={isSharing}
        accessibilityLabel="Share live tracking with the receiver"
        className="flex-row items-center gap-1.5 rounded-full bg-brand px-3.5 py-2"
      >
        {isSharing ? (
          <AppSpinner tone="brand-foreground" />
        ) : (
          <Icon name="square.and.arrow.up" size={14} tone="brand-foreground" />
        )}
        <AppText className="text-[13px] font-bold text-brand-foreground">Share tracking</AppText>
      </AppPressable>
    </AppView>
  );
}
