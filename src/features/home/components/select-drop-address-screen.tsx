import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { Button } from '@/components/ui/button';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';
import { searchPlaceDirectory } from '@/features/home/place-directory';
import {
  MAX_STOPS,
  useTripStore,
  type LocationIconType,
  type PickedRegion,
  type SavedAddress,
} from '@/stores/trip-store';

// ─── Types ───────────────────────────────────────────────────────────────────

type DisplayIconType = LocationIconType | 'search';

interface DisplayAddress {
  id: string;
  name: string;
  address: string;
  iconType: DisplayIconType;
  isFavorited: boolean;
  region?: PickedRegion | null;
}

interface LiveResult {
  name: string;
  address: string;
  region: PickedRegion;
}

const LIVE_SEARCH_MIN_LENGTH = 3;
const LIVE_SEARCH_DEBOUNCE_MS = 600;

// ─── Sub-components ───────────────────────────────────────────────────────────

function LocationIcon({ type }: { type: DisplayIconType }) {
  const symbolName =
    type === 'work'
      ? 'briefcase'
      : type === 'home'
        ? 'house'
        : type === 'search'
          ? 'mappin.circle.fill'
          : 'clock';

  return (
    <AppView className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
      {Platform.OS === 'ios' ? (
        <SymbolView
          name={symbolName as any}
          size={18}
          tintColor={type === 'search' ? '#FF5A1F' : '#6B7280'}
        />
      ) : (
        <AppText className="text-neutral-500 text-base">📍</AppText>
      )}
    </AppView>
  );
}

interface LocationListItemProps {
  item: DisplayAddress;
  isSelected: boolean;
  onToggleFavorite: (id: string) => void;
  onPress: (item: DisplayAddress) => void;
}

function LocationListItem({ item, isSelected, onToggleFavorite, onPress }: LocationListItemProps) {
  return (
    <AppPressable
      onPress={() => onPress(item)}
      className={
        isSelected
          ? 'flex-row items-center px-4 py-3.5 bg-orange-50/60 dark:bg-orange-950/20'
          : 'flex-row items-center px-4 py-3.5'
      }
    >
      <LocationIcon type={item.iconType} />

      <AppView className="flex-1 ml-3">
        <AppText className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
          {item.name}
        </AppText>
        <AppText className="text-[13px] text-neutral-400 dark:text-neutral-500" numberOfLines={1}>
          {item.address}
        </AppText>
      </AppView>

      <TouchableOpacity
        onPress={() => onToggleFavorite(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ marginLeft: 8 }}
      >
        {Platform.OS === 'ios' ? (
          <SymbolView
            name={item.isFavorited ? 'heart.fill' : 'heart'}
            size={20}
            tintColor={item.isFavorited ? '#FF5A1F' : '#D1D5DB'}
          />
        ) : (
          <AppText style={{ color: item.isFavorited ? '#FF5A1F' : '#D1D5DB', fontSize: 18 }}>
            ♥
          </AppText>
        )}
      </TouchableOpacity>
    </AppPressable>
  );
}

function toDisplayAddress(item: SavedAddress): DisplayAddress {
  return item;
}

function Connector() {
  return (
    <AppView style={{ marginLeft: 21, paddingVertical: 2, gap: 3, flexDirection: 'column' }}>
      {[0, 1, 2].map((i) => (
        <AppView
          key={i}
          style={{ width: 2, height: 3, borderRadius: 1, backgroundColor: '#D1D5DB' }}
        />
      ))}
    </AppView>
  );
}

interface StopRowProps {
  name: string;
  onRemove?: () => void;
}

function StopRow({ name, onRemove }: StopRowProps) {
  return (
    <AppView className="flex-row items-center px-4 pt-2 pb-2">
      <AppView className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
      <AppText
        className="flex-1 text-[14px] font-medium text-neutral-900 dark:text-neutral-100"
        numberOfLines={1}
      >
        {name}
      </AppText>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {Platform.OS === 'ios' ? (
            <SymbolView name="xmark.circle.fill" size={17} tintColor="#D1D5DB" />
          ) : (
            <AppText style={{ color: '#D1D5DB', fontSize: 16 }}>✕</AppText>
          )}
        </TouchableOpacity>
      ) : null}
    </AppView>
  );
}

async function resolveLiveAddress(query: string): Promise<LiveResult | null> {
  const geocoded = await Location.geocodeAsync(query);
  if (geocoded.length === 0) return null;

  const [place] = await Location.reverseGeocodeAsync(geocoded[0]);
  const addressLabel = place
    ? [place.name, place.street, place.city].filter(Boolean).slice(0, 2).join(', ')
    : query;

  return {
    name: query,
    address: addressLabel || query,
    region: { latitude: geocoded[0].latitude, longitude: geocoded[0].longitude },
  };
}

