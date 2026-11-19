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
