/**
 * Error Message Utilities
 * Sanitize error messages to hide technical details in production
 */

/**
 * Get user-friendly error message
 * In development: shows full technical details
 * In production: shows sanitized, user-friendly message
 */
export function getUserFriendlyError(
  error: any,
  fallback: string = "An unexpected error occurred. Please try again."
): string {
  const isDev = process.env.NODE_ENV === "development"

  // In development, show full error details
  if (isDev) {
    return error?.message || error?.toString() || fallback
  }

  // In production, sanitize technical details
  const message = error?.message || error?.toString() || ""

  // List of technical terms to hide from users
  const technicalTerms = [
    "supabase",
    "postgres",
    "database",
    "rls",
    "row level security",
    "sql",
    "query",
    "relation",
    "constraint",
    "foreign key",
    "jwt",
    "token",
    "api",
    "edge function",
  ]

  // Check if error message contains technical terms (case-insensitive)
  const hasTechnicalTerm = technicalTerms.some((term) =>
    message.toLowerCase().includes(term)
  )

  if (hasTechnicalTerm) {
    // Return generic message instead of exposing technical details
    return fallback
  }

  // Safe messages that are user-friendly
  const userFriendlyMessages = [
    "Email not confirmed",
    "Invalid login credentials",
    "User already registered",
    "Invalid email or password",
    "Password must be at least",
    "Passwords do not match",
  ]

  const isUserFriendly = userFriendlyMessages.some((msg) =>
    message.includes(msg)
  )

  if (isUserFriendly) {
    return message
  }

  // Default to fallback for unknown errors
  return fallback
}

/**
 * Get environment-specific message
 * Only show detailed message in development
 */
export function getDevMessage(
  devMessage: string,
  prodMessage: string
): string {
  return process.env.NODE_ENV === "development" ? devMessage : prodMessage
}