async function resolveRegionForAddress(addressText: string): Promise<PickedRegion | null> {
  try {
    const geocoded = await Location.geocodeAsync(addressText);
    if (geocoded.length === 0) return null;
    return { latitude: geocoded[0].latitude, longitude: geocoded[0].longitude };
  } catch {
    return null;
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function SelectDropAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { target } = useLocalSearchParams<{ target?: string }>();
  const isStopMode = target === 'stop';
  const addresses = useTripStore.use.addresses();
  const draft = useTripStore.use.draft();
  const [query, setQuery] = useState(isStopMode ? '' : draft.dropLabel);
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [isLiveSearching, setIsLiveSearching] = useState(false);

  const trimmedQuery = query.trim();

  // Debounced live device-geocoding search — no API key needed, resolves
  // whatever the user typed against the real Apple/Android geocoder.
  useEffect(() => {
    let cancelled = false;

    const timeoutId = setTimeout(
      async () => {
        if (trimmedQuery.length < LIVE_SEARCH_MIN_LENGTH) {
          setLiveResult(null);
          setIsLiveSearching(false);
          return;
        }

        setIsLiveSearching(true);
        try {
          const result = await resolveLiveAddress(trimmedQuery);
          if (!cancelled) setLiveResult(result);
        } catch {
          if (!cancelled) setLiveResult(null);
        } finally {
          if (!cancelled) setIsLiveSearching(false);
        }
      },
      trimmedQuery.length < LIVE_SEARCH_MIN_LENGTH ? 0 : LIVE_SEARCH_DEBOUNCE_MS,
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [trimmedQuery]);

  const localResults: DisplayAddress[] = trimmedQuery
    ? searchPlaceDirectory(trimmedQuery, [addresses]).map((place) => {
        const saved = addresses.find((a) => a.name.toLowerCase() === place.name.toLowerCase());
        return (
          saved ?? {
            id: place.name,
            name: place.name,
            address: place.address,
            iconType: 'recent' as const,
            isFavorited: false,
          }
        );
      })
    : addresses.map(toDisplayAddress);

  const hasLocalMatch = localResults.some(
    (r) => r.name.toLowerCase() === liveResult?.name.toLowerCase(),
  );

  const results: DisplayAddress[] =
    trimmedQuery && liveResult && !hasLocalMatch
      ? [
          {
            id: `live:${liveResult.name}`,
            name: liveResult.name,
            address: liveResult.address,
            iconType: 'search' as const,
            isFavorited: false,
            region: liveResult.region,
          },
          ...localResults,
        ]
      : localResults;

  const handleToggleFavorite = (id: string) => {
    useTripStore.getState().toggleFavoriteAddress(id);
  };

  const handleLocationPress = async (item: DisplayAddress) => {
    const region = item.region ?? (await resolveRegionForAddress(item.address || item.name));

    if (isStopMode) {
      useTripStore.getState().addStop({ ...item, region });
      router.back();
      return;
    }
    useTripStore.getState().selectDropAddress({ ...item, region });
    setQuery(item.name);
  };

  const handleSubmitSearch = () => {
    if (results.length > 0) {
      handleLocationPress(results[0]);
    }
  };

  const handleConfirm = () => {
    router.push('/trip-confirmation');
  };

  const handleRemoveStop = (id: string) => {
    useTripStore.getState().removeStop(id);
  };

  const handleAddStopPress = () => {
    router.push({ pathname: '/select-drop-address', params: { target: 'stop' } });
  };

  const stopsMaxed = draft.stops.length >= MAX_STOPS;

  const showNoResults =
    trimmedQuery.length >= LIVE_SEARCH_MIN_LENGTH && !isLiveSearching && results.length === 0;

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Header ── */}
      <AppView style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-4">
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
        <AppText className="ml-3 text-[19px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {isStopMode ? 'Add a stop' : 'Select drop address'}
        </AppText>
      </AppView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: insets.bottom + (!isStopMode && draft.dropLabel ? 96 : 24),
        }}
      >
        {/* ── Address Input Card ── */}
        <AppView className="mx-4 mb-4 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          {/* Pickup row */}
          <AppView className="flex-row items-center px-4 pt-4 pb-2">
            <AppView className="w-3 h-3 rounded-full bg-green-500 mr-3" />
            <AppText
              className="flex-1 text-[14px] font-medium text-neutral-900 dark:text-neutral-100"
              numberOfLines={1}
            >
              {draft.pickupLabel}
            </AppText>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: '/select-location-map', params: { target: 'pickup' } })
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {Platform.OS === 'ios' ? (
                <SymbolView name="pencil" size={17} tintColor="#9CA3AF" />
              ) : (
                <AppText style={{ color: '#9CA3AF', fontSize: 16 }}>✏️</AppText>
              )}
            </TouchableOpacity>
          </AppView>

          <Connector />

          {/* Stops (already added waypoints between pickup and drop) */}
          {draft.stops.map((stop) => (
            <AppView key={stop.id}>
              <StopRow
                name={stop.name}
                onRemove={isStopMode ? undefined : () => handleRemoveStop(stop.id)}
              />
              <Connector />
            </AppView>
          ))}

          {/* Drop row (or new-stop input, when adding a stop) */}
          <AppView className="flex-row items-center px-4 pt-2 pb-4">
            <AppView
              className={
                isStopMode
                  ? 'w-3 h-3 rounded-full bg-blue-500 mr-3'
                  : 'w-3 h-3 rounded-full bg-[#FF5A1F] mr-3'
              }
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={isStopMode ? 'Search a stop location' : 'Search a drop location'}
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-[14px] font-medium text-neutral-900 dark:text-neutral-100 p-0"
              returnKeyType="search"
              onSubmitEditing={handleSubmitSearch}
              autoCorrect={false}
            />
            {isLiveSearching && <ActivityIndicator size="small" color="#FF5A1F" />}
            {query.length > 0 && !isLiveSearching && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginRight: 8 }}
              >
                {Platform.OS === 'ios' ? (
                  <SymbolView name="xmark.circle.fill" size={16} tintColor="#D1D5DB" />
                ) : (
                  <AppText style={{ color: '#D1D5DB', fontSize: 16 }}>✕</AppText>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Voice Search', 'Listening for destination or pickup address...')
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {Platform.OS === 'ios' ? (
                <SymbolView name="mic" size={17} tintColor="#9CA3AF" />
              ) : (
                <AppText style={{ color: '#9CA3AF', fontSize: 16 }}>🎤</AppText>
              )}
            </TouchableOpacity>
          </AppView>
        </AppView>

        {/* ── Action Buttons ── */}
        {!isStopMode ? (
          <AppView className="flex-row mx-4 mb-5 gap-3">
            <AppPressable
              onPress={() => router.push('/select-location-map')}
              className="flex-1 flex-row items-center justify-center gap-2 py-3 px-4 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            >
              {Platform.OS === 'ios' ? (
                <SymbolView name="location" size={15} tintColor="#FF5A1F" />
              ) : null}
              <AppText className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                Select from map
              </AppText>
            </AppPressable>

            <AppPressable
              onPress={handleAddStopPress}
              disabled={stopsMaxed}
              className={`flex-1 flex-row items-center justify-center gap-2 py-3 px-4 rounded-full border bg-white dark:bg-neutral-900 ${
                stopsMaxed
                  ? 'border-neutral-200 dark:border-neutral-800 opacity-50'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {Platform.OS === 'ios' ? (
                <SymbolView name="plus" size={15} tintColor="#FF5A1F" />
              ) : null}
              <AppText className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                {stopsMaxed
                  ? `Stops (${draft.stops.length}/${MAX_STOPS})`
                  : draft.stops.length > 0
                    ? `Add stops (${draft.stops.length}/${MAX_STOPS})`
                    : 'Add stops'}
              </AppText>
            </AppPressable>
          </AppView>
        ) : null}

        {/* ── Section Header ── */}
        <AppView className="mx-4 mb-3">
          <AppText className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">
            {trimmedQuery ? 'Search results' : 'Recent & Saved Locations'}
          </AppText>
        </AppView>

        {/* ── Locations List ── */}
        <AppView className="mx-4 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          {results.map((item, index) => (
            <AppView key={item.id}>
              <LocationListItem
                item={item}
                isSelected={!isStopMode && draft.dropLabel === item.name}
                onToggleFavorite={handleToggleFavorite}
                onPress={handleLocationPress}
              />
              {index < results.length - 1 && (
                <AppView style={{ marginLeft: 68, height: 1, backgroundColor: '#F3F4F6' }} />
              )}
            </AppView>
          ))}

          {showNoResults && (
            <AppView className="px-4 py-4">
              <AppText className="text-[13px] text-neutral-400 dark:text-neutral-500">
                No matching address found for &quot;{trimmedQuery}&quot;.
              </AppText>
            </AppView>
          )}
        </AppView>
      </ScrollView>

      {/* ── Confirm bar ── */}
      {!isStopMode && draft.dropLabel ? (
        <AppView
          style={{ paddingBottom: insets.bottom + 12 }}
          className="absolute left-0 right-0 bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-4 pt-3"
        >
          <Button
            label="Confirm drop address"
            size="lg"
            className="rounded-2xl"
            onPress={handleConfirm}
          />
        </AppView>
      ) : null}
    </AppView>
  );
}
