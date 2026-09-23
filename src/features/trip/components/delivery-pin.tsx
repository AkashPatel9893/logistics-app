import { StyleSheet } from 'react-native';

import { AppText, AppView, Icon } from '@/components/ui';

function PinGraphic() {
  return (
    <AppView className="items-center">
      <AppView
        center
        className="size-11 rounded-full border-[3px] border-white bg-brand"
        style={styles.pinShadow}
      >
        <Icon name="mappin" size={22} tone="brand-foreground" />
      </AppView>
      <AppView className="-mt-0.5 h-2.5 w-1 rounded-sm bg-brand" />
      <AppView className="mt-px h-[5px] w-2.5 rounded-full bg-slate-900/45" />
    </AppView>
  );
}

export interface DeliveryPinProps {
  /** Top/bottom insets of the visible map area, so the pin sits at its center. */
  paddingTop: number;
  paddingBottom: number;
  showLabel: boolean;
}

/** Fixed crosshair pin: the map moves underneath it to choose a location. */
export function DeliveryPin({ paddingTop, paddingBottom, showLabel }: DeliveryPinProps) {
  return (
    <AppView pointerEvents="none" className="absolute inset-0">
      <AppView center className="flex-1" style={{ paddingTop, paddingBottom }}>
        {/* Lifted so the pin's tip, not its center, marks the map center. */}
        <AppView className="-mt-[54px] items-center">
          {showLabel ? (
            <AppView className="mb-1.5 rounded-full border border-white/20 bg-neutral-900/90 px-3 py-1 shadow-md dark:bg-black/90">
              <AppText className="text-[11px] font-bold tracking-wide text-white">
                Pin Location
              </AppText>
            </AppView>
          ) : null}
          <PinGraphic />
        </AppView>
      </AppView>
    </AppView>
  );
}

// Native shadow values kept exactly as designed.
const styles = StyleSheet.create({
  pinShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
});
