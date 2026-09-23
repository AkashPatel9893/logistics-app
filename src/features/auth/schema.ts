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

export const profileCreationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters'),
  phone: z
    .string()
    .trim()
    .min(10, 'Please enter a valid 10-digit phone number')
    .regex(/^[0-9+\s-]{10,15}$/, 'Please enter a valid phone number'),
  usageType: z.enum(['personal', 'business']).default('personal'),
});

export type ProfileCreationInput = z.infer<typeof profileCreationSchema>;
