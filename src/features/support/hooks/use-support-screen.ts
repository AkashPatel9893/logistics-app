import { useState } from 'react';

import type { Order } from '@/lib/api/models';
import { openInAppBrowser } from '@/lib/browser';
import { openExternalUrl } from '@/lib/native';
import { useLocalSearchParams } from '@/lib/navigation';
import { useOrder, useOrderHistory, useSupportInfo } from '@/queries';

export function useSupportScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const supportQuery = useSupportInfo();
  const support = supportQuery.data;
  const linkedOrder = useOrder(orderId);
  const history = useOrderHistory();
  const latest = history.data?.pages[0]?.items[0];
  const order = orderId ? linkedOrder.data : latest;
  const orderPending = orderId ? linkedOrder.isPending : history.isPending;
  const [reportFor, setReportFor] = useState<Order | null>(null);

  const orderRef = order ? `#${order.number}` : null;
  const emailSubject = encodeURIComponent(
    orderRef ? `Help with order ${orderRef}` : 'Help with RYNO',
  );

  const handleCall = () => {
    const rawPhone = support?.phone?.trim();
    if (!rawPhone) return;
    openExternalUrl(`tel:${rawPhone.replace(/[^\d+]/g, '')}`, `Please dial ${rawPhone} manually.`);
  };

  const handleEmail = () => {
    const email = support?.email?.trim();
    if (!email) return;
    openExternalUrl(`mailto:${email}?subject=${emailSubject}`, `Please write to ${email}.`);
  };

  const handleWhatsApp = () => {
    if (!support?.whatsapp) return;
    const cleanPhone = support.whatsapp.replace(/[^0-9]/g, '');
    if (!cleanPhone) return;
    const text = encodeURIComponent(
      orderRef ? `Hi RYNO Support, I need help with order ${orderRef}` : 'Hi RYNO Support',
    );
    openExternalUrl(
      `https://wa.me/${cleanPhone}?text=${text}`,
      `Please message ${support.whatsapp} on WhatsApp.`,
    );
  };

  const handleOpenFaq = () => {
    if (!support?.faqUrl) return;
    void openInAppBrowser(support.faqUrl);
  };

  return {
    orderId,
    order,
    orderPending,
    support,
    isSupportPending: supportQuery.isPending,
    refetchSupport: supportQuery.refetch,
    reportFor,
    setReportFor,
    handleCall,
    handleEmail,
    handleWhatsApp,
    handleOpenFaq,
  };
}
