/**
 * One line naming a place: its label followed by the area, without repeating
 * a part ("67/1, Bengaluru" + "Ashok Nagar, Bengaluru, Karnataka, India" →
 * "67/1, Bengaluru, Ashok Nagar, Karnataka, India"). Every screen that shows a
 * pickup or drop uses it, so the same place always reads the same way.
 */
export function placeLine(label: string | undefined, address: string | undefined): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const part of [label, address].flatMap((text) => (text ?? '').split(','))) {
    const trimmed = part.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    parts.push(trimmed);
  }
  return parts.join(', ');
}
