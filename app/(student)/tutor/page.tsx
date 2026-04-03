import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { GaspolTutorView } from "@/components/gaspol-tutor/GaspolTutorView"

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GaspolTutorView />
    </Suspense>
  )
}
