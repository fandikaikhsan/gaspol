"use client"

/**
 * Shared component for import dialogs: shows example JSON template with copy button
 */
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImportJsonExampleBlockProps {
  template: string
  label?: string
  onUseAsInput?: () => void
}

export function ImportJsonExampleBlock({ template, label = "Example template", onUseAsInput }: ImportJsonExampleBlockProps) {
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template)
      toast({ title: "Copied", description: "Example template copied to clipboard." })
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Could not copy to clipboard." })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3 w-3 mr-1" />
            Copy example
          </Button>
          {onUseAsInput && (
            <Button type="button" variant="outline" size="sm" onClick={onUseAsInput}>
              <FileDown className="h-3 w-3 mr-1" />
              Use as input
            </Button>
          )}
        </div>
      </div>
      <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto border">
        {template}
      </pre>
    </div>
  )
}
