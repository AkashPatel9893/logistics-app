import { AppText, AppView, Icon } from '@/components/ui';

/** The code the receiver reads out to the driver to complete the delivery. */
export function DeliveryOtpCard({ otp }: { otp: string }) {
  return (
    <AppView className="mt-4 rounded-2xl border border-dashed border-brand-border bg-brand-tint p-4">
      <AppView row className="gap-2">
        <Icon name="lock.fill" size={14} tone="brand" />
        <AppText className="text-[13px] font-semibold text-foreground">Delivery OTP</AppText>
      </AppView>
      <AppText
        accessibilityLabel={`Delivery OTP ${otp.split('').join(' ')}`}
        className="mt-1 text-[28px] font-extrabold tracking-[8px] text-foreground"
      >
        {otp}
      </AppText>
      <AppText className="mt-1 text-[12px] text-muted">
        Share this code with the driver only when your package arrives.
      </AppText>
    </AppView>
  );
}
