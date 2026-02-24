import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { LanguageSync } from "@/components/LanguageSync"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gaspol - UTBK Prep Platform",
  description: "Last-minute UTBK preparation platform with adaptive learning",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className} suppressHydrationWarning>
        <LanguageSync />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
