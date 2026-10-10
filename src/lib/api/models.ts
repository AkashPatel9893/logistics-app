/**
 * Domain models exchanged with the RYNO backend.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// ─── Auth & profile ─────────────────────────────────────────────────────────

export type UsageType = 'personal' | 'business';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  usageType: UsageType;
  isOnboarded: boolean;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

export interface OtpChallenge {
  otpLength: number;
  resendInSeconds: number;
  expiresInSeconds: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Catalogue & pricing ────────────────────────────────────────────────────

export interface VehicleType {
  id: string;
  name: string;
  description: string | null;
  capacityKg: number;
  /** Vehicle picture served by the backend; null shows the app's one fallback image. */
  imageUrl: string | null;
}

export interface VehicleCatalog {
  featured: VehicleType[];
  standard: VehicleType[];
}

export type CouponCheck = { valid: true; discount: number } | { valid: false; reason: string };

export interface RideQuoteOption {
  vehicleId: string;
  /** Backend price quote this option was priced with; the order is booked against it. */
  quoteId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  /** Minutes for a driver to reach the pickup point; null when the backend gives no estimate. */
  etaMinutes: number | null;
  fare: number;
  /** Result of the requested coupon for this vehicle, when a coupon was sent. */
  coupon: CouponCheck | null;
}

export interface RideQuote {
  /** Road distance estimate; null when either end has no coordinates. */
  distanceKm: number | null;
  couponCode: string | null;
  options: RideQuoteOption[];
}

export interface CouponSummary {
  code: string;
  title: string;
  description: string;
}

// ─── Places & addresses ─────────────────────────────────────────────────────

export interface Place {
  id: string;
  name: string;
  address: string;
  location: GeoPoint | null;
}

export type AddressLabel = 'recent' | 'home' | 'work' | 'other';

export interface SavedAddress {
  id: string;
  name: string;
  address: string;
  label: AddressLabel;
  isFavorite: boolean;
  location: GeoPoint | null;
  /** Contact last used at this address, to pre-fill the next booking. */
  contact: { name: string; phone: string; houseNumber: string } | null;
  lastUsedAt: string;
}

// ─── Orders & tracking ──────────────────────────────────────────────────────

/**
 * Order lifecycle, shared with the driver app (see ../../GlobalApi.md). The
 * driver app moves an order forward; this app shows the same states.
 */
export type OrderStatus =
  | 'searching'
  | 'heading_to_pickup'
  | 'arrived_at_pickup'
  | 'pickup_complete'
  | 'arrived_at_drop'
  | 'delivered'
  | 'cancelled';

export type PaymentTiming = 'on-pickup' | 'on-delivery';

export interface OrderContact {
  name: string;
  phone: string;
}

export interface OrderStop {
  label: string;
  location: GeoPoint | null;
  houseNumber: string;
  contact: OrderContact | null;
}

export interface Driver {
  id: string;
  /** Empty, null or '' fields are unknown — the UI leaves them out rather than inventing them. */
  name: string;
  rating: number | null;
  phone: string | null;
  vehicleLabel: string;
  vehiclePlate: string;
}

export interface Order {
  id: string;
  /** Short human-facing reference, e.g. "RY4F2K9". */
  number: string;
  createdAt: string;
  status: OrderStatus;
  pickup: OrderStop;
  drop: OrderStop;
  vehicle: { id: string; name: string; imageUrl: string | null };
  pricing: {
    fare: number;
    discount: number;
    payable: number;
    couponCode: string | null;
    distanceKm: number | null;
  };
  payment: { methodLabel: string; timing: PaymentTiming };
  /** Estimated trip minutes; null when the backend gives no estimate. */
  etaMinutes: number | null;
  /** When a driver is (or will be) assigned — drives the "finding driver" countdown. */
  driverAssignAt: string;
  driver: Driver | null;
  /** Sender shares this with the driver at pickup. */
  pickupOtp: string;
  /** Receiver shares this with the driver at drop. */
  deliveryOtp: string;
  /** Planned pickup → drop route. */
  route: GeoPoint[];
  /** The backend stopped (or paused) looking: no driver accepted. Only while `status` is searching. */
  noDriverFound: boolean;
  /** Driver's last reported position while a trip is active. */
  driverLocation: GeoPoint | null;
  rating: number | null;
  cancelledAt: string | null;
}

export interface CreateOrderInput {
  pickup: OrderStop;
  drop: OrderStop;
  /** Stops delivered, in order, before the final drop. */
  stops?: OrderStop[];
  vehicleId: string;
  couponCode: string | null;
  paymentMethodId: string;
  paymentTiming: PaymentTiming;
}

/** Live position pushed over the tracking socket. */
export interface DriverLocation {
  location: GeoPoint;
  /** Which leg the driver is on. */
  leg: 'to_pickup' | 'to_drop';
  /** Remaining path for the current leg (for drawing the route). */
  path: GeoPoint[];
  updatedAt: string;
}

export interface TrackingShare {
  token: string;
  url: string;
  expiresAt: string;
}

/** Receiver-safe view of an order, opened from a shared link without login. */
export interface SharedTracking {
  orderNumber: string;
  status: OrderStatus;
  senderName: string;
  pickupLabel: string;
  dropLabel: string;
  vehicleName: string;
  vehicleImageUrl: string | null;
  etaMinutes: number;
  driverAssignAt: string;
  driver: Pick<Driver, 'name' | 'rating' | 'phone' | 'vehicleLabel' | 'vehiclePlate'> | null;
  deliveryOtp: string;
  route: GeoPoint[];
}

// ─── Wallet ─────────────────────────────────────────────────────────────────

export type PaymentMethodType = 'cash' | 'upi' | 'card' | 'paytm';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  subtitle: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  createdAt: string;
  amount: number;
  kind: 'debit' | 'credit';
}

export interface Wallet {
  balance: number;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string;
  transactions: WalletTransaction[];
}

export type AddPaymentMethodInput =
  { type: 'upi'; upiId: string } | { type: 'card'; cardNumber: string } | { type: 'paytm' };

// ─── Content ────────────────────────────────────────────────────────────────

export interface OfferBanner {
  id: string;
  imageKey: string;
  altText: string;
}

export interface AccountSummary {
  rating: number;
  promoItems: { id: string; title: string; subtitle: string; icon: string }[];
  menuLinks: { id: string; label: string }[];
}

export interface SupportInfo {
  phone: string;
  email: string;
  faqs: { id: string; question: string; answer: string }[];
}
