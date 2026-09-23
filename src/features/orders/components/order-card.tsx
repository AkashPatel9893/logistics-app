import { AppImage, AppPressable, AppText, AppView, Card } from '@/components/ui';
import { OlaMapCamera, OlaMapView } from '@/components/ui/ola-map-view';
import { getVehicleImage } from '@/features/trip/vehicle-catalog';
import type { Order } from '@/lib/api/models';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

import { ORDER_STAGE_LABEL } from '../order-stage-labels';

const MAP_PREVIEW_CENTER: [number, number] = [77.243, 28.6335];

function MapPreview() {
  return (
    <AppView className="h-32 w-full">
      <OlaMapView
        style={{ flex: 1 }}
        dragPan={false}
        touchZoom={false}
        touchRotate={false}
        touchPitch={false}
        pointerEvents="none"
      >
        <OlaMapCamera initialViewState={{ center: MAP_PREVIEW_CENTER, zoom: 14 }} />
      </OlaMapView>
    </AppView>
  );
}

export interface OrderCardProps {
  order: Order;
  showMapPreview?: boolean;
  onPress: (order: Order) => void;
}

export function OrderCard({ order, showMapPreview = false, onPress }: OrderCardProps) {
  // Active and cancelled orders are highlighted; delivered ones are not.
  const isHighlighted = order.status !== 'delivered';

  return (
    <AppPressable
      onPress={() => onPress(order)}
      accessibilityLabel={`Order to ${order.drop.label}, ${ORDER_STAGE_LABEL[order.status]}`}
      className="mb-3"
    >
      <Card className="overflow-hidden p-0">
        {showMapPreview ? <MapPreview /> : null}
        <AppView row className="p-4">
          <AppView center className="mr-3 size-12 overflow-hidden rounded-xl bg-surface-muted">
            <AppImage
              source={getVehicleImage(order.vehicle.imageKey)}
              contentFit="contain"
              style={{ width: 36, height: 36 }}
            />
          </AppView>
          <AppView className="flex-1">
            <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
              {order.drop.label}
            </AppText>
            <AppText className="mt-0.5 text-[13px] text-subtle">
              {formatDateTime(Date.parse(order.createdAt))}
            </AppText>
            <AppView row className="mt-1.5 gap-1">
              <AppText className="text-[13px] font-semibold text-foreground">
                ₹{order.pricing.payable.toFixed(2)}
              </AppText>
              <AppText className="text-[13px] text-subtle"> · </AppText>
              <AppText
                className={cn(
                  'text-[13px] font-semibold',
                  isHighlighted ? 'text-brand' : 'text-foreground',
                )}
              >
                {ORDER_STAGE_LABEL[order.status]}
              </AppText>
            </AppView>
          </AppView>
        </AppView>
      </Card>
    </AppPressable>
  );
}
