import { redirect } from "next/navigation"

/** Student flashcards are not released yet — same as review hub “Segera hadir”. */
export default function FlashcardsDisabledPage() {
  redirect("/review")
}
