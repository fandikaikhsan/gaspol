"use client"

/**
 * Mixed drill modules (drill_mixed) — L3-targeted. Not linked from main nav;
 * used by plan tasks and deep links. No full drill hub search UI.
 */

import { Suspense, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DrillModuleCard } from "@/components/drill/DrillModuleCard"
import { fetchDrillHubData } from "@/lib/student-drill-hub"

function MixedDrillsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightTaskId = searchParams.get("taskId")

  const { data, isLoading, error } = useQuery({
    queryKey: ["drill-mixed-list"],
    queryFn: fetchDrillHubData,
  })

  const { mixedOrdered, groups } = useMemo(() => {
    const all = (data?.modules || []).filter(
      (m) => m.module_type === "drill_mixed",
    )
    const mandatory = all.filter((m) => m.is_required && !m.is_completed)
    const rest = all.filter((m) => !(m.is_required && !m.is_completed))
    const mixedOrdered = [...mandatory, ...rest]

    const byL2: Record<
      string,
      { l2_name: string; modules: typeof mixedOrdered }
    > = {}
    for (const m of mixedOrdered) {
      const k = m.l2_id || "unknown"
      const name = m.l2_name || "Lainnya"
      if (!byL2[k]) byL2[k] = { l2_name: name, modules: [] }
      byL2[k].modules.push(m)
    }
    return { mixedOrdered, groups: byL2 }
  }, [data?.modules])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-drill/10 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-drill/10 p-4">
        <p className="text-destructive text-sm">Gagal memuat modul.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/plan")}>
          Ke rencana
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-drill/10 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 touch-target"
            onClick={() => router.push("/plan")}
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Latihan campuran</h1>
            <p className="text-sm text-muted-foreground">
              Modul topik (gabungan skill)
            </p>
          </div>
        </div>

        {mixedOrdered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-xl">
            Tidak ada modul campuran untuk ujian aktif.
          </p>
        ) : (
          Object.entries(groups).map(([l2Key, g]) => (
            <div key={l2Key} className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
                {g.l2_name}
              </h2>
              <div className="space-y-2">
                {g.modules.map((m) => (
                  <DrillModuleCard
                    key={m.id}
                    module={m}
                    highlight={highlightTaskId === m.plan_task_id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function MixedDrillsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-drill/10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MixedDrillsContent />
    </Suspense>
  )
}
