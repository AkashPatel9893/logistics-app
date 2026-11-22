import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  FocusAwareStatusBar,
  Icon,
  ScreenHeader,
} from '@/components/ui';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { ApiError, getErrorMessage } from '@/lib/api/api-error';
import { cn } from '@/lib/cn';
import { formatFare } from '@/lib/format';
import { DURATION, FadeIn, staggerDelay } from '@/lib/motion';
import { goBack, useRouter } from '@/lib/navigation';

import { RideOptionRow, RideOptionsSkeleton } from './components/ride-option-row';
import { TripLocationsCard } from './components/trip-locations-card';
import { useVehicleOptionsQuote } from './hooks/use-vehicle-options-quote';

const ADDRESS_ERROR_CODES = new Set(['LOCATION_NOT_SERVICEABLE', 'CROSS_MARKET_ROUTE']);

export function TripConfirmationScreen() {
  const router = useRouter();
  const layoutTransition = useLayoutTransition();
  const {
    draft,
    maxDrops,
    quote,
    options,
    selected,
    fallbackSender,
    availabilityLabel,
    swapLocations,
    selectVehicle,
    setPriority,
  } = useVehicleOptionsQuote();

  const handleContinue = () => {
    if (!selected) return;
    selectVehicle(selected.vehicleId);
    router.push('/review-booking');
  };

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Select Vehicle" onBack={() => goBack(router)} className="pb-3" />
      <TripLocationsCard
        draft={draft}
        fallbackSender={fallbackSender}
        onPickupPress={() =>
          router.push({ pathname: '/location-select', params: { target: 'pickup' } })
        }
        onDropPress={() =>
          draft.midStops.length > 0
            ? router.push({ pathname: '/add-stops', params: { mode: 'edit' } })
            : router.push('/location-select')
        }
        onSwap={swapLocations}
        onAddStop={
          draft.midStops.length + 1 < maxDrops
            ? () => router.push({ pathname: '/add-stops', params: { mode: 'add' } })
            : undefined
        }
        onEditLocations={() => router.push({ pathname: '/add-stops', params: { mode: 'edit' } })}
      />
      <AppView className="mt-2 flex-1">
        <AppView row className="items-center justify-between px-5 pb-2 pt-4">
          <AppText accessibilityRole="header" className="text-[19px] font-bold text-foreground">
            Choose your vehicle
          </AppText>
          {options.length > 0 ? (
            <AppView className="rounded-full bg-surface px-2.5 py-1">
              <AppText className="text-[12px] font-semibold text-muted">
                {availabilityLabel}
              </AppText>
            </AppView>
          ) : null}
        </AppView>
        <AppScrollView contentContainerClassName="pt-1 pb-2">
          <AppView className="px-4 pb-4 pt-1">
            {quote.isPending ? (
              <RideOptionsSkeleton />
            ) : quote.isError ? (
              <AppView className="items-center py-8">
                <AppText className="text-center text-[13px] text-muted">
                  {getErrorMessage(quote.error)}
                </AppText>
                {quote.error instanceof ApiError &&
                ADDRESS_ERROR_CODES.has(quote.error.code ?? '') ? (
                  <Button
                    label="Change address"
                    variant="ghost"
                    size="sm"
                    onPress={() => goBack(router)}
                  />
                ) : (
                  <Button
                    label="Try again"
                    variant="ghost"
                    size="sm"
                    onPress={() => quote.refetch()}
                  />
                )}
              </AppView>
            ) : (
              options.map((option, index) => (
                <AnimatedView
                  key={option.vehicleId}
                  entering={FadeIn.duration(DURATION.enter).delay(staggerDelay(index))}
                  layout={layoutTransition}
                >
                  <RideOptionRow
                    option={option}
                    isSelected={selected?.vehicleId === option.vehicleId}
                    onPress={() => selectVehicle(option.vehicleId)}
                  />
                </AnimatedView>
              ))
            )}
          </AppView>
        </AppScrollView>
      </AppView>
      <AppView className="border-t border-divider bg-surface px-4 pb-safe-offset-3 pt-3">
        {selected && (selected.priority.available || selected.priority.active) ? (
          <AppPressable
            onPress={() => setPriority(!draft.priority)}
            pressScale={0.99}
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.priority }}
            accessibilityLabel={`Priority booking${
              selected.priority.amount != null
                ? `, plus ${formatFare(selected.priority.amount)}`
                : ''
            }`}
            className={cn(
              'mb-3 flex-row items-center rounded-2xl border-[1.5px] px-3.5 py-3',
              draft.priority ? 'border-brand bg-brand/10' : 'border-border bg-surface',
            )}
          >
            <Icon name="star.fill" size={18} tone={draft.priority ? 'brand' : 'muted'} />
            <AppView className="ml-3 flex-1">
              <AppText className="text-[15px] font-bold text-foreground">
                Priority
                {selected.priority.amount != null
                  ? ` +${formatFare(selected.priority.amount)}`
                  : ''}
              </AppText>
              <AppText className="text-[12px] text-muted">
                Drivers see your request first and it is matched sooner.
              </AppText>
            </AppView>
            <AppView
              center
              className={cn(
                'size-6 rounded-md border-[1.5px]',
                draft.priority ? 'border-brand bg-brand' : 'border-border',
              )}
            >
              {draft.priority ? (
                <Icon name="check" size={14} tone="brand-foreground" weight="bold" />
              ) : null}
            </AppView>
          </AppPressable>
        ) : null}
        <AppPressable
          onPress={handleContinue}
          disabled={!selected}
          pressScale={0.98}
          accessibilityRole="button"
          accessibilityLabel={
            selected
              ? `Proceed with ${selected.name} for ${formatFare(selected.breakdown.total)}`
              : 'Choose a vehicle'
          }
          accessibilityState={{ disabled: !selected }}
          className={cn(
            'mb-1 h-[60px] flex-row items-center rounded-2xl pl-5 pr-2',
            selected ? 'bg-brand' : 'bg-surface-muted',
          )}
        >
          {selected ? (
            <AppView className="flex-1 pr-3">
              <AppText className="text-[11.5px] font-semibold text-brand-foreground/80">
                Proceed with
              </AppText>
              <AppText
                numberOfLines={1}
                className="text-[16px] font-bold leading-[20px] text-brand-foreground"
              >
                {selected.name}
              </AppText>
            </AppView>
          ) : (
            <AppText className="flex-1 pr-3 text-[16px] font-bold text-muted">
              Choose a vehicle
            </AppText>
          )}
          {selected ? (
            <AppView row className="items-center gap-2.5">
              <AppText className="text-[17px] font-black tabular-nums text-brand-foreground">
                {formatFare(selected.breakdown.total)}
              </AppText>
              <AppView center className="size-10 rounded-xl bg-white/20">
                <Icon name="arrow.right" size={16} tone="brand-foreground" weight="bold" />
              </AppView>
            </AppView>
          ) : null}
        </AppPressable>
      </AppView>
    </AppView>
  );
}
