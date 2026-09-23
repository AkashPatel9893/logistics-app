import { AppText, AppView, StarRating } from '@/components/ui';

export interface DeliveryRatingProps {
  driverName: string;
  rating: number | null;
  isSubmitting?: boolean;
  onRate: (rating: number) => void;
}

export function DeliveryRating({
  driverName,
  rating,
  isSubmitting = false,
  onRate,
}: DeliveryRatingProps) {
  return (
    <AppView className="mt-4 items-center border-t border-divider pt-4">
      <AppText className="mb-2 text-[14px] font-semibold text-foreground">
        {rating ? 'Thanks for your rating' : `Rate your delivery with ${driverName}`}
      </AppText>
      <StarRating value={rating ?? 0} onChange={rating || isSubmitting ? undefined : onRate} />
    </AppView>
  );
}
