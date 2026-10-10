import { z } from 'zod';

export const emailLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Phone or email is required')
    .refine(
      (val) =>
        z.string().email().safeParse(val).success ||
        /^[+]?[0-9]{10,14}$/.test(val.replace(/[\s-]/g, '')),
      { message: 'Please enter a valid phone number or email address' },
    ),
});

export type EmailLoginInput = z.infer<typeof emailLoginSchema>;

export const otpVerificationSchema = z.object({
  email: z.string().trim().min(1, 'Phone or email is required'),
  otp: z
    .string()
    .min(4, 'OTP must be at least 4 digits')
    .max(8, 'OTP must be at most 8 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers'),
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
