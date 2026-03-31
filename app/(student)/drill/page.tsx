import { redirect } from "next/navigation"

/**
 * Drill module listing moved to Review → material → "Latihan skill ini"
 * (`/review/[skillId]/drill`) and `/drill/mixed` for mixed modules (e.g. plan).
 */
export default function DrillHubRedirectPage() {
  redirect("/review")
}
