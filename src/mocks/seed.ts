/**
 * Seed data for the in-app mock backend. In production all of this lives in
 * the backend; the app only ever sees it through the API (see docs/API.md).
 */
import type {
  AccountSummary,
  CouponSummary,
  Driver,
  GeoPoint,
  LanguageOption,
  OfferBanner,
  Place,
  SupportInfo,
  VehicleType,
  WalletTransaction,
} from '@/lib/api/models';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
];

/** Demo OTP accepted by the mock server for any email. */
export const DEMO_OTP = '1234';
export const OTP_LENGTH = 4;
export const OTP_RESEND_SECONDS = 24;

export const FEATURED_VEHICLES: VehicleType[] = [
  {
    id: 'bike',
    name: 'Bike',
    description: 'Up to 20 kg · Documents, food, small parcels',
    capacityKg: 20,
    imageKey: 'bike',
  },
  {
    id: 'mini-truck',
    name: 'Mini Truck',
    description: 'Up to 600 kg · Home appliances, large cargo',
    capacityKg: 600,
    imageKey: 'mini-truck',
  },
];

export const STANDARD_VEHICLES: VehicleType[] = [
  {
    id: 'large-truck',
    name: 'Large Truck',
    description: null,
    capacityKg: 2500,
    imageKey: 'large-truck',
  },
  { id: 'e-rikshaw', name: 'e-Rikshaw', description: null, capacityKg: 300, imageKey: 'e-rikshaw' },
  {
    id: 'pickup-truck',
    name: 'Pickup Truck',
    description: null,
    capacityKg: 1000,
    imageKey: 'pickup-truck',
  },
];

export interface RideRate {
  vehicleId: string;
  name: string;
  description: string;
  imageKey: string;
  etaMinutes: number;
  baseFare: number;
  perKmRate: number;
  /** Flat fare when the trip distance is unknown. */
  flatFare: number;
}

export const RIDE_RATES: RideRate[] = [
  {
    vehicleId: 'bike',
    name: 'Bike',
    description: 'Up to 20 kg · Documents, food, small parcels',
    imageKey: 'bike',
    etaMinutes: 8,
    baseFare: 49,
    perKmRate: 10,
    flatFare: 89,
  },
  {
    vehicleId: 'e-rikshaw',
    name: 'e-Rikshaw',
    description: 'Up to 300 kg · City deliveries, medium loads',
    imageKey: 'e-rikshaw',
    etaMinutes: 12,
    baseFare: 99,
    perKmRate: 16,
    flatFare: 159,
  },
  {
    vehicleId: 'mini-truck',
    name: 'Mini Truck',
    description: 'Up to 600 kg · Home appliances, large cargo',
    imageKey: 'mini-truck',
    etaMinutes: 18,
    baseFare: 199,
    perKmRate: 22,
    flatFare: 299,
  },
  {
    vehicleId: 'pickup-truck',
    name: 'Pickup Truck',
    description: 'Up to 1,000 kg · Shop stock, bulk goods',
    imageKey: 'pickup-truck',
    etaMinutes: 15,
    baseFare: 249,
    perKmRate: 28,
    flatFare: 369,
  },
  {
    vehicleId: 'large-truck',
    name: 'Large Truck',
    description: 'Up to 2,500 kg · House shifting, heavy loads',
    imageKey: 'large-truck',
    etaMinutes: 25,
    baseFare: 499,
    perKmRate: 45,
    flatFare: 699,
  },
];

export interface CouponRule extends CouponSummary {
  discountType: 'percent' | 'flat';
  discountValue: number;
  maxDiscount: number;
  minOrderValue: number;
  /** null = every vehicle */
  vehicleIds: string[] | null;
}

