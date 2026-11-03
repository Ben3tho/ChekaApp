import { z } from 'zod';

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must only contain letters, numbers, and underscores'),
  email: z
    .string()
    .trim()
    .email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address format'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
