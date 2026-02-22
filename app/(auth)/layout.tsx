/**
 * Auth Layout
 * Simple centered layout for login/signup pages
 */

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Gaspol UTBK Prep",
  description: "Sign in to your Gaspol account",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