export const COUPON_RULES: CouponRule[] = [
  {
    code: 'RYNO50',
    title: '50% off your first delivery',
    description: 'Get 50% off, up to ₹100.',
    discountType: 'percent',
    discountValue: 50,
    maxDiscount: 100,
    minOrderValue: 0,
    vehicleIds: null,
  },
  {
    code: 'TRUCK150',
    title: 'Flat ₹150 off on trucks',
    description: 'Valid on Mini Truck, Pickup Truck and Large Truck. Min order ₹300.',
    discountType: 'flat',
    discountValue: 150,
    maxDiscount: 150,
    minOrderValue: 300,
    vehicleIds: ['mini-truck', 'pickup-truck', 'large-truck'],
  },
  {
    code: 'BIKE20',
    title: '20% off on Bike deliveries',
    description: 'Get 20% off, up to ₹40.',
    discountType: 'percent',
    discountValue: 20,
    maxDiscount: 40,
    minOrderValue: 0,
    vehicleIds: ['bike'],
  },
];

export const OFFER_BANNERS: OfferBanner[] = [
  {
    id: 'banner-first-delivery',
    imageKey: 'first-delivery',
    altText: '50% off your first delivery, up to ₹100. Use code RYNO50.',
  },
  {
    id: 'banner-truck-flat',
    imageKey: 'truck-flat',
    altText: 'Flat ₹150 off on Mini, Pickup and Large Truck. Use code TRUCK150.',
  },
  {
    id: 'banner-bike-deal',
    imageKey: 'bike-deal',
    altText: '20% off on Bike deliveries, up to ₹40. Use code BIKE20.',
  },
];

/** Known places so search works instantly and offline in the demo. */
export const PLACES: Place[] = [
  {
    id: 'place-cp',
    name: 'Connaught Place',
    address: 'Rajiv Chowk, New Delhi',
    location: { latitude: 28.6315, longitude: 77.2167 },
  },
  {
    id: 'place-india-gate',
    name: 'India Gate',
    address: 'Kartavya Path, New Delhi',
    location: { latitude: 28.6129, longitude: 77.2295 },
  },
  {
    id: 'place-hans-bhawan',
    name: 'Hans Bhawan',
    address: 'Wing-1, IP Estate, New Delhi',
    location: { latitude: 28.628, longitude: 77.2405 },
  },
  {
    id: 'place-karol-bagh',
    name: 'Karol Bagh Market',
    address: 'Ajmal Khan Road, Karol Bagh, New Delhi',
    location: { latitude: 28.6519, longitude: 77.1909 },
  },
  {
    id: 'place-chandni-chowk',
    name: 'Chandni Chowk',
    address: 'Old Delhi, New Delhi',
    location: { latitude: 28.6506, longitude: 77.2303 },
  },
  {
    id: 'place-saket',
    name: 'Select Citywalk',
    address: 'Saket District Centre, New Delhi',
    location: { latitude: 28.5287, longitude: 77.2193 },
  },
  {
    id: 'place-nehru-place',
    name: 'Nehru Place',
    address: 'Nehru Place, New Delhi',
    location: { latitude: 28.5491, longitude: 77.2533 },
  },
  {
    id: 'place-airport-t3',
    name: 'IGI Airport T3',
    address: 'Indira Gandhi International Airport, New Delhi',
    location: { latitude: 28.5562, longitude: 77.1 },
  },
  {
    id: 'place-noida-18',
    name: 'Sector 18 Market',
    address: 'Sector 18, Noida',
    location: { latitude: 28.5708, longitude: 77.3261 },
  },
  {
    id: 'place-cyber-hub',
    name: 'Cyber Hub',
    address: 'DLF Cyber City, Gurugram',
    location: { latitude: 28.4955, longitude: 77.0891 },
  },
];

export const DEFAULT_PICKUP: Place = PLACES[2];

export const DRIVERS: Driver[] = [
  {
    id: 'drv-1',
    name: 'Arun Kumar',
    rating: 4.9,
    phone: '+919845010001',
    vehicleLabel: 'Mini Truck',
    vehiclePlate: 'KA 03 MX 2814',
  },
  {
    id: 'drv-2',
    name: 'Rakesh Singh',
    rating: 4.8,
    phone: '+919845010002',
    vehicleLabel: 'Pickup Truck',
    vehiclePlate: 'DL 4C AX 7710',
  },
  {
    id: 'drv-3',
    name: 'Suresh Yadav',
    rating: 4.7,
    phone: '+919845010003',
    vehicleLabel: 'Bike',
    vehiclePlate: 'HR 26 BK 5521',
  },
  {
    id: 'drv-4',
    name: 'Manoj Sharma',
    rating: 4.95,
    phone: '+919845010004',
    vehicleLabel: 'e-Rikshaw',
    vehiclePlate: 'DL 1RA 3390',
  },
  {
    id: 'drv-5',
    name: 'Vikram Yadav',
    rating: 4.6,
    phone: '+919845010005',
    vehicleLabel: 'Large Truck',
    vehiclePlate: 'UP 16 CT 8843',
  },
];

