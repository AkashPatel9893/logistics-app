import { placesEndpoints } from '@/data/mock';

export interface DirectoryPlace {
  id: string;
  name: string;
  address: string;
}

// A small local "known places" corpus so search-as-you-type has something to
// match against instantly, without a places API. Real free-text queries that
// don't match anything here still resolve through device geocoding.
export const PLACE_DIRECTORY: DirectoryPlace[] = placesEndpoints.placesDirectoryEndpoint.data;

function matches(query: string, place: { name: string; address: string }): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  return place.name.toLowerCase().includes(needle) || place.address.toLowerCase().includes(needle);
}

export function searchPlaceDirectory<T extends { name: string; address: string }>(
  query: string,
  extraSources: T[][],
): (DirectoryPlace | T)[] {
  const seen = new Set<string>();
  const results: (DirectoryPlace | T)[] = [];

  for (const source of [...extraSources, PLACE_DIRECTORY]) {
    for (const place of source) {
      const key = place.name.toLowerCase();
      if (seen.has(key)) continue;
      if (matches(query, place)) {
        seen.add(key);
        results.push(place);
      }
    }
  }

  return results;
}
