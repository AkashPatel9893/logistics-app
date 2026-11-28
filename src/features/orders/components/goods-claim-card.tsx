import { useState } from 'react';

import { BookingSheet, SheetOption } from '@/components/booking-sheet';
import {
  AppPressable,
  AppText,
  AppView,
  Button,
  Card,
  Icon,
  Skeleton,
  TextField,
} from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import type { GoodsClaim, Order } from '@/lib/api/models';
import { formatFare, formatShortDate } from '@/lib/format';
import { Alert } from '@/lib/native';
import { useFileGoodsClaim, useGoodsClaim } from '@/queries';

const CLAIM_STATUS: Record<string, string> = {
  SUBMITTED: 'We are checking your claim.',
  APPROVED: 'Claim approved.',
  PARTIAL: 'Claim partly approved.',
  REJECTED: 'Claim not approved.',
};

const REFUND_STATUS: Record<string, string> = {
  PROCESSING: 'Refund on the way',
  COMPLETED: 'Refunded',
  CANCELLED: 'Refund cancelled',
};

/** Refund status and the damaged/lost goods claim on a finished order. */
export function GoodsClaimCard({ order }: { order: Order }) {
  const claimable = order.status === 'delivered' || order.status === 'delivery_failed';
  const claim = useGoodsClaim(order.id, claimable);
  const [open, setOpen] = useState(false);

  if (!claimable && !order.refund) return null;

  return (
    <>
      {order.refund ? <RefundRow refund={order.refund} /> : null}
      {!claimable ? null : claim.isPending ? (
        <Skeleton className="h-[72px] rounded-3xl" />
      ) : claim.isError ? (
        <AppPressable onPress={() => claim.refetch()} className="rounded-3xl bg-surface p-4">
          <AppText className="text-[13px] text-muted">
            Claim details could not be loaded. Tap to retry.
          </AppText>
        </AppPressable>
      ) : claim.data ? (
        <ClaimStatus claim={claim.data} />
      ) : (
        <AppPressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Goods damaged or lost? File a claim"
        >
          <Card variant="elevated" className="flex-row items-center rounded-3xl p-3.5">
            <AppView className="mr-3 size-10 items-center justify-center rounded-xl bg-brand-soft">
              <Icon name="shippingbox.fill" size={18} tone="brand" />
            </AppView>
            <AppView className="flex-1">
              <AppText className="text-[15px] font-bold text-foreground">
                Goods damaged or lost?
              </AppText>
              <AppText className="mt-0.5 text-[12px] text-muted">
                File a claim for this trip
              </AppText>
            </AppView>
            <Icon name="chevron.right" size={14} tone="icon-subtle" />
          </Card>
        </AppPressable>
      )}
      <ClaimSheet order={open ? order : null} onClose={() => setOpen(false)} />
    </>
  );
}

function RefundRow({ refund }: { refund: NonNullable<Order['refund']> }) {
  const when = refund.completedAt ?? refund.initiatedAt;
  return (
    <Card variant="elevated" className="flex-row items-center rounded-3xl p-4">
      <AppView className="flex-1">
        <AppText className="text-[15px] font-bold text-foreground">
          {REFUND_STATUS[refund.status] ?? 'Refund'}
        </AppText>
        {when ? (
          <AppText className="mt-0.5 text-[12px] text-muted">{formatShortDate(when)}</AppText>
        ) : null}
      </AppView>
      <AppText className="text-[16px] font-black tabular-nums text-foreground">
        {formatFare(refund.amount)}
      </AppText>
    </Card>
  );
}

function ClaimStatus({ claim }: { claim: GoodsClaim }) {
  const decided = claim.status === 'APPROVED' || claim.status === 'PARTIAL';
  return (
    <Card variant="elevated" className="rounded-3xl p-4">
      <AppText className="text-[15px] font-bold text-foreground">
        {claim.type === 'LOST' ? 'Lost goods claim' : 'Damaged goods claim'}
      </AppText>
      <AppText className="mt-0.5 text-[12px] text-muted">
        {claim.number}
        {claim.createdAt ? ` · ${formatShortDate(claim.createdAt)}` : ''}
      </AppText>
      <AppText className="mt-2 text-[14px] text-foreground-secondary">
        {CLAIM_STATUS[claim.status] ?? 'We are checking your claim.'}
        {decided && claim.decidedAmount != null
          ? ` Agreed amount ${formatFare(claim.decidedAmount)}. Our team will contact you about payment.`
          : ''}
      </AppText>
    </Card>
  );
}

function ClaimSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const file = useFileGoodsClaim();
  const [type, setType] = useState<'DAMAGED' | 'LOST' | null>(null);
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    if (!order || !type) return;
    const description = details.trim();
    if (description.length < 10)
      return setError('Tell us what happened in at least 10 characters.');
    const value = amount.trim() ? Number(amount) : undefined;
    if (value !== undefined && !(value > 0))
      return setError('Enter the amount in rupees, or leave it empty.');
    setError(undefined);
    file.mutate(
      { orderId: order.id, type, description, claimedAmount: value },
      {
        onSuccess: (claim) => {
          onClose();
          setType(null);
          setDetails('');
          setAmount('');
          Alert.alert('Claim filed', `Claim ${claim.number}. Our team will review it.`);
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  };

  return (
    <BookingSheet
      visible={order !== null}
      onClose={onClose}
      size="full"
      title="Goods damaged or lost?"
      subtitle={order ? `Trip #${order.number}` : undefined}
      footer={
        <Button
          label="File claim"
          className="h-14"
          disabled={!type}
          loading={file.isPending}
          onPress={submit}
        />
      }
    >
      <AppView className="gap-2">
        <SheetOption
          label="Goods were damaged"
          icon="shippingbox.fill"
          selected={type === 'DAMAGED'}
          onPress={() => setType('DAMAGED')}
        />
        <SheetOption
          label="Goods were lost"
          icon="questionmark.circle"
          selected={type === 'LOST'}
          onPress={() => setType('LOST')}
        />
      </AppView>
      <TextField
        className="mt-3"
        value={details}
        onChangeText={setDetails}
        placeholder="What happened? Which items?"
        multiline
        maxLength={2000}
        inputClassName="min-h-[96px]"
        textAlignVertical="top"
        accessibilityLabel="What happened"
      />
      <TextField
        className="mt-3"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))}
        placeholder="Value of the goods in ₹ (optional)"
        keyboardType="decimal-pad"
        maxLength={10}
        accessibilityLabel="Value of the goods in rupees"
      />
      {error ? <AppText className="mt-2 text-[13px] text-error">{error}</AppText> : null}
    </BookingSheet>
  );
}
