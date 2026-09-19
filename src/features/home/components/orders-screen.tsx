import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Alert, Image as RNImage, ImageSourcePropType, Platform, StatusBar } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable, AppScrollView, AppText, AppView, Card } from '@/components/ui';
import { cn } from '@/lib/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

type TripStatus = 'Delivered' | 'Cancelled';

interface PastTrip {
  id: string;
  title: string;
  dateLabel: string;
  price: number;
  status: TripStatus;
  driversCount?: number;
  mapPreview?: boolean;
  image?: ImageSourcePropType;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ROUTE_PREVIEW_REGION = {
  latitude: 32.5,
  longitude: 129.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const PAST_TRIPS: PastTrip[] = [
  {
    id: 'trip-1',
    title: 'Destination · 3',
    dateLabel: '29 May · 11:29 pm',
    price: 0,
    status: 'Cancelled',
    driversCount: 2,
    mapPreview: true,
  },
  {
    id: 'trip-2',
    title: 'Indira Gandhi International Airport',
    dateLabel: '26 May · 4:11 am',
    price: 283.82,
    status: 'Delivered',
    image: require('@/assets/images/vehicles/bike.png'),
  },
  {
    id: 'trip-3',
    title: 'C-5',
    dateLabel: '22 May · 9:02 am',
    price: 0,
    status: 'Cancelled',
    image: require('@/assets/images/vehicles/e-rikshaw.png'),
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TripStatusText({ status }: { status: TripStatus }) {
  return (
    <AppText
      className={cn(
        'text-[13px] font-semibold',
        status === 'Cancelled' ? 'text-[#FF5500]' : 'text-neutral-900 dark:text-neutral-100',
      )}
    >
      {status}
    </AppText>
  );
}

function PastTripCard({ trip }: { trip: PastTrip }) {
  return (
    <Card variant="default" className="p-0 overflow-hidden mb-3">
      {trip.mapPreview && (
        <AppView className="h-32 w-full">
          <MapView
            style={{ flex: 1 }}
            initialRegion={ROUTE_PREVIEW_REGION}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            pointerEvents="none"
          />
        </AppView>
      )}

      <AppView className={cn('p-4', trip.mapPreview ? 'flex-col' : 'flex-row items-center')}>
        {trip.image && (
          <AppView className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 items-center justify-center overflow-hidden mr-3">
            <RNImage source={trip.image} style={{ width: 36, height: 36 }} resizeMode="contain" />
          </AppView>
        )}

        <AppView className="flex-1">
          <AppText
            className="text-[16px] font-bold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
          >
            {trip.title}
          </AppText>
          <AppText className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            {trip.dateLabel}
          </AppText>
          <AppView className="flex-row items-center gap-1 mt-1.5">
            <AppText className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              ₹{trip.price.toFixed(2)}
            </AppText>
            <AppText className="text-[13px] text-neutral-400"> · </AppText>
            <TripStatusText status={trip.status} />
            {trip.driversCount !== undefined && (
              <>
                <AppText className="text-[13px] text-neutral-400"> · </AppText>
                <AppText className="text-[13px] text-neutral-500 dark:text-neutral-400">
                  {trip.driversCount} drivers
                </AppText>
              </>
            )}
          </AppView>
        </AppView>
      </AppView>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <AppView className="flex-1 bg-[#F9F8F5] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <AppScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-36"
        style={{ paddingTop: insets.top + 16 }}
      >
        <AppText className="text-[32px] font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight mb-5">
          Orders
        </AppText>

        {/* Upcoming */}
        <AppText className="text-[18px] font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Upcoming
        </AppText>
        <Card variant="default" className="mb-6">
          <AppText className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
            You have no upcoming trips
          </AppText>
          <AppPressable onPress={() => router.push('/home')} className="mt-1.5 self-start">
            <AppView className="flex-row items-center gap-1.5">
              <AppText className="text-[14px] font-semibold text-[#FF5500]">
                Reserve your trip
              </AppText>
              {Platform.OS === 'ios' ? (
                <SymbolView name="arrow.right" size={13} tintColor="#FF5500" />
              ) : (
                <AppText className="text-[14px] font-semibold text-[#FF5500]">→</AppText>
              )}
            </AppView>
          </AppPressable>
        </Card>

        {/* Past */}
        <AppView className="flex-row items-center justify-between mb-3">
          <AppText className="text-[18px] font-bold text-neutral-900 dark:text-neutral-100">
            Past
          </AppText>
          <AppPressable
            onPress={() => Alert.alert('Filter trips', 'Filter and sort options')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {Platform.OS === 'ios' ? (
              <SymbolView name="slider.horizontal.3" size={18} tintColor="#171717" />
            ) : (
              <AppText style={{ fontSize: 16 }}>⚙️</AppText>
            )}
          </AppPressable>
        </AppView>

        {PAST_TRIPS.map((trip) => (
          <PastTripCard key={trip.id} trip={trip} />
        ))}
      </AppScrollView>
    </AppView>
  );
}
