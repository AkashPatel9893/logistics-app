import { request } from './client';
import type { AccountSummary, SupportInfo } from './models';

export const contentApi = {
  getAccountSummary: async (signal?: AbortSignal): Promise<AccountSummary> => {
    try {
      const res = await request<any>({ url: '/customers/me', signal });
      return {
        rating: res.rating == null ? null : Number(res.rating),
        promoItems: res.promoItems ?? res.promo_items ?? [],
        menuLinks: res.menuLinks ?? res.menu_links ?? [],
      };
    } catch {
      return {
        rating: null,
        promoItems: [],
        menuLinks: [],
      };
    }
  },

  getSupport: async (signal?: AbortSignal): Promise<SupportInfo> => {
    const res = await request<any>({ url: '/support', signal });
    return {
      phone: res.phone,
      email: res.email,
      whatsapp: res.whatsapp,
      faqUrl: res.faq_url,
      faqs: Array.isArray(res.faqs) ? res.faqs : [],
    };
  },
};
