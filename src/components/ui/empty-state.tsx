import type { ReactElement } from 'react';

import { cn } from '@/lib/cn';
import { DURATION, FadeIn } from '@/lib/motion';

import { AnimatedView } from './animated-view';
import { AppText } from './app-text';
import { Button } from './button';
import {
  AddressesArtwork,
  OffersArtwork,
  OrdersArtwork,
  SearchArtwork,
  WalletArtwork,
  type ArtworkProps,
} from './empty-state-artworks';

export type EmptyStateIllustration = 'orders' | 'addresses' | 'wallet' | 'offers' | 'search';

export interface EmptyStateProps {
  illustration: EmptyStateIllustration;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
}

const ARTWORKS: Record<EmptyStateIllustration, (props: ArtworkProps) => ReactElement> = {
  orders: OrdersArtwork,
  addresses: AddressesArtwork,
  wallet: WalletArtwork,
  offers: OffersArtwork,
  search: SearchArtwork,
};

export function EmptyState({
  illustration,
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
  className,
}: EmptyStateProps) {
  const artworkSize = compact ? { width: 128, height: 106 } : { width: 168, height: 140 };
  const Artwork = ARTWORKS[illustration];

  return (
    <AnimatedView
      entering={FadeIn.duration(DURATION.enter)}
      className={cn('items-center justify-center', compact ? 'px-6 py-6' : 'px-6 py-10', className)}
    >
      <Artwork width={artworkSize.width} height={artworkSize.height} />
      <AppText
        className={cn(
          'text-center font-bold text-foreground',
          compact ? 'mt-2.5 text-[15px]' : 'mt-3 text-[17px]',
        )}
      >
        {title}
      </AppText>
      {subtitle ? (
        <AppText
          className={cn(
            'text-center leading-[19px] text-muted',
            compact ? 'mt-1 max-w-[260px] text-[12.5px]' : 'mt-1.5 max-w-[280px] text-[13.5px]',
          )}
        >
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="md" className="mt-5 px-6" />
      ) : null}
    </AnimatedView>
  );
}
