import { AppText, AppView } from '@/components/ui';
import type { OrderStatus } from '@/lib/api/models';
import { cn } from '@/lib/cn';

import { TRACKING_STEPS } from '../order-stage-labels';

// Arrival states sit between the visible steps: "at pickup" completes
// "Heading to pickup" without marking the pickup itself done.
const STAGE_ORDER: OrderStatus[] = [
  'searching',
  'heading_to_pickup',
  'arrived_at_pickup',
  'pickup_complete',
  'arrived_at_drop',
  'awaiting_payment',
  'delivered',
];

/** At-a-glance progress for the resting sheet: one segment per timeline step. */
export function TrackingProgressBar({ stage }: { stage: OrderStatus }) {
  if (
    stage === 'cancelled' ||
    stage === 'delivery_failed' ||
    stage === 'payment_failed' ||
    stage === 'unknown'
  )
    return null;
  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <AppView row className="mt-3 gap-1.5">
      {TRACKING_STEPS.map((step) => (
        <AppView
          key={step.id}
          className={cn(
            'h-1 flex-1 rounded-full',
            STAGE_ORDER.indexOf(step.id) <= currentIndex ? 'bg-brand' : 'bg-border',
          )}
        />
      ))}
    </AppView>
  );
}

export function TrackingTimeline({ stage }: { stage: OrderStatus }) {
  // A cancelled order has no meaningful progress to show — the stepper used to
  // freeze on "Finding your driver", which read as if it were still searching.
  if (stage === 'cancelled') {
    return (
      <AppView row className="mt-4 py-1.5">
        <AppView className="mr-3 size-2.5 rounded-full bg-danger" />
        <AppText className="text-[14px] font-semibold text-danger">
          Cancelled before pickup · no charge
        </AppText>
      </AppView>
    );
  }

  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <AppView className="mt-4">
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
