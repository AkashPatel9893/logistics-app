import { request } from './client';
import type { AccountSummary, SupportInfo } from './models';

export const contentApi = {
  getAccountSummary: async (signal?: AbortSignal): Promise<AccountSummary> => {
    try {
      const res = await request<any>({ url: '/me/account-summary', signal });
      return {
        rating: Number(res.rating ?? 4.9),
        promoItems: res.promoItems ?? res.promo_items ?? [],
        menuLinks: res.menuLinks ?? res.menu_links ?? [],
      };
    } catch {
      return {
        rating: 4.9,
        promoItems: [],
        menuLinks: [
          { id: 'refer', label: 'Refer & Earn' },
          { id: 'about', label: 'About RYNO' },
          { id: 'terms', label: 'Terms and Conditions' },
          { id: 'privacy', label: 'Privacy Policy' },
        ],
      };
    }
  },

  getSupport: async (signal?: AbortSignal): Promise<SupportInfo> => {
    try {
      const res = await request<any>({ url: '/support', signal });
      return {
        phone: res?.phone ?? '+911800120120',
        email: res?.email ?? 'support@ryno.app',
        whatsapp: res?.whatsapp ?? '+919876543210',
        faqUrl: res?.faq_url ?? 'https://ryno.app/faq',
        faqs: Array.isArray(res?.faqs) ? res.faqs : [],
      };
    } catch {
      return {
        phone: '+911800120120',
        email: 'support@ryno.app',
        whatsapp: '+919876543210',
        faqUrl: 'https://ryno.app/faq',
        faqs: [],
      };
    }
  },
};
