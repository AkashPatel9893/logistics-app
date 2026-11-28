export interface GeoPoint {
  latitude: number;
  longitude: number;
}

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

export interface VehicleType {
  id: string;
  name: string;
  description: string | null;
  capacityKg: number;
  code: string | null;
  category: string | null;
  cargoSizeCm: { length: number; width: number; height: number } | null;
  imageUrl: string | null;
}

export interface VehicleCatalog {
  featured: VehicleType[];
  standard: VehicleType[];
}

export type CouponCheck = { valid: true; discount: number } | { valid: false; reason: string };

export interface RideQuoteOption {
  vehicleId: string;
  quoteId: string;
  /** Priority booking: `available` when the vehicle offers it, `amount` is already inside the base fare line. */
  priority: { available: boolean; active: boolean; amount: number | null };
  breakdown: {
    lines: { type: string; label: string; amount: number }[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  name: string;
  vehicleCode: string | null;
  description: string;
  imageUrl: string | null;
  etaMinutes: number | null;
  fare: number;
  coupon: CouponCheck | null;
}

export interface RideQuote {
  distanceKm: number | null;
  couponCode: string | null;
  options: RideQuoteOption[];
}

export interface CouponSummary {
  code: string;
  title: string;
  description: string;
}

export interface Coupon extends CouponSummary {
  discountType: 'PERCENT' | 'FLAT' | string;
  discountValue: number;
  maxDiscount: number | null;
  minFare: number | null;
  vehicleTypeCodes: string[] | null;
  validUntil: string | null;
}

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
  contact: { name: string; phone: string; houseNumber: string } | null;
  lastUsedAt: string;
}

export type OrderStatus =
  | 'searching'
  | 'heading_to_pickup'
  | 'arrived_at_pickup'
  | 'pickup_complete'
  | 'arrived_at_drop'
  | 'awaiting_payment'
  | 'payment_failed'
  | 'delivery_failed'
  | 'unknown'
  | 'delivered'
  | 'cancelled';

export type PaymentTiming = 'on-pickup' | 'on-delivery';

export interface OrderContact {
  name: string;
  phone: string;
}

export interface OrderStop {
  label: string;
  street?: string;
  location: GeoPoint | null;
  houseNumber: string;
  contact: OrderContact | null;
}

export interface Driver {
  id: string;
  name: string;
  rating: number | null;
  phone: string | null;
  vehicleLabel: string;
  vehiclePlate: string;
}

export interface OrderStopProgress {
  id: string;
  number: number;
  label: string;
  contactName: string;
  contactPhone: string;
  status: 'pending' | 'arrived' | 'completed';
  code: string;
}

export interface ActiveStopWaiting {
  stopType: 'pickup' | 'drop';
  startedAt: string;
  freeWaitingUntil: string | null;
  ratePerMinute: number | null;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string | null;
  tripId: string | null;
  status: OrderStatus;
  pickup: OrderStop;
  drop: OrderStop;
  vehicle: { id: string; name: string; code: string | null; imageUrl: string | null };
  isPriority: boolean;
  /** Customer tips added so far, in rupees. */
  tipTotal: number;
  /** Present only while a tip can still be added (searching for a driver, not prepaid). */
  tipOptions: { amounts: number[]; maxTotal: number; remaining: number } | null;
  pricing: {
    fare: number | null;
    discount: number | null;
    payable: number | null;
    couponCode: string | null;
    distanceKm: number | null;
  };
  payment: { methodLabel: string; timing: PaymentTiming | null; status: string | null };
  etaMinutes: number | null;
  driverAssignAt: string | null;
  driver: Driver | null;
  pickupOtp: string;
  deliveryOtp: string;
  route: GeoPoint[];
  noDriverFound: boolean;
  stops: OrderStopProgress[];
  driverLocation: GeoPoint | null;
  driverLocationRecordedAt: string | null;
  driverLocationStale: boolean;
  liveEta: { seconds: number; meters: number; toPickup: boolean; computedAt: number | null } | null;
  /** Present while the driver is waiting/loading at pickup or drop. */
  activeWaiting: ActiveStopWaiting | null;
  rating: number | null;
  cancelledAt: string | null;
  cancellationFee: number | null;
  /** Latest refund on an online payment; null when there is none. */
  refund: OrderRefund | null;
}

export interface OrderRefund {
  /** PROCESSING, COMPLETED or CANCELLED. */
  status: string;
  amount: number;
  initiatedAt: string;
  completedAt: string | null;
}

export interface GoodsClaim {
  number: string;
  type: 'DAMAGED' | 'LOST';
  /** SUBMITTED, then APPROVED, PARTIAL or REJECTED. */
  status: string;
  claimedAmount: number | null;
  decidedAmount: number | null;
  createdAt: string;
}

export interface GoodsClaimInput {
  orderId: string;
  type: 'DAMAGED' | 'LOST';
  description: string;
  claimedAmount?: number;
}

export interface CreateOrderInput {
  pickup: OrderStop;
  drop: OrderStop;
  stops?: OrderStop[];
  vehicleId: string;
  quoteId?: string;
  /** Book as a priority order; also used if the quote has to be re-fetched. */
  priority?: boolean;
  couponCode: string | null;
  goods?: { category: string; description: string } | null;
}

export interface DriverLocation {
  location: GeoPoint;
  leg: 'to_pickup' | 'to_drop';
  path: GeoPoint[];
  updatedAt: string;
}

export interface TrackingShare {
  token: string;
  url: string;
  expiresAt: string;
}

export interface SharedTracking {
  view: 'ACTIVE' | 'DELIVERED';
  orderNumber: string;
  status: OrderStatus;
  senderName: string;
  pickupLabel: string | null;
  dropLabel: string | null;
  vehicleName: string;
  vehicleImageUrl: string | null;
  etaMinutes: number | null;
  driverAssignAt: string | null;
  deliveredAt: string | null;
  driverLocation: {
    latitude: number;
    longitude: number;
    heading: number | null;
    stale: boolean;
  } | null;
  driver: Pick<Driver, 'name' | 'rating' | 'phone' | 'vehicleLabel' | 'vehiclePlate'> | null;
  deliveryOtp: string;
  route: GeoPoint[];
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
  transactions: WalletTransaction[];
}

export interface OfferBanner {
  id: string;
  imageUrl: string;
  altText: string;
  couponCode: string | null;
}

export interface SupportInfo {
  phone: string;
  email: string;
  whatsapp: string;
  faqUrl: string;
}

export type SupportCategory =
  'ORDER' | 'PAYMENT' | 'REFUND' | 'DRIVER_BEHAVIOUR' | 'DAMAGE' | 'ACCOUNT' | 'OTHER';

export interface SupportTicketInput {
  category: SupportCategory;
  subject: string;
  description: string;
  orderId?: string;
}

export interface SupportTicket {
  id: string;
  number: string;
  status: string;
}

export interface SupportTicketSummary extends SupportTicket {
  subject: string;
  orderId: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  /** CUSTOMER, DRIVER, AGENT, SYSTEM or BOT. */
  sender: string;
  body: string;
  createdAt: string;
}

export interface AccountIdentity {
  email: string | null;
  emailVerified: boolean;
}
