import { useState } from 'react';
import { Alert } from 'react-native';

import { BookingSheet, SheetOption } from '@/components/booking-sheet';
import { AppView, Button, TextField, type IconName } from '@/components/ui';
import { useCreateSupportTicket } from '@/hooks/use-content';
import { getErrorMessage } from '@/lib/api/api-error';
import type { Order, SupportCategory } from '@/lib/api/models';

interface IssueOption {
  category: SupportCategory;
  label: string;
  icon: IconName;
}

const ISSUES: IssueOption[] = [
  { category: 'DAMAGE', label: 'My goods were damaged or missing', icon: 'shippingbox.fill' },
  { category: 'DRIVER_BEHAVIOUR', label: 'Problem with the driver', icon: 'person.fill' },
  {
    category: 'PAYMENT',
    label: 'I was charged the wrong amount',
    icon: 'indianrupeesign.circle.fill',
  },
  { category: 'REFUND', label: 'I need a refund', icon: 'creditcard' },
  { category: 'ORDER', label: 'Problem with the trip', icon: 'box.truck.fill' },
  { category: 'OTHER', label: 'Something else', icon: 'questionmark.circle' },
];

export interface ReportIssueSheetProps {
  order: Order | null;
  onClose: () => void;
}

/** Raises a support ticket about one order: what went wrong, and a few words about it. */
export function ReportIssueSheet({ order, onClose }: ReportIssueSheetProps) {
  const createTicket = useCreateSupportTicket();
  const [issue, setIssue] = useState<IssueOption | null>(null);
  const [details, setDetails] = useState('');

  // Fresh form for each order the sheet opens on.
  const [openedFor, setOpenedFor] = useState(order?.id);
  if (order?.id !== openedFor) {
    setOpenedFor(order?.id);
    setIssue(null);
    setDetails('');
  }

  const submit = () => {
    if (!order || !issue) return;
    createTicket.mutate(
      {
        category: issue.category,
        subject: `${issue.label} (#${order.number})`,
        // The backend wants a description; the chosen issue stands in when nothing is typed.
        description: details.trim() || issue.label,
        orderId: order.id,
      },
      {
        onSuccess: (ticket) => {
          onClose();
          Alert.alert(
            'Issue reported',
            `Ticket ${ticket.number}. Our team will look into it and get back to you.`,
          );
        },
        onError: (error) => Alert.alert('Could not report the issue', getErrorMessage(error)),
      },
    );
  };

  return (
    <BookingSheet
      visible={order !== null}
      onClose={onClose}
      size="full"
      title="What went wrong?"
      subtitle={order ? `Trip #${order.number}` : undefined}
      footer={
        <Button
          label="Report issue"
          className="h-14"
          disabled={!issue}
          loading={createTicket.isPending}
          onPress={submit}
        />
      }
    >
      <AppView className="gap-2">
        {ISSUES.map((option) => (
          <SheetOption
            key={option.category}
            label={option.label}
            icon={option.icon}
            selected={issue?.category === option.category}
            onPress={() => setIssue(option)}
          />
        ))}
      </AppView>
      <TextField
        className="mt-3"
        value={details}
        onChangeText={setDetails}
        placeholder="Tell us what happened (optional)"
        multiline
        maxLength={1000}
        inputClassName="min-h-[96px]"
        textAlignVertical="top"
        accessibilityLabel="Details"
      />
    </BookingSheet>
  );
}
