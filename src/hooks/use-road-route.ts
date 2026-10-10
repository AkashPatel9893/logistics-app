import { useQuery } from '@tanstack/react-query';

import { directionsApi } from '@/lib/api/directions';
import type { GeoPoint } from '@/lib/api/models';

/**
 * Road-following path between two points. `id` names the leg so the path is
 * fetched once per leg rather than on every driver position update; call
 * `refetch` to re-route from a new `from`.
 */
export function useRoadRoute(
  id: string,
  from: GeoPoint | null,
  to: GeoPoint | null,
  via: GeoPoint[] = [],
) {
  return useQuery({
    queryKey: ['road-route', id],
    queryFn: ({ signal }) => directionsApi.getRoadRoute(from!, to!, via, signal),
    enabled: Boolean(from && to),
    staleTime: Infinity,
    retry: 1,
  });
}
