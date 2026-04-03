export type TutorImageAttachment = {
  type: "image_url"
  url: string
}

export function parseTutorAttachments(raw: unknown): TutorImageAttachment[] | null {
  if (raw == null) return null
  if (!Array.isArray(raw)) return null
  const out: TutorImageAttachment[] = []
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      (item as { type?: string }).type === "image_url" &&
      typeof (item as { url?: string }).url === "string"
    ) {
      out.push({
        type: "image_url",
        url: (item as { url: string }).url,
      })
    }
  }
  return out.length ? out : null
}
