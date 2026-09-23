import { request } from './client';
import type { AccountSummary, SupportInfo } from './models';

export const contentApi = {
  getAccountSummary: (signal?: AbortSignal) =>
    request<AccountSummary>({ url: '/me/account-summary', signal }),

  getSupport: (signal?: AbortSignal) => request<SupportInfo>({ url: '/support', signal }),
};
