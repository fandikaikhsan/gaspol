/**
 * Rasterize PDF pages to JPEG data URLs (browser only).
 */

const MAX_PAGES = 2
const SCALE = 1.15

export async function pdfFileToJpegDataUrls(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise
  const n = Math.min(MAX_PAGES, doc.numPages)
  const out: string[] = []

  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: SCALE })
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas tidak tersedia")
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    out.push(canvas.toDataURL("image/jpeg", 0.82))
  }

  return out
}
