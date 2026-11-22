import type { RideQuoteOption } from '@/lib/api/models';

export interface FareSummary {
  tripFare: number;
  discount: number;
  tax: number;
  /** Rounding to the plan's step (+/-). Zero when the fare card has no rounding. */
  roundOff: number;
  amountPayable: number;
}

const cents = (value: number) => Math.round(value * 100) / 100;
const NOT_TRIP_FARE = new Set(['DISCOUNT', 'TAX', 'ROUNDING']);

/**
 * Splits a quote into the lines a customer expects: trip fare, coupon, tax, round-off, amount payable.
 * Trip fare is every price line except discount, tax and rounding (the priority fee is already folded into
 * the base fare by the backend). The round-off is whatever remains between the parts and the backend's total.
 */
export function fareSummary(breakdown: RideQuoteOption['breakdown']): FareSummary {
  const tripFare = cents(
    breakdown.lines
      .filter((line) => !NOT_TRIP_FARE.has(line.type))
      .reduce((sum, line) => sum + line.amount, 0),
  );
  const discount = cents(breakdown.discount);
  const tax = cents(breakdown.tax);
  const amountPayable = cents(breakdown.total);
  const roundOff = cents(amountPayable - (tripFare - discount + tax));
  return { tripFare, discount, tax, roundOff, amountPayable };
}
