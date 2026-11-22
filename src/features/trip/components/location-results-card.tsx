import { AnimatedView, AppSpinner, AppView, Divider, EmptyState } from '@/components/ui';
import { useLayoutTransition } from '@/hooks/use-layout-transition';
import { DURATION, FadeIn } from '@/lib/motion';

import { type DisplayAddress } from '../hooks/use-address-search';
import { LocationListItem } from './location-list-item';

interface LocationResultsCardProps {
  isLoading: boolean;
  results: DisplayAddress[];
  currentLabel: string;
  showNoResults: boolean;
  isSavedOnly: boolean;
  trimmedQuery: string;
  onSelect: (item: DisplayAddress) => void;
  onToggleFavorite: (item: DisplayAddress) => void;
}

export function LocationResultsCard({
  isLoading,
  results,
  currentLabel,
  showNoResults,
  isSavedOnly,
  trimmedQuery,
  onSelect,
  onToggleFavorite,
}: LocationResultsCardProps) {
  const resultsLayout = useLayoutTransition();

  if (showNoResults) {
    return (
      <AnimatedView layout={resultsLayout} className="flex-1 justify-center pb-14 pt-6">
        <EmptyState
          illustration="search"
          compact
          title="No places found"
          subtitle={`No matching address found for "${trimmedQuery}". Try a nearby landmark or area.`}
        />
      </AnimatedView>
    );
  }

  if (!isLoading && results.length === 0 && isSavedOnly) {
    return (
      <AnimatedView layout={resultsLayout} className="flex-1 justify-center pb-14 pt-6">
        <EmptyState
          illustration="addresses"
          compact
          title="No saved addresses yet"
          subtitle="Tap the heart on any address to save it."
        />
      </AnimatedView>
    );
  }

  if (!isLoading && results.length === 0) {
    return null;
  }

  return (
    <AnimatedView
      layout={resultsLayout}
      className="mx-4 overflow-hidden rounded-2xl border border-border/40 bg-surface shadow-xs"
    >
      {isLoading ? (
        <AppView className="p-6">
          <AppSpinner tone="brand" />
        </AppView>
      ) : null}

      {results.map((item, index) => (
        <AnimatedView key={item.id} entering={FadeIn.duration(DURATION.small)}>
          <LocationListItem
            item={item}
            isSelected={currentLabel === item.name}
            onPress={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
          {index < results.length - 1 ? <Divider insetClassName="ml-[64px]" /> : null}
        </AnimatedView>
      ))}
    </AnimatedView>
  );
}
