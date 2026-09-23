import { AppText, AppView, Button } from '@/components/ui';

export interface PinStepPanelProps {
  isPermissionDenied: boolean;
  isConfirming: boolean;
  onConfirm: () => void;
  bottomInset: number;
}

export function PinStepPanel({
  isPermissionDenied,
  isConfirming,
  onConfirm,
  bottomInset,
}: PinStepPanelProps) {
  return (
    <AppView className="px-4 pt-2" style={{ paddingBottom: bottomInset + 16 }}>
      {isPermissionDenied ? (
        <AppView row className="mb-3">
          <AppView className="mr-3 size-3 rounded-full bg-subtle" />
          <AppText className="flex-1 text-[13px] font-medium text-muted">
            Drag the map to choose the drop location.
          </AppText>
        </AppView>
      ) : (
        <AppView row className="mb-3">
          <AppView className="mr-3 size-3 rounded-full bg-brand" />
          <AppText numberOfLines={1} className="flex-1 text-[14px] font-semibold text-foreground">
            Move the map to set your location
          </AppText>
        </AppView>
      )}
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
