import { Alert } from 'react-native';

import { catalogApi } from '@/lib/api/catalog';
import {
  isInServiceArea,
  NOT_SERVICEABLE_TITLE,
  notServiceableMessage,
  type GeoPoint,
} from '@/lib/geo';

/**
 * Whether Ryno delivers at this point. Asked as soon as a place is chosen, so nobody fills in
 * contact details only to be refused at the fare. If the check itself fails the place is allowed,
 * because the fare request gives the final answer anyway.
 */
export async function isServiceable(point: GeoPoint): Promise<boolean> {
  if (!isInServiceArea(point)) return false;
  return catalogApi.isServiceable(point).catch(() => true);
}

export function alertNotServiceable(kind: 'pickup' | 'drop' | 'stop'): void {
  Alert.alert(NOT_SERVICEABLE_TITLE, notServiceableMessage(kind));
}
