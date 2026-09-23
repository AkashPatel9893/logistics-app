import { AppText, AppView } from '@/components/ui';
import type { OrderStatus } from '@/lib/api/models';
import { cn } from '@/lib/cn';

import { TRACKING_STEPS } from '../order-stage-labels';

const STAGE_ORDER: OrderStatus[] = [
  'searching',
  'heading_to_pickup',
  'pickup_complete',
  'delivered',
];

export function TrackingTimeline({ stage }: { stage: OrderStatus }) {
  // A cancelled order has no meaningful progress to show — the stepper used to
  // freeze on "Finding your driver", which read as if it were still searching.
  if (stage === 'cancelled') {
    return (
      <AppView row className="mt-4 border-t border-divider py-1.5 pt-4">
        <AppView className="mr-3 size-2.5 rounded-full bg-danger" />
        <AppText className="text-[14px] font-semibold text-danger">
          Cancelled before pickup · no charge
        </AppText>
      </AppView>
    );
  }

  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <AppView className="mt-4 border-t border-divider pt-3">
      {TRACKING_STEPS.map((step) => {
        const isComplete = STAGE_ORDER.indexOf(step.id) <= currentIndex;
        return (
          <AppView key={step.id} row className="py-1.5">
            <AppView
              className={cn('mr-3 size-2.5 rounded-full', isComplete ? 'bg-brand' : 'bg-border')}
            />
            <AppText
              className={cn(
                'text-[14px]',
                isComplete ? 'font-semibold text-foreground' : 'font-medium text-subtle',
              )}
            >
              {step.label}
            </AppText>
          </AppView>
        );
      })}
    </AppView>
  );
}
