import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import {
  AnimatedView,
  AppPressable,
  AppScrollView,
  AppText,
  AppView,
  Button,
  Card,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  ScreenHeader,
  type IconName,
  SkeletonCardList,
} from '@/components/ui';
import {
  useDeleteAddress,
  useSavedAddresses,
  useToggleFavoriteAddress,
} from '@/hooks/use-addresses';
import { getErrorMessage } from '@/lib/api/api-error';
import type { AddressLabel, SavedAddress } from '@/lib/api/models';
import { goBack } from '@/lib/go-back';
import { DURATION, ENTER_EASE_OUT, staggerDelay } from '@/lib/motion';

const LABEL_ICON: Record<AddressLabel, IconName> = {
  home: 'house.fill',
  work: 'briefcase',
  other: 'mappin',
  recent: 'clock',
};

function AddressCard({
  address,
  onToggleFavorite,
  onDelete,
}: {
  address: SavedAddress;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const contact = address.contact
    ? [address.contact.name, address.contact.phone].filter(Boolean).join(' · ')
    : '';
  return (
    <Card variant="elevated" className="overflow-hidden rounded-3xl p-0">
      <AppView row className="items-center p-4 pb-3">
        <IconBadge
          name={LABEL_ICON[address.label] ?? 'mappin'}
          tone="brand"
          className="mr-3 size-11 rounded-2xl bg-brand-soft"
        />
        <AppView className="flex-1">
          <AppText numberOfLines={1} className="text-[16px] font-bold text-foreground">
            {address.name}
          </AppText>
          {contact ? (
            <AppText numberOfLines={1} className="mt-0.5 text-[12.5px] text-muted">
              {contact}
            </AppText>
          ) : null}
        </AppView>
      </AppView>
      <AppView className="mx-4 mb-3 rounded-2xl bg-surface-muted p-3">
        {address.contact?.houseNumber ? (
          <AppText className="mb-1 text-[12.5px] font-semibold text-foreground">
            House / flat: {address.contact.houseNumber}
          </AppText>
        ) : null}
        <AppText className="text-[13px] leading-[18px] text-muted">{address.address}</AppText>
      </AppView>
      <AppView row className="border-t border-divider">
        <AppPressable
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={address.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-3"
        >
          <Icon name={address.isFavorite ? 'heart.fill' : 'heart'} size={15} tone="brand" />
          <AppText className="text-[13px] font-bold text-brand-strong">
            {address.isFavorite ? 'Favourited' : 'Favourite'}
          </AppText>
        </AppPressable>
        <AppView className="my-2.5 w-px bg-divider" />
        <AppPressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${address.name}`}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-3"
        >
          <Icon name="xmark.circle.fill" size={15} tone="danger" />
          <AppText className="text-[13px] font-bold text-danger">Delete</AppText>
        </AppPressable>
      </AppView>
    </Card>
  );
}

/** The customer's saved places: who's there, the house number, favourite and delete. */
export function SavedAddressesScreen() {
  const router = useRouter();
  const addressesQuery = useSavedAddresses();
  const toggleFavorite = useToggleFavoriteAddress();
  const deleteAddress = useDeleteAddress();
  // "Recent" places are history, not ones the customer saved.
  const saved = (addressesQuery.data ?? []).filter((a) => a.label !== 'recent');

  const confirmDelete = (address: SavedAddress) => {
    Alert.alert('Delete this address?', `${address.name} will be removed from your saved places.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAddress.mutate(address.id, {
            onError: (error) => Alert.alert('Could not delete', getErrorMessage(error)),
          }),
      },
    ]);
  };

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Saved addresses" onBack={() => goBack(router)} className="pb-3" />
      <AppScrollView contentContainerClassName="gap-3 px-4 pb-8">
        {addressesQuery.isPending ? (
          <SkeletonCardList count={2} withBody />
        ) : addressesQuery.isError ? (
          <AppView className="items-center py-16">
            <AppText className="text-center text-[13px] text-muted">
              {getErrorMessage(addressesQuery.error)}
            </AppText>
            <Button
              label="Try again"
              variant="ghost"
              size="sm"
              onPress={() => addressesQuery.refetch()}
            />
          </AppView>
        ) : saved.length === 0 ? (
          <AppView className="items-center py-16">
            <IconBadge
              name="heart.fill"
              tone="brand"
              iconSize={28}
              className="mb-4 size-20 bg-brand-soft"
            />
            <AppText className="text-[17px] font-bold text-foreground">No saved addresses</AppText>
            <AppText className="mt-1 px-8 text-center text-[13px] leading-[19px] text-muted">
              Tap the heart next to a place when you search for a pickup or drop to save it here.
            </AppText>
          </AppView>
        ) : (
          saved.map((address, index) => (
            <AnimatedView
              key={address.id}
              entering={FadeInDown.duration(DURATION.enter)
                .delay(staggerDelay(index))
                .easing(ENTER_EASE_OUT)}
            >
              <AddressCard
                address={address}
                onToggleFavorite={() => toggleFavorite.mutate(address.id)}
                onDelete={() => confirmDelete(address)}
              />
            </AnimatedView>
          ))
        )}
      </AppScrollView>
    </AppView>
  );
}
