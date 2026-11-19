import {
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  FocusAwareStatusBar,
  Icon,
  useAppSafeAreaInsets,
} from '@/components/ui';
import { goBack, useRouter } from '@/lib/navigation';
import { draftStops } from '@/stores';

import { AddressSearchCard } from './components/address-search-card';
import { LocationResultsCard } from './components/location-results-card';
import { SearchEmptyState, SearchQuickActions } from './components/search-quick-actions';
import { useLocationSelect } from './hooks/use-location-select';
import { placeLine } from './place-line';

export function LocationSelectScreen() {
  const router = useRouter();
  const insets = useAppSafeAreaInsets();
  const state = useLocationSelect();
  const { draft, stopIndex, isPickupMode, trimmedQuery, isLoading, results, isSavedOnly } = state;

  const dropPlaceholder =
    stopIndex !== undefined
      ? stopIndex === draftStops(draft).length - 1
        ? 'Where is your Final Destination?'
        : `Where is your Stop ${stopIndex + 1}?`
      : undefined;

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />

      <AppView
        style={{ paddingTop: Math.max(insets.top, 12) + 4 }}
        className="flex-row items-center bg-grouped px-4 pb-3"
      >
        <AppPressable
          onPress={() => goBack(router)}
          pressScale={0.92}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="size-11 items-center justify-center rounded-full border border-border/40 bg-surface shadow-xs"
        >
          <Icon name="chevron.left" size={20} tone="foreground" />
        </AppPressable>
        <AppView className="ml-3 flex-1">
          <AppText accessibilityRole="header" className="text-[19px] font-bold text-foreground">
            {state.heading.title}
          </AppText>
          <AppText numberOfLines={1} className="text-[13px] text-muted">
            {state.heading.subtitle}
          </AppText>
        </AppView>
      </AppView>

      <AddressSearchCard
        isPickupMode={isPickupMode}
        showDrop={!isPickupMode}
        pickupLabel={placeLine(draft.pickupLabel, draft.pickupAddress)}
        pickupContactName={state.pickupContactName}
        pickupContactPhone={state.pickupContactPhone}
        onPickupPress={state.openPickupOnMap}
        dropLabel={draft.dropLabel}
        onDropPress={state.openDropOnMap}
        query={state.query}
        onChangeQuery={state.setQuery}
        onSubmit={() => results[0] && state.handleSelect(results[0])}
        isSearching={state.isSearching || state.isResolving}
        stopNumber={stopIndex !== undefined ? stopIndex + 1 : undefined}
        dropPlaceholder={dropPlaceholder}
        onAddStop={state.openAddStops}
        onSwap={state.handleSwap}
      />

      <AppScrollView contentContainerClassName="pt-1 pb-safe-offset-8">
        {trimmedQuery ? null : <SearchQuickActions actions={state.quickActions} />}

        {state.isCurrentLocationUnserved && (!draft.pickupRegion || draft.isPickupCarriedOver) ? (
          <AppView className="mx-4 mb-3 rounded-2xl bg-brand-tint p-4">
            <AppText className="text-[14px] font-bold text-foreground">
              We don&apos;t deliver at your current location yet
            </AppText>
            <AppText className="mt-1 text-[13px] text-muted">
              {draft.pickupRegion
                ? 'We kept your last pickup. Tap it above to change it.'
                : 'Tap the pickup above and choose a place in a city we serve.'}
            </AppText>
          </AppView>
        ) : null}

        {!isLoading && results.length === 0 && !trimmedQuery && !isSavedOnly ? (
          <SearchEmptyState
            title={isPickupMode ? 'Find your pickup point' : 'Find where it goes'}
            hint="Search by area, street, landmark or building name."
          />
        ) : null}

        <LocationResultsCard
          isLoading={isLoading}
          results={results}
          currentLabel={state.currentLabel}
          showNoResults={state.showNoResults}
          isSavedOnly={isSavedOnly}
          trimmedQuery={trimmedQuery}
          onSelect={state.handleSelect}
          onToggleFavorite={state.handleToggleFavorite}
        />
      </AppScrollView>
    </AppView>
  );
}
