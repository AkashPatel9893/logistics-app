export interface DirectoryPlace {
  id: string;
  name: string;
  address: string;
}

// A small local "known places" corpus so search-as-you-type has something to
// match against instantly, without a places API. Real free-text queries that
// don't match anything here still resolve through device geocoding.
export const PLACE_DIRECTORY: DirectoryPlace[] = [
  { id: 'place-a58', name: 'A 58', address: 'Yojna Vihar, Yamuna Bank, New Delhi' },
  {
    id: 'place-passport-seva',
    name: 'Passport Seva Kendra',
    address: 'Jhandewalan, Block E 3, New Delhi',
  },
  {
    id: 'place-connaught',
    name: 'Connaught Place',
    address: 'Block H, Radial Road 4, near Rajiv Chowk',
  },
  {
    id: 'place-igi-airport',
    name: "Indira Gandhi Int'l Airport",
    address: 'New Delhi, Delhi, 110037',
  },
  {
    id: 'place-dlf-cyber-city',
    name: 'DLF Cyber City',
    address: 'Phase 3, Sector 24, Gurugram, Haryana',
  },
  { id: 'place-red-fort', name: 'Red Fort', address: 'Netaji Subhash Marg, Chandni Chowk' },
  { id: 'place-india-gate', name: 'India Gate', address: 'Rajpath, New Delhi' },
  { id: 'place-lotus-temple', name: 'Lotus Temple', address: 'Lotus Temple Rd, Bahapur' },
  { id: 'place-akshardham', name: 'Akshardham Temple', address: 'Noida Mor, New Delhi' },
  {
    id: 'place-nehru-place',
    name: 'Nehru Place',
    address: 'Nehru Place Market, New Delhi',
  },
  {
    id: 'place-saket',
    name: 'Select Citywalk',
    address: 'District Centre, Saket, New Delhi',
  },
  { id: 'place-karol-bagh', name: 'Karol Bagh', address: 'Karol Bagh, New Delhi' },
];

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
