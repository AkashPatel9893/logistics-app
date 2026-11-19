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

export function pickNotice(
  fromServer: readonly string[] | undefined,
  fallback: readonly string[],
): readonly string[] {
  return fromServer && fromServer.length > 0 ? fromServer : fallback;
}