/** Used when a trip's addresses have no coordinates (illustrative only). */
export const FALLBACK_ROUTE: GeoPoint[] = [
  { latitude: 28.6507, longitude: 77.2334 },
  { latitude: 28.6455, longitude: 77.2378 },
  { latitude: 28.6395, longitude: 77.242 },
  { latitude: 28.6321, longitude: 77.2455 },
];

export const ACCOUNT_SUMMARY: AccountSummary = {
  rating: 4.93,
  promoItems: [
    {
      id: 'promos',
      title: 'You have multiple promos',
      subtitle: 'Check the offers on the home screen and use a code at checkout',
      icon: 'percent',
    },
    {
      id: 'ryno',
      title: 'Save with RYNO',
      subtitle: 'Get rewards for 1 month at 40% off',
      icon: 'gift.fill',
    },
    {
      id: 'safety',
      title: 'Safety check-up',
      subtitle: 'Learn ways to make rides safer',
      icon: 'checkmark.shield.fill',
    },
  ],
  menuLinks: [
    { id: 'refer', label: 'Refer & Earn' },
    { id: 'about', label: 'About' },
    { id: 'terms', label: 'Terms and Conditions' },
    { id: 'privacy', label: 'Privacy Policy' },
  ],
};

export const SUPPORT_INFO: SupportInfo = {
  phone: '+911800000000',
  email: 'support@ryno.in',
  faqs: [
    {
      id: 'faq-otp',
      question: 'Why do I need to share the pickup OTP?',
      answer:
        'The driver asks for the OTP at pickup to confirm they are collecting the right package. Share it only with the driver assigned to your order.',
    },
    {
      id: 'faq-receiver',
      question: 'How does the receiver track the delivery?',
      answer:
        'Tap "Share tracking" on the tracking screen. The receiver gets a link with live tracking and the delivery OTP to give the driver at drop.',
    },
    {
      id: 'faq-payment',
      question: 'When do I pay — at pickup or at drop?',
      answer:
        'You choose on the booking screen. Pay at pickup if you are the sender, or at drop if the receiver will pay.',
    },
    {
      id: 'faq-cancel',
      question: 'Can I cancel my order?',
      answer: 'Yes. You can cancel from the tracking screen until the package is picked up.',
    },
    {
      id: 'faq-coupon',
      question: 'How do coupons work?',
      answer:
        'Enter the code shown on an offer banner at checkout. The discount is taken off the fare before you book.',
    },
    {
      id: 'faq-items',
      question: "What items can't I send?",
      answer:
        'Cash, jewellery, illegal goods, flammable or hazardous materials and live animals are not allowed.',
    },
  ],
};

export const SEED_TRANSACTIONS: Omit<WalletTransaction, 'id'>[] = [
  {
    title: 'Trip to Connaught Place',
    createdAt: '2026-09-15T10:00:00.000Z',
    amount: 283.82,
    kind: 'debit',
  },
  { title: 'Wallet Top Up', createdAt: '2026-09-10T10:00:00.000Z', amount: 500, kind: 'credit' },
  { title: 'Trip to Airport', createdAt: '2026-09-05T10:00:00.000Z', amount: 450, kind: 'debit' },
  { title: 'Wallet Top Up', createdAt: '2026-09-01T10:00:00.000Z', amount: 500, kind: 'credit' },
];

/** Starting balance for a new wallet — what the seeded history adds up to. */
export const SEED_WALLET_BALANCE =
  Math.round(
    SEED_TRANSACTIONS.reduce(
      (sum, txn) => sum + (txn.kind === 'credit' ? txn.amount : -txn.amount),
      0,
    ) * 100,
  ) / 100;
