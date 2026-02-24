"use client"

import { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-2 border-destructive m-4">
          <CardContent className="py-12 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs bg-muted p-4 rounded-lg overflow-auto max-w-lg mx-auto">
                {this.state.error.message}
              </pre>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
