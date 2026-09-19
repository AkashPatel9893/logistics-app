import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { Platform, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppPressable } from '@/components/ui/app-pressable';
import { AppText } from '@/components/ui/app-text';
import { AppView } from '@/components/ui/app-view';
import { LiquidGlassBackButton } from '@/components/ui/liquid-glass-back-button';

// ─── Types ───────────────────────────────────────────────────────────────────

type IconType = 'recent' | 'work' | 'home';

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
  iconType: IconType;
  isFavorited: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const RECENT_SAVED_LOCATIONS: SavedLocation[] = [
  {
    id: '1',
    name: 'A 58',
    address: 'Yojna Vihar, Yamuna Bank, New Delhi,...',
    distance: '1.6 km',
    iconType: 'recent',
    isFavorited: false,
  },
  {
    id: '2',
    name: 'Passport Seva Kendra',
    address: 'Jhandewalan, Block E 3, New Delhi, 11...',
    distance: '4.3 km',
    iconType: 'recent',
    isFavorited: true,
  },
  {
    id: '3',
    name: 'Work',
    address: 'Reyansh Authortopic Private Limited,...',
    distance: '14 km',
    iconType: 'work',
    isFavorited: true,
  },
  {
    id: '4',
    name: 'Home',
    address: 'Chaman Kumar, 6, Rama Park Rd, Moh...',
    distance: '20 km',
    iconType: 'home',
    isFavorited: true,
  },
  {
    id: '5',
    name: 'Connaught Place',
    address: 'Block H, Radial Road 4, near Rajiv Cho...',
    distance: '5.1 km',
    iconType: 'recent',
    isFavorited: false,
  },
  {
    id: '6',
    name: "Indira Gandhi Int'l Airport...",
    address: 'New Delhi, Delhi, 110037',
    distance: '23 km',
    iconType: 'recent',
    isFavorited: false,
  },
  {
    id: '7',
    name: 'DLF Cyber City',
    address: 'Phase 3, Sector 24, Gurugram, Harya...',
    distance: '28 km',
    iconType: 'work',
    isFavorited: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LocationIcon({ type }: { type: IconType }) {
  const symbolName = type === 'work' ? 'briefcase' : type === 'home' ? 'house' : 'clock';

  return (
    <AppView className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
      {Platform.OS === 'ios' ? (
        <SymbolView name={symbolName as any} size={18} tintColor="#6B7280" />
      ) : (
        <AppText className="text-neutral-500 text-base">📍</AppText>
      )}
    </AppView>
  );
}

interface LocationListItemProps {
  item: SavedLocation;
  onToggleFavorite: (id: string) => void;
  onPress: (item: SavedLocation) => void;
}

function LocationListItem({ item, onToggleFavorite, onPress }: LocationListItemProps) {
  return (
    <AppPressable onPress={() => onPress(item)} className="flex-row items-center px-4 py-3.5">
      <LocationIcon type={item.iconType} />

      <AppView className="flex-1 ml-3">
        <AppView className="flex-row items-center gap-2 mb-0.5">
          <AppText className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {item.name}
          </AppText>
          <AppView className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
            <AppText className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              {item.distance}
            </AppText>
          </AppView>
        </AppView>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function SelectDropAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pickupAddress] = useState('Hans Bhawan Wing-1, IP Estate, IP E...');
  const [dropAddress, setDropAddress] = useState('');
  const [locations, setLocations] = useState<SavedLocation[]>(RECENT_SAVED_LOCATIONS);

  const handleToggleFavorite = (id: string) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, isFavorited: !loc.isFavorited } : loc)),
    );
  };

  const handleLocationPress = (item: SavedLocation) => {
    setDropAddress(item.name);
  };

  return (
    <AppView className="flex-1 bg-[#F2F2F7] dark:bg-neutral-950">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Header ── */}
      <AppView style={{ paddingTop: insets.top + 8 }} className="flex-row items-center px-4 pb-4">
        <LiquidGlassBackButton onPress={() => router.back()} size={44} controlSize="large" />
        <AppText className="ml-3 text-[19px] font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          Select drop address
        </AppText>
      </AppView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
              {pickupAddress}
            </AppText>
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {Platform.OS === 'ios' ? (
                <SymbolView name="pencil" size={17} tintColor="#9CA3AF" />
              ) : (
                <AppText style={{ color: '#9CA3AF', fontSize: 16 }}>✏️</AppText>
              )}
            </TouchableOpacity>
          </AppView>

          {/* Dotted connector line */}
          <AppView style={{ marginLeft: 21, paddingVertical: 2, gap: 3, flexDirection: 'column' }}>
            {[0, 1, 2].map((i) => (
              <AppView
                key={i}
                style={{
                  width: 2,
                  height: 3,
                  borderRadius: 1,
                  backgroundColor: '#D1D5DB',
                }}
              />
            ))}
          </AppView>

          {/* Drop row */}
          <AppView className="flex-row items-center px-4 pt-2 pb-4">
            <AppView className="w-3 h-3 rounded-full bg-[#FF5A1F] mr-3" />
            <AppText
              className={`flex-1 text-[14px] font-medium ${
                dropAddress
                  ? 'text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
              numberOfLines={1}
            >
              {dropAddress || 'Drop Location'}
            </AppText>
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {Platform.OS === 'ios' ? (
                <SymbolView name="mic" size={17} tintColor="#9CA3AF" />
              ) : (
                <AppText style={{ color: '#9CA3AF', fontSize: 16 }}>🎤</AppText>
              )}
            </TouchableOpacity>
          </AppView>
        </AppView>

        {/* ── Action Buttons ── */}
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

          <AppPressable className="flex-1 flex-row items-center justify-center gap-2 py-3 px-4 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            {Platform.OS === 'ios' ? (
              <SymbolView name="plus" size={15} tintColor="#FF5A1F" />
            ) : null}
            <AppText className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
              Add stops
            </AppText>
          </AppPressable>
        </AppView>

        {/* ── Section Header ── */}
        <AppView className="mx-4 mb-3">
          <AppText className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">
            Recent & Saved Locations
          </AppText>
        </AppView>

        {/* ── Locations List ── */}
        <AppView className="mx-4 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          {locations.map((item, index) => (
            <AppView key={item.id}>
              <LocationListItem
                item={item}
                onToggleFavorite={handleToggleFavorite}
                onPress={handleLocationPress}
              />
              {index < locations.length - 1 && (
                <AppView
                  style={{
                    marginLeft: 68,
                    height: 1,
                    backgroundColor: '#F3F4F6',
                  }}
                />
              )}
            </AppView>
          ))}
        </AppView>
      </ScrollView>
    </AppView>
  );
}
