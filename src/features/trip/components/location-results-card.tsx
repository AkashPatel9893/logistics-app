import { AnimatedView, AppSpinner, AppText, AppView, Divider } from '@/components/ui';
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

  if (!isLoading && results.length === 0 && !showNoResults && !isSavedOnly) {
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

      {showNoResults ? (
        <AppText className="p-5 text-center text-[13px] text-subtle">
          No matching address found for &quot;{trimmedQuery}&quot;.
        </AppText>
      ) : null}

      {!isLoading && results.length === 0 && isSavedOnly ? (
        <AppText className="p-5 text-center text-[13px] text-subtle">
          No saved addresses yet. Tap the heart on any address to save it.
        </AppText>
      ) : null}
    </AnimatedView>
  );
}
