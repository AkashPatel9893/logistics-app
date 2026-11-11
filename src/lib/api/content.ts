import { request } from './client';
import type { SupportInfo, SupportTicket, SupportTicketInput } from './models';

export const contentApi = {
  getSupport: async (signal?: AbortSignal): Promise<SupportInfo> => {
    const res = await request<any>({ url: '/support', signal });
    return {
      phone: res.phone ?? '',
      email: res.email ?? '',
      whatsapp: res.whatsapp ?? '',
      faqUrl: res.faq_url ?? '',
    };
  },

  /** Raises a ticket the support team answers; tied to an order when there is one. */
  createTicket: async (input: SupportTicketInput): Promise<SupportTicket> => {
    const res = await request<any>({
      method: 'POST',
      url: '/support/tickets',
      data: {
        category: input.category,
        subject: input.subject,
        description: input.description,
        order_id: input.orderId ?? null,
      },
    });
    return { id: String(res.id), number: res.ticket_number, status: res.status };
  },
};
