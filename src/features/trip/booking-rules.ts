/**
 * Review Booking notices: the "Read before booking" rules and the restricted-items list.
 *
 * The backend does not serve either yet (BACKEND_TODO.md item 12), so these are defaults. The app
 * uses the server's `booking_rules` / `restricted_items` from GET /config as soon as it sends them
 * (see `pickNotice`), so ops can own the wording later without an app release.
 *
 * Only statements that hold for every vehicle and plan belong here. Numbers (free loading minutes,
 * per-minute charges) and claims about tolls must come from the backend, never from this file.
 */
export const DEFAULT_BOOKING_RULES: readonly string[] = [
  "Fare doesn't include labour charges for loading and unloading.",
  'Fare may change if the route, stops or locations change.',
  'Parking charges are paid by the customer.',
  "We don't allow overloading beyond the vehicle's capacity.",
];

export const DEFAULT_RESTRICTED_ITEMS: readonly string[] = [
  'Explosives and fireworks',
  'Flammable liquids and compressed gas cylinders',
  'Firearms, ammunition and weapons',
  'Illegal drugs and banned substances',
  'Alcohol',
  'Live animals',
  'Cash, jewellery and other high-value valuables',
];

/** The server's list when it sent a usable one, else the default. */
export function pickNotice(
  fromServer: readonly string[] | undefined,
  fallback: readonly string[],
): readonly string[] {
  return fromServer && fromServer.length > 0 ? fromServer : fallback;
}
