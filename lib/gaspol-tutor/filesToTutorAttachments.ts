import { imageFileToJpegDataUrl } from "@/lib/gaspol-tutor/imageFileToJpeg"
import type { TutorImageAttachment } from "@/lib/gaspol-tutor/tutorAttachments"

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true
  const n = file.name.toLowerCase()
  return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(n)
}

export async function filesToTutorAttachments(
  files: FileList | File[],
): Promise<TutorImageAttachment[]> {
  const list = Array.from(files)
  const out: TutorImageAttachment[] = []
  for (const file of list) {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    if (isPdf) {
      const { pdfFileToJpegDataUrls } = await import(
        "@/lib/gaspol-tutor/pdfFirstPageImages"
      )
      const urls = await pdfFileToJpegDataUrls(file)
      for (const url of urls) out.push({ type: "image_url", url })
    } else if (looksLikeImage(file)) {
      out.push({
        type: "image_url",
        url: await imageFileToJpegDataUrl(file),
      })
    }
  }
  return out
}
