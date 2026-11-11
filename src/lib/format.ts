/** Short date + time for order lists, in the device's locale. */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Today, 6:33 AM", "Yesterday, 9:10 PM", else "12 Nov, 1:17 AM": how order history reads. */
export function formatOrderTime(timestamp: number): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  if (timestamp >= startOfToday.getTime()) return `Today, ${time}`;
  if (timestamp >= startOfToday.getTime() - dayMs) return `Yesterday, ${time}`;
  return formatDateTime(timestamp);
}

/** Day + month, e.g. "15 Sep", in the device's locale. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** ₹55 rather than ₹55.00; paise only when there are some. */
export function formatFare(amount: number): string {
  return `₹${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}
