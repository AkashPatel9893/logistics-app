import { AppText, AppView, Icon } from '@/components/ui';
import type { TripDraft } from '@/stores/trip-store';

function ContactLine({ label, name, phone }: { label: string; name?: string; phone?: string }) {
  const details = [name, phone].filter(Boolean).join(' · ');
  if (!details) return null;
  return (
    <AppView row className="px-4 pb-1 pt-2">
      <AppText numberOfLines={1} className="flex-1 text-[12px] text-muted">
        {label}: {details}
      </AppText>
    </AppView>
  );
}

export function RouteSummary({ draft }: { draft: TripDraft }) {
  return (
    <>
      <AppView row className="border-b border-divider px-4 pb-3">
        <AppView className="mr-2 size-2.5 rounded-full bg-pickup" />
        {/* Both labels flex so a long pickup can't squeeze the drop down to one letter. */}
        <AppText numberOfLines={1} className="flex-1 text-[13px] font-semibold text-foreground">
          {draft.pickupLabel}
        </AppText>
        <AppView className="mx-2">
          <Icon name="arrow.right" size={12} tone="icon-subtle" />
        </AppView>
        <AppView className="mr-2 size-2.5 rounded-full bg-brand" />
        <AppText numberOfLines={1} className="flex-1 text-[13px] font-semibold text-foreground">
          {draft.dropLabel || 'Drop location'}
        </AppText>
      </AppView>
      <ContactLine
        label="Sender"
        name={draft.pickupDetails?.contactName}
        phone={draft.pickupDetails?.contactPhone}
      />
      <ContactLine
        label="Receiver"
        name={draft.dropDetails?.contactName}
        phone={draft.dropDetails?.contactPhone}
      />
    </>
  );
}
