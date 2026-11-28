import { AppText, AppView, Button, Icon } from '@/components/ui';

export interface PinStepPanelProps {
  isPermissionDenied: boolean;
  isConfirming: boolean;
  onConfirm: () => void;
  /** Address under the pin; null until it is known. */
  address: { label: string; address: string } | null;
  isFindingAddress: boolean;
  bottomInset: number;
}

export function PinStepPanel({
  isPermissionDenied,
  isConfirming,
  onConfirm,
  address,
  isFindingAddress,
  bottomInset,
}: PinStepPanelProps) {
  const title = isFindingAddress
    ? 'Finding address…'
    : address
      ? address.label || address.address
      : isPermissionDenied
        ? 'Drag the map to choose the location'
        : 'Move the map to set your location';
  const subtitle = !isFindingAddress && address?.label ? address.address : '';

  return (
    <AppView className="px-4 pt-2" style={{ paddingBottom: bottomInset + 16 }}>
      <AppView
        row
        className="mb-3 min-h-[44px] items-center"
        accessibilityLiveRegion="polite"
        accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      >
        <AppView className="mr-3 size-8 items-center justify-center rounded-full bg-brand-soft">
          <Icon name="mappin.circle.fill" size={16} tone="brand" />
        </AppView>
        <AppView className="flex-1">
          <AppText
            numberOfLines={1}
            className={`text-[15px] font-semibold ${isFindingAddress ? 'text-muted' : 'text-foreground'}`}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText numberOfLines={1} className="mt-0.5 text-[13px] text-muted">
              {subtitle}
            </AppText>
          ) : null}
        </AppView>
      </AppView>
      <Button
        label={isConfirming ? 'Locating address…' : 'Confirm location'}
        variant="brand"
        disabled={isConfirming}
        onPress={onConfirm}
        className="h-auto py-3.5"
        textClassName="text-[15px]"
      />
    </AppView>
  );
}
