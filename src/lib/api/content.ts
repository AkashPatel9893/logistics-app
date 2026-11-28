import { request } from './client';
import type {
  SupportInfo,
  SupportMessage,
  SupportTicket,
  SupportTicketInput,
  SupportTicketSummary,
} from './models';

function mapTicket(row: any): SupportTicketSummary {
  return {
    id: String(row.id),
    number: String(row.ticket_number ?? ''),
    status: String(row.status ?? ''),
    subject: String(row.subject ?? ''),
    orderId: row.order_id ? String(row.order_id) : null,
    resolutionNote: row.resolution_note ?? null,
    createdAt: String(row.created_at ?? ''),
  };
}

function mapMessage(row: any): SupportMessage {
  return {
    id: String(row.id),
    sender: String(row.sender_type ?? ''),
    body: String(row.message ?? ''),
    createdAt: String(row.created_at ?? ''),
  };
}

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

  listTickets: async (signal?: AbortSignal): Promise<SupportTicketSummary[]> => {
    const res = await request<any[]>({ url: '/support/tickets', signal });
    return (Array.isArray(res) ? res : []).map(mapTicket);
  },

  getTicketMessages: async (id: string, signal?: AbortSignal): Promise<SupportMessage[]> => {
    const res = await request<any[]>({ url: `/support/tickets/${id}/messages`, signal });
    return (Array.isArray(res) ? res : []).map(mapMessage);
  },

  replyToTicket: async ({ id, body }: { id: string; body: string }): Promise<SupportMessage> =>
    mapMessage(
      await request<any>({
        method: 'POST',
        url: `/support/tickets/${id}/messages`,
        data: { message: body },
      }),
    ),
};
