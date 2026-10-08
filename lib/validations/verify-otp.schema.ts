import { z } from "zod";

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email must be at most 254 characters")
    .email("Please enter a valid email address"),
  otp: z
    .string()
    .length(4, "OTP must be exactly 4 digits")
    .regex(/^\d{4}$/, "OTP must contain only digits"),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
