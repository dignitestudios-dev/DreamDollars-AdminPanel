import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email must be at most 254 characters")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .trim()
    .min(1, "Password is required")
    .max(128, "Password must be at most 128 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
