import {
  AnimatedView,
  AppFlatList,
  AppPressable,
  AppText,
  AppView,
  Button,
  Card,
  FocusAwareStatusBar,
  Icon,
  IconBadge,
  ScreenHeader,
  SkeletonCardList,
  type IconName,
} from '@/components/ui';
import type { AddressLabel, SavedAddress } from '@/lib/api/models';
import { DURATION, ENTER_EASE_OUT, FadeInDown, staggerDelay } from '@/lib/motion';
import { goBack, useRouter } from '@/lib/navigation';

import { useSavedAddressesList } from './hooks/use-saved-addresses-list';

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

export function SavedAddressesScreen() {
  const router = useRouter();
  const { addresses, isPending, isError, errorMessage, refetch, toggleFavorite, confirmDelete } =
    useSavedAddressesList();

  return (
    <AppView className="flex-1 bg-grouped">
      <FocusAwareStatusBar />
      <ScreenHeader title="Saved addresses" onBack={() => goBack(router)} className="pb-3" />
      {isPending ? (
        <AppView className="px-4 pt-1">
          <SkeletonCardList count={2} withBody />
        </AppView>
      ) : isError ? (
        <AppView className="items-center px-4 py-16">
          <AppText className="text-center text-[13px] text-muted">{errorMessage}</AppText>
          <Button label="Try again" variant="ghost" size="sm" onPress={() => refetch()} />
        </AppView>
      ) : (
        <AppFlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-8"
          ListEmptyComponent={
            <AppView className="items-center py-16">
              <IconBadge
                name="heart.fill"
                tone="brand"
                iconSize={28}
                className="mb-4 size-20 bg-brand-soft"
              />
              <AppText className="text-[17px] font-bold text-foreground">
                No saved addresses
              </AppText>
              <AppText className="mt-1 px-8 text-center text-[13px] leading-[19px] text-muted">
                Tap the heart next to a place when you search for a pickup or drop to save it here.
              </AppText>
            </AppView>
          }
          renderItem={({ item: address, index }) => (
            <AnimatedView
              entering={FadeInDown.duration(DURATION.enter)
                .delay(staggerDelay(index))
                .easing(ENTER_EASE_OUT)}
              className="mb-3"
            >
              <AddressCard
                address={address}
                onToggleFavorite={() => toggleFavorite(address.id)}
                onDelete={() => confirmDelete(address)}
              />
            </AnimatedView>
          )}
        />
      )}
    </AppView>
  );
}
