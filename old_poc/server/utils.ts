import { z } from "zod";

// UUID validation schema
export const uuidSchema = z.string().uuid({
  message: "Invalid UUID format",
});

// Utility function to validate UUID
export function validateUUID(uuid: string): { 
  valid: boolean; 
  error?: string; 
} {
  const result = uuidSchema.safeParse(uuid);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0].message,
    };
  }
  return { valid: true };
}
