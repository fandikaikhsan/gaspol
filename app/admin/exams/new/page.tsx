"use client"

/**
 * Create New Exam with AI Research
 * Admin provides exam details, AI researches and understands the exam structure
 */

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewExamPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isResearching, setIsResearching] = useState(false)
  const [researchComplete, setResearchComplete] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    exam_type: "",
    year: new Date().getFullYear(),
    additional_info: "",
  })

  const [researchData, setResearchData] = useState<{
    summary: string
    structure: any
  } | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, exam_type: value })
  }

  const runAIResearch = async () => {
    if (!formData.exam_type || !formData.year) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide exam type and year.",
      })
      return
    }

    setIsResearching(true)

    try {
      // Call API route instead of edge function directly
      const response = await fetch("/api/admin/research-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_type: formData.exam_type,
          year: formData.year,
          additional_info: formData.additional_info,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to research exam")
      }

      const data = await response.json()

      if (!data || !data.success) {
        throw new Error(data?.error || "Failed to research exam")
      }

      setResearchData({
        summary: data.research_summary,
        structure: data.structure_metadata,
      })

      setResearchComplete(true)

      toast({
        title: "Research Complete!",
        description: "AI has analyzed the exam structure. Review and save.",
      })
    } catch (error) {
      console.error("Research error:", error)
      toast({
        variant: "destructive",
        title: "Research Failed",
        description: error instanceof Error ? error.message : "Failed to research exam",
      })
    } finally {
      setIsResearching(false)
    }
  }

  const saveExam = async () => {
    if (!formData.name || !formData.exam_type || !formData.year) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      })
      return
    }

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("exams")
        .insert({
          name: formData.name,
          exam_type: formData.exam_type,
          year: formData.year,
          research_summary: researchData?.summary || "",
          structure_metadata: researchData?.structure || {},
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Exam Created!",
        description: "You can now build taxonomy for this exam.",
      })

      router.push("/admin/exams")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: "Could not create exam. Please try again.",
      })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/exams">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Exam</h1>
          <p className="text-muted-foreground">
            Configure a new exam type and let AI research its structure
          </p>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Basic Information</CardTitle>
          <CardDescription>Provide exam details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exam_type">
              Exam Type <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.exam_type} onValueChange={handleSelectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTBK">UTBK (Ujian Tulis Berbasis Komputer)</SelectItem>
                <SelectItem value="SNBT">SNBT (Seleksi Nasional Berdasarkan Tes)</SelectItem>
                <SelectItem value="UM PTN">UM PTN (Ujian Mandiri PTN)</SelectItem>
                <SelectItem value="SIMAK UI">SIMAK UI</SelectItem>
                <SelectItem value="UM UGM">UM UGM</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">
              Year <span className="text-red-500">*</span>
            </Label>
            <Input
              id="year"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleInputChange}
              placeholder="2026"
              min="2020"
              max="2030"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="UTBK 2026"
            />
            <p className="text-xs text-muted-foreground">
              This name will be shown to students
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_info">Additional Information (Optional)</Label>
            <Textarea
              id="additional_info"
              name="additional_info"
              value={formData.additional_info}
              onChange={handleInputChange}
              placeholder="Any specific details about this exam (changes from previous years, special sections, etc.)"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: AI Research */}
      <Card className={researchComplete ? "bg-green-50 border-green-200" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Step 2: AI Research
          </CardTitle>
          <CardDescription>
            Let AI analyze the exam structure, sections, timing, and format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!researchComplete ? (
            <>
              <p className="text-sm text-muted-foreground">
                AI will research publicly available information about {formData.exam_type}{" "}
                {formData.year} including:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Test sections and subsections</li>
                <li>Question types and formats</li>
                <li>Time limits per section</li>
                <li>Scoring methodology</li>
                <li>Typical content coverage</li>
              </ul>

              <Button
                onClick={runAIResearch}
                disabled={isResearching || !formData.exam_type || !formData.year}
                className="w-full"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Researching... (this may take 30-60 seconds)
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start AI Research
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-green-900">Research Summary</Label>
                  <div className="mt-2 p-4 bg-white rounded border">
                    <p className="text-sm whitespace-pre-wrap">{researchData?.summary}</p>
                  </div>
                </div>

                {researchData?.structure && (
                  <div>
                    <Label className="text-green-900">Structure Metadata</Label>
                    <div className="mt-2 p-4 bg-white rounded border">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(researchData.structure, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-green-600">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Research Complete!</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Save */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Save and Continue</CardTitle>
          <CardDescription>Save this exam configuration to proceed with taxonomy creation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Link href="/admin/exams" className="flex-1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={saveExam}
              disabled={!researchComplete}
              className="flex-1"
            >
              Save Exam Configuration
            </Button>
          </div>

          {!researchComplete && (
            <p className="text-xs text-center text-muted-foreground">
              Complete AI research before saving
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
