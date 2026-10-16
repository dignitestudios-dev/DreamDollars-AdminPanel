import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(254, "Email must be at most 254 characters")
    .regex(/^\S+$/, "Spaces are not allowed in email")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be at most 128 characters")
    .regex(/^\S+$/, "Spaces are not allowed in password"),
});

export type LoginFormData = z.infer<typeof loginSchema>;