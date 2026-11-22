import { useState } from 'react';

import type { IconName } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/api-error';
import type { Order, SupportCategory } from '@/lib/api/models';
import { Alert } from '@/lib/native';
import { useCreateSupportTicket } from '@/queries';

export interface IssueOption {
  category: SupportCategory;
  label: string;
  icon: IconName;
}

export const REPORT_ISSUES: IssueOption[] = [
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

export function useReportIssueForm(order: Order | null, onClose: () => void) {
  const createTicket = useCreateSupportTicket();
  const [issue, setIssue] = useState<IssueOption | null>(null);
  const [details, setDetails] = useState('');
  const [openedFor, setOpenedFor] = useState(order?.id);

  if (order?.id !== openedFor) {
    setOpenedFor(order?.id);
    setIssue(null);
    setDetails('');
  }

  const submit = () => {
    if (!order || !issue) return;
    const trimmed = details.trim();
    const description =
      trimmed.length >= 3 ? trimmed : trimmed ? `${issue.label}: ${trimmed}` : issue.label;
    createTicket.mutate(
      {
        category: issue.category,
        subject: `${issue.label} (#${order.number})`,
        description,
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

  return {
    issue,
    setIssue,
    details,
    setDetails,
    isSubmitting: createTicket.isPending,
    submit,
  };
}
