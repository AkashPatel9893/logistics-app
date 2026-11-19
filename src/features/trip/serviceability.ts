import { catalogApi } from '@/lib/api/catalog';
import { isInServiceArea, type GeoPoint } from '@/lib/geo';
import { Alert } from '@/lib/native';

export const NOT_SERVICEABLE_TITLE = 'Area not serviceable';

export function notServiceableMessage(kind: 'pickup' | 'drop' | 'stop'): string {
  const role = kind === 'pickup' ? 'pickup' : kind === 'stop' ? 'stop' : 'drop';
  return `Sorry, Ryno doesn't deliver to this ${role} location yet. Try choosing another spot.`;
}

export async function isServiceable(point: GeoPoint): Promise<boolean> {
  if (!isInServiceArea(point)) return false;
  return catalogApi.isServiceable(point).catch(() => true);
}

export function alertNotServiceable(kind: 'pickup' | 'drop' | 'stop'): void {
  Alert.alert(NOT_SERVICEABLE_TITLE, notServiceableMessage(kind));
}
