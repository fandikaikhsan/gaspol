import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { LanguageSync } from "@/components/LanguageSync"
import { QueryProvider } from "@/components/providers/QueryProvider"

const inter = Inter({ subsets: ["latin"] })
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
})

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
      <body
        className={`${inter.className} ${playfair.variable}`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <LanguageSync />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
