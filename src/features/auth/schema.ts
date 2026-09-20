import { z } from 'zod';

export const emailLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type EmailLoginInput = z.infer<typeof emailLoginSchema>;

export const otpVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  otp: z
    .string()
    .length(4, 'OTP must be exactly 4 digits')
    .regex(/^[0-9]{4}$/, 'OTP must contain only numbers'),
});

export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;
