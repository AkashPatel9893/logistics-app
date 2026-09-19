import { z } from 'zod';

export const phoneLoginSchema = z.object({
  countryCode: z
    .string()
    .min(2, 'Country dial code is required')
    .regex(/^\+[0-9]{1,4}$/, 'Invalid country dial code format'),
  phoneNumber: z
    .string()
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => /^[0-9]{7,15}$/.test(val), {
      message: 'Phone number must contain between 7 and 15 digits',
    }),
});

export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;

export const otpVerificationSchema = z.object({
  countryCode: z.string().min(2, 'Country dial code is required'),
  phoneNumber: z.string().min(7, 'Phone number is required'),
  otp: z
    .string()
    .length(4, 'OTP must be exactly 4 digits')
    .regex(/^[0-9]{4}$/, 'OTP must contain only numbers'),
});

export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;
