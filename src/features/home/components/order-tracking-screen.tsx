import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image as RNImage,
  type ImageSourcePropType,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, AppPressable, AppText, AppView, Button } from '@/components/ui';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import {
  OlaMapCamera,
  OlaMapMarker,
  OlaMapPolyline,
  OlaMapView,
} from '@/components/ui/ola-map-view';
import { TRACKING_MOCK_DATA } from '@/features/home/mock-data';
import { getRideOptionById, RIDE_OPTIONS } from '@/features/home/vehicle-catalog';
import { cn } from '@/lib/cn';
import { computeBounds, interpolateAlongPath, lerpPoint, offsetPoint } from '@/lib/geo';
import {
  DELIVERY_DURATION_MS,
  resolveOrderStage,
  useOrdersStore,
  type OrderStage,
} from '@/stores/orders-store';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingStep {
  id: OrderStage;
  label: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRACKING_STEPS: TrackingStep[] = TRACKING_MOCK_DATA.steps as TrackingStep[];

const STAGE_ORDER: OrderStage[] = [
  'searching',
  'heading_to_pickup',
  'pickup_complete',
  'delivered',
];

// Illustrative fallback route — there's no real backend/GPS, so an order whose
// address didn't geocode still gets a route to animate the driver along.
const FALLBACK_ROUTE = TRACKING_MOCK_DATA.trackingRoute;

// ─── Sub-components ───────────────────────────────────────────────────────────

// Swiggy/Zomato-style moving marker: the actual booked vehicle's image inside a
// pulsing ring, so the user can tell at a glance both that it's live-moving and
// which vehicle to look out for.
function DriverMarker({ vehicleImage }: { vehicleImage: ImageSourcePropType }) {
  return (
    <AppView className="items-center justify-center">
      <AppView className="absolute w-14 h-14 rounded-full bg-[#FF5500]/15" />
      <AppView className="w-10 h-10 rounded-full bg-white items-center justify-center border-2 border-[#FF5500] shadow-md">
        <RNImage source={vehicleImage} style={{ width: 26, height: 26 }} resizeMode="contain" />
      </AppView>
    </AppView>
  );
}

function RouteEndpointMarker({ variant }: { variant: 'pickup' | 'drop' }) {
  return (
    <AppView
      className={cn(
        'w-6 h-6 rounded-full items-center justify-center border-2 border-white',
        variant === 'pickup' ? 'bg-green-500' : 'bg-[#FF5500]',
      )}
    />
  );
}

function TrackingStepRow({ step, currentIndex }: { step: TrackingStep; currentIndex: number }) {
  const stepIndex = STAGE_ORDER.indexOf(step.id);
  const isComplete = stepIndex <= currentIndex;

  return (
    <AppView className="flex-row items-center py-1.5">
      <AppView
        className={cn(
          'w-2.5 h-2.5 rounded-full mr-3',
          isComplete ? 'bg-[#FF5500]' : 'bg-neutral-200 dark:bg-neutral-700',
        )}
      />
      <AppText
        className={cn(
          'text-[14px]',
          isComplete
            ? 'font-semibold text-neutral-900 dark:text-neutral-100'
            : 'font-medium text-neutral-400 dark:text-neutral-500',
        )}
      >
        {step.label}
      </AppText>
    </AppView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function OrderTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const orders = useOrdersStore.use.orders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Ticks fast enough that the driver marker reads as continuously moving
    // rather than jumping between positions.
    const intervalId = setInterval(() => setNow(Date.now()), 2_000);
    return () => clearInterval(intervalId);
  }, []);

  const order = orderId ? orders[orderId] : undefined;

  useEffect(() => {
    if (!order) return;
    const stage = resolveOrderStage(order, now);
    if (stage === 'delivered' && useOrdersStore.getState().activeOrderId === order.id) {
      useOrdersStore.getState().clearActiveOrder();
    }
  }, [order, now]);

  if (!order) {
    return (
      <AppView className="flex-1 bg-white dark:bg-neutral-950 items-center justify-center px-8">
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <AppText className="text-[17px] font-bold text-neutral-900 dark:text-neutral-100 text-center">
          We couldn&apos;t find that order
        </AppText>
        <Button
          label="Back to Home"
          size="lg"
          className="rounded-2xl mt-6 self-stretch"
          onPress={() => router.replace('/home')}
        />
      </AppView>
    );
  }

  const stage = resolveOrderStage(order, now);
  const currentIndex = STAGE_ORDER.indexOf(stage === 'cancelled' ? 'searching' : stage);
  const isSearching = stage === 'searching';
  const minutesUntilAllocation = Math.max(0, Math.ceil((order.driverAllocationAt - now) / 60_000));

  const statusHeadline = isSearching
    ? 'Finding a nearby driver'
    : stage === 'heading_to_pickup'
      ? 'Driver on the way'
      : stage === 'pickup_complete'
        ? 'Package picked up'
        : stage === 'cancelled'
          ? 'Order cancelled'
          : 'Delivered';

  const statusSubtext = isSearching
    ? `Matching you with a driver · ~${minutesUntilAllocation} min`
    : `Booking #${order.id.slice(-6).toUpperCase()} · ${order.vehicleName}`;

  const vehicleImage = getRideOptionById(order.vehicleId)?.image ?? RIDE_OPTIONS[0].image;

  const handleContactDriver = () => {
    if (isSearching) return;
    Linking.openURL(`tel:${order.driver.phone}`).catch(() => {
      Alert.alert('Unable to call', `Please dial ${order.driver.phone} manually.`);
    });
  };

  // Real pickup → stops → drop route captured on the order at booking time;
  // falls back to an illustrative route (no backend/GPS to source a real one
  // from) so the map always has a driver to animate.
  const isHeadingToPickup = stage === 'heading_to_pickup';
  const isDelivering = stage === 'pickup_complete' || stage === 'delivered';
  const showMap = isHeadingToPickup || isDelivering;

  const pickupCompleteAt = order.driverAllocationAt + order.etaMinutes * 60_000;
  const pickupProgress = Math.max(
    0,
    Math.min(1, (now - order.driverAllocationAt) / (order.etaMinutes * 60_000)),
  );

  let activeRoute: typeof order.routeWaypoints = [];
  let driverPosition = { latitude: 0, longitude: 0 };

  if (showMap) {
    const deliveryRoute = order.routeWaypoints.length >= 2 ? order.routeWaypoints : FALLBACK_ROUTE;
    const pickupPoint = deliveryRoute[0];
    const dropPoint = deliveryRoute[deliveryRoute.length - 1];
    // The driver has no real starting location — approach from a synthesized
    // point near pickup so the "heading to pickup" leg still reads as real movement.
    const driverStartPoint = offsetPoint(pickupPoint, 2.5);

    if (isHeadingToPickup) {
      // Phase 1 — heading to pickup: the approach leg only (driver → pickup).
      activeRoute = [driverStartPoint, pickupPoint];
      driverPosition = lerpPoint(driverStartPoint, pickupPoint, pickupProgress);
    } else {
      // Phase 2 — delivering: the real captured leg (pickup → stops → drop).
      activeRoute = deliveryRoute;
      driverPosition =
        stage === 'pickup_complete'
          ? interpolateAlongPath(deliveryRoute, (now - pickupCompleteAt) / DELIVERY_DURATION_MS)
          : dropPoint;
    }
  }

  // Fit the camera to whichever leg is active so the full route — not a
  // fixed, possibly-too-tight zoom — is always visible.
  const routeBounds = showMap ? computeBounds(activeRoute) : undefined;
  const mapPadding = { top: 50, left: 50, right: 50, bottom: 60 };

  return (
    <AppView className="flex-1 bg-white dark:bg-neutral-950">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Header banner ── */}
      <AppView
        style={{ paddingTop: insets.top + 8 }}
        className="bg-[#FF5500] rounded-b-[28px] px-5 pb-6"
      >
        <AppView className="mb-4">
          <LiquidGlassBackButton onPress={() => router.back()} size={40} controlSize="regular" />
        </AppView>
        <AppText className="text-[28px] leading-9 font-extrabold text-white tracking-tight">
          Track your package
        </AppText>
      </AppView>

      {/* ── Ola Maps ── */}
      {showMap ? (
        <OlaMapView style={{ flex: 1 }}>
          {routeBounds && (
            <OlaMapCamera
              initialViewState={{
                bounds: routeBounds,
                padding: mapPadding,
              }}
            />
          )}
          <OlaMapPolyline coordinates={activeRoute} strokeColor="#FF5500" strokeWidth={4} />
          <OlaMapMarker coordinate={activeRoute[activeRoute.length - 1]}>
            <RouteEndpointMarker variant={isHeadingToPickup ? 'pickup' : 'drop'} />
          </OlaMapMarker>
          {isDelivering && (
            <OlaMapMarker coordinate={activeRoute[0]}>
              <RouteEndpointMarker variant="pickup" />
            </OlaMapMarker>
          )}
          <OlaMapMarker coordinate={driverPosition}>
            <DriverMarker vehicleImage={vehicleImage} />
          </OlaMapMarker>
        </OlaMapView>
      ) : (
        <AppView className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <AppText className="text-[13px] text-neutral-400 dark:text-neutral-500">
            {isSearching
              ? 'Live map appears once a driver is assigned'
              : 'This order was cancelled'}
          </AppText>
        </AppView>
      )}

      {/* ── Bottom sheet ── */}
      <AppView
        style={{ paddingBottom: insets.bottom + 16 }}
        className="bg-white dark:bg-neutral-900 rounded-t-3xl px-5 pt-5"
      >
        <AppText className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">
          Customer · Live tracking
        </AppText>
        <AppText className="text-[20px] font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
          {statusHeadline}
        </AppText>
        <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1">
          {statusSubtext}
        </AppText>
        {!isSearching && (
          <AppText className="text-[14px] font-bold text-[#FF5500] mt-2">
            Pickup OTP: {order.pickupOtp}
          </AppText>
        )}

        {/* Driver info */}
        <AppView className="flex-row items-center mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          {isSearching ? (
            <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400">
              We&apos;ll show your driver&apos;s details as soon as one is assigned.
            </AppText>
          ) : (
            <>
              <Avatar name={order.driver.name} size="lg" />
              <AppView className="ml-3 flex-1">
                <AppView className="flex-row items-center gap-1.5">
                  <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
                    {order.driver.name}
                  </AppText>
                  {Platform.OS === 'ios' ? (
                    <SymbolView name="star.fill" size={12} tintColor="#FF5500" />
                  ) : (
                    <AppText style={{ fontSize: 12 }}>⭐</AppText>
                  )}
                  <AppText className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
                    {order.driver.rating}
                  </AppText>
                </AppView>
                <AppText className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {order.driver.vehicleLabel} · {order.driver.vehiclePlate}
                </AppText>
              </AppView>
            </>
          )}
        </AppView>

        {/* Status timeline */}
        <AppView className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          {TRACKING_STEPS.map((step) => (
            <TrackingStepRow key={step.id} step={step} currentIndex={currentIndex} />
          ))}
        </AppView>

        {/* Footer actions */}
        <AppView className="flex-row gap-3 mt-4">
          <Button
            label="Contact Driver"
            size="lg"
            variant="primary"
            disabled={isSearching}
            onPress={handleContactDriver}
            className="flex-1 rounded-2xl bg-neutral-900 dark:bg-neutral-900 border-neutral-900"
            textClassName="text-white"
            leftIcon={
              Platform.OS === 'ios' ? (
                <SymbolView name="phone.fill" size={16} tintColor="#FFFFFF" />
              ) : (
                <AppText style={{ fontSize: 14 }}>📞</AppText>
              )
            }
          />
          <AppPressable
            onPress={() => router.replace('/home')}
            className="w-14 h-14 rounded-2xl bg-neutral-900 items-center justify-center"
          >
            {Platform.OS === 'ios' ? (
              <SymbolView name="house.fill" size={18} tintColor="#FFFFFF" />
            ) : (
              <AppText style={{ fontSize: 16 }}>🏠</AppText>
            )}
          </AppPressable>
        </AppView>
      </AppView>
    </AppView>
  );
}
