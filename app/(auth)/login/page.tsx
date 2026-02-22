"use client"

/**
 * Login Page
 * Phase 1: Authentication & State Machine
 */

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getUserFriendlyError, getDevMessage } from "@/lib/utils/error-messages"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/plan"
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle email confirmation error specifically
        if (error.message.includes("Email not confirmed")) {
          toast({
            variant: "destructive",
            title: "Email Not Confirmed",
            description: getDevMessage(
              "Please check your email and click the confirmation link. Or disable email confirmation in Supabase dashboard for development.",
              "Please check your email and click the confirmation link to activate your account."
            ),
          })
        } else {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: getUserFriendlyError(error, "Invalid email or password. Please try again."),
          })
        }
        return
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "Redirecting to your dashboard...",
        })
        router.push(redirectTo)
        router.refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getUserFriendlyError(error, "An unexpected error occurred. Please try again."),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-background">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl mb-2">
          Welcome to Gaspol! 🎯
        </CardTitle>
        <CardDescription>
          Sign in to continue your UTBK preparation
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
