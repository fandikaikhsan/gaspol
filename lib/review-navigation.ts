/**
 * Explicit back targets for /review/[skillId]/drill so we don't rely on a broken history stack.
 */

export function resolveSkillDrillBackRoute(
  skillId: string,
  from: string | null,
  pembahasanModuleId: string | null,
): string | null {
  switch (from) {
    case "review":
      return "/review"
    case "material":
      return `/review/${skillId}`
    case "plan":
      return "/plan"
    case "analytics":
      return "/analytics"
    case "pembahasan":
      if (pembahasanModuleId) {
        const q = new URLSearchParams()
        if (skillId) q.set("skillId", skillId)
        const qs = q.toString()
        return `/drill/pembahasan/${pembahasanModuleId}${qs ? `?${qs}` : ""}`
      }
      return "/review"
    default:
      return null
  }
}
