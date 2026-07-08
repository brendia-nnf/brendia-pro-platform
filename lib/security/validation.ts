import { z } from "zod";

// Common validation schemas

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email too long");

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and a number"
  );

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long")
  .regex(/^[\p{L}\s'-]+$/u, "Name contains invalid characters");

// Phone validation (flexible for international formats)
export const phoneSchema = z
  .string()
  .min(6, "Phone number too short")
  .max(20, "Phone number too long")
  .regex(/^[+\d\s()-]+$/, "Invalid phone number format");

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format");

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Register schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  phone: phoneSchema.optional(),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  fullName: nameSchema.optional(),
  phone: phoneSchema.optional().nullable(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
});

// Progress update schema
export const progressUpdateSchema = z.object({
  watchPercentage: z
    .number()
    .int()
    .min(0, "Percentage cannot be negative")
    .max(100, "Percentage cannot exceed 100"),
  lastPosition: z
    .number()
    .int()
    .min(0, "Position cannot be negative"),
  watchTime: z
    .number()
    .int()
    .min(0)
    .optional(),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z
    .string()
    .min(3, "Subject too short")
    .max(200, "Subject too long"),
  message: z
    .string()
    .min(10, "Message too short")
    .max(5000, "Message too long"),
});

// Sanitization helpers

/**
 * Remove HTML tags and dangerous characters
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>'"]/g, "") // Remove potential XSS characters
    .trim();
}

/**
 * Sanitize an object's string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and parse request body
 */
export async function validateBody<T>(
  body: unknown,
  schema: z.Schema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || "Validation failed",
    };
  }

  return { success: true, data: result.data };
}
