import { ok, requireUser } from '../http';
import { ACCOUNT_SUMMARY, SUPPORT_INFO } from '../seed';
import type { Route } from './types';

export const contentRoutes: Route[] = [
  {
    method: 'GET',
    path: '/me/account-summary',
    handler: (req) => {
      requireUser(req);
      return ok(ACCOUNT_SUMMARY);
    },
  },
  {
    method: 'GET',
    path: '/support',
    handler: () => ok(SUPPORT_INFO),
  },
];
