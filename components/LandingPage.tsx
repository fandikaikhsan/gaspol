import Image from "next/image"
import Link from "next/link"
import {
  UserRound,
  ClipboardCheck,
  PencilLine,
  Trophy,
  Sparkles,
  ArrowRight,
  Target,
  CalendarDays,
  CheckCircle2,
  Brain,
  Quote,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type JourneyStep = {
  title: string
  description: string
  badge: string
  Icon: React.ComponentType<{ className?: string }>
  iconClassName: string
  glowClassName: string
}

const heroImageUrl = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80"

const journeySteps: JourneyStep[] = [
  {
    title: "1. Baseline",
    description: "Cek level awalmu lewat diagnostic singkat berbasis tipe soal UTBK.",
    badge: "Diagnosa awal",
    Icon: Target,
    iconClassName: "text-sky-700 dark:text-sky-400",
    glowClassName: "from-sky-500/10 via-sky-500/5 to-transparent",
  },
  {
    title: "2. Plan",
    description: "Dapat rencana belajar adaptif harian sesuai target kampus dan jurusan.",
    badge: "Rencana harian",
    Icon: CalendarDays,
    iconClassName: "text-amber-700 dark:text-amber-400",
    glowClassName: "from-amber-500/10 via-amber-500/5 to-transparent",
  },
  {
    title: "3. Locked-In",
    description: "Latihan fokus di area terlemah biar kenaikan skor lebih cepat terasa.",
    badge: "Latihan terarah",
    Icon: Brain,
    iconClassName: "text-violet-700 dark:text-violet-400",
    glowClassName: "from-violet-500/10 via-violet-500/5 to-transparent",
  },
  {
    title: "4. Analytics",
    description: "Pantau progres, akurasi, dan kesiapanmu menjelang hari H UTBK.",
    badge: "Progress terukur",
    Icon: CheckCircle2,
    iconClassName: "text-emerald-700 dark:text-emerald-400",
    glowClassName: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  },
]

const studentBenefits = [
  "Belajar ringkas: fokus materi yang paling berdampak ke skor",
  "Latihan adaptif: tingkat kesulitan menyesuaikan kemampuanmu",
  "Anti bingung: tahu harus belajar apa setiap hari",
]

const parentBenefits = [
  "Progress lebih terlihat: orang tua bisa cek konsistensi belajar anak",
  "Belajar lebih terarah: waktu dan energi dipakai untuk area prioritas",
  "Komunikasi lebih enak: ada data progres untuk diskusi target kampus",
]

const testimonials = [
  {
    name: "Nadia Pratama",
    school: "Siswa XII IPA, Bandung",
    quote: "Sebelumnya aku bingung harus mulai dari mana. Setelah pakai Gaspol, aku tinggal ikutin plan harian dan progresku kerasa naik.",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Raka Mahendra",
    school: "Siswa XII IPS, Surabaya",
    quote: "Yang paling ngebantu itu latihan fokus di bagian yang paling lemah. Waktu belajarku jadi lebih efektif menjelang UTBK.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Alya Rahmani",
    school: "Siswa XII, Jakarta",
    quote: "Aku suka karena tampilannya jelas. Orang tuaku juga jadi lebih tenang karena bisa lihat progresku dari minggu ke minggu.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
  },
]

const keyDates = [
  {
    item: "Registrasi Akun SNPMB Siswa",
    date: "13 Januari – 27 Maret 2026",
    Icon: UserRound,
    dotClassName: "bg-sky-500",
    iconClassName: "text-sky-700 dark:text-sky-400",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  },
  {
    item: "Pendaftaran UTBK-SNBT",
    date: "11 – 27 Maret 2026",
    Icon: ClipboardCheck,
    dotClassName: "bg-amber-500",
    iconClassName: "text-amber-700 dark:text-amber-400",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    item: "Pelaksanaan UTBK",
    date: "23 April – 3 Mei 2026",
    Icon: PencilLine,
    dotClassName: "bg-violet-500",
    iconClassName: "text-violet-700 dark:text-violet-400",
    badgeClassName: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
  },
  {
    item: "Pengumuman Hasil SNBT",
    date: "28 Mei 2026",
    Icon: Trophy,
    dotClassName: "bg-emerald-500",
    iconClassName: "text-emerald-700 dark:text-emerald-400",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
]

const faqs = [
  {
    q: "Apakah ini cocok untuk persiapan mepet?",
    a: "Ya. Fokus utama platform ini adalah bantu siswa meningkatkan skor secepat mungkin lewat prioritas materi dan latihan adaptif.",
  },
  {
    q: "Apakah orang tua bisa ikut memantau progres?",
    a: "Bisa. Struktur belajar dan progres dibuat jelas agar orang tua mudah berdiskusi soal target dan konsistensi belajar.",
  },
  {
    q: "Mulainya dari mana?",
    a: "Mulai dari Baseline dulu, lalu ikuti Plan harian. Setelah itu lanjut ke Locked-In drills dan cek Analytics secara rutin.",
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Gaspol UTBK Prep
          </Link>

          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div className="text-center lg:text-left">
            <Badge className="mb-4" variant="secondary">
              Platform Persiapan UTBK-SNBT
            </Badge>
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Belajar lebih terarah untuk UTBK — tenang untuk siswa, lega untuk orang tua
            </h1>
            <p className="mb-8 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg lg:mx-0 mx-auto">
              Gaspol bantu siswa fokus ke materi prioritas, latihan adaptif, dan progres yang terukur.
              Cocok untuk persiapan intensif menjelang UTBK-SNBT.
            </p>

            <div className="mb-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/signup">Daftar Sekarang</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/login">Masuk</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
              <Badge variant="outline" className="font-normal">Untuk siswa SMA/sederajat</Badge>
              <Badge variant="outline" className="font-normal">Fokus UTBK-SNBT 2026</Badge>
              <Badge variant="outline" className="font-normal">Belajar terarah + terukur</Badge>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-sky-500/15 via-violet-500/15 to-emerald-500/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              <Image
                src={heroImageUrl}
                alt="Siswa belajar UTBK bersama dukungan orang tua"
                width={1400}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-6 py-14 sm:py-16">
        <div className="pointer-events-none absolute inset-x-6 top-0 -z-10 h-32 rounded-2xl bg-gradient-to-r from-sky-500/10 via-violet-500/10 to-emerald-500/10 blur-2xl" />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Perjalanan Belajarmu</h2>
            <p className="mt-1 text-sm text-muted-foreground">Langkah yang jelas biar progres lebih cepat terlihat.</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            4 langkah jelas
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step) => (
            <Card
              key={step.title}
              className="group relative h-full overflow-hidden border-border/70 bg-card/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${step.glowClassName}`} />
              <CardHeader className="relative">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs font-medium">{step.badge}</Badge>
                  <step.Icon className={`h-5 w-5 ${step.iconClassName}`} aria-hidden="true" />
                </div>
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="mb-4 text-sm text-muted-foreground">{step.description}</p>
                <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-80 transition-opacity group-hover:opacity-100">
                  Lihat detail langkah
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Kenapa Siswa Suka Gaspol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {studentBenefits.map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">
                    • {item}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Kenapa Orang Tua Merasa Lebih Tenang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parentBenefits.map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">
                    • {item}
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Testimoni Siswa</h3>
                <p className="mt-1 text-sm text-muted-foreground">Cerita dari siswa yang belajar pakai Gaspol.</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                Social proof
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="h-full border-border/70 bg-card/95">
                  <CardContent className="pt-6">
                    <Quote className="mb-3 h-5 w-5 text-primary/70" aria-hidden="true" />
                    <p className="mb-5 text-sm leading-relaxed text-muted-foreground">“{testimonial.quote}”</p>

                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.school}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-16">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Timeline UTBK-SNBT 2026</h2>
          <Badge variant="outline">Tanggal penting</Badge>
        </div>
        <p className="mb-8 max-w-3xl text-sm text-muted-foreground">
          Biar belajarmu lebih terencana, ini patokan tanggal penting UTBK-SNBT 2026.
        </p>

        <div className="relative pl-5">
          <div className="absolute left-[9px] top-1 h-[calc(100%-8px)] w-px bg-border" />
          <div className="space-y-6">
            {keyDates.map((entry) => (
              <div key={entry.item} className="relative rounded-lg border border-border/70 bg-card p-4 shadow-sm">
                <span className={`absolute -left-5 top-5 h-3 w-3 rounded-full border-2 border-background ${entry.dotClassName}`} />
                <div className="mb-2 flex items-center gap-2">
                  <entry.Icon className={`h-4 w-4 ${entry.iconClassName}`} aria-hidden="true" />
                  <Badge variant="outline" className={entry.badgeClassName}>{entry.date}</Badge>
                </div>
                <h3 className="text-base font-semibold tracking-tight">{entry.item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Pertanyaan Umum</h2>
          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="w-full rounded-lg border bg-background px-4"
          >
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center">
          <h2 className="mb-3 max-w-3xl text-balance text-3xl font-bold tracking-tight">
            Mulai persiapan UTBK dengan lebih terarah
          </h2>
          <p className="mb-8 max-w-2xl text-muted-foreground">
            Buat akun, kerjakan baseline, dan langsung dapat roadmap belajar yang bisa dieksekusi hari ini.
          </p>
          <div className="mb-4 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">Daftar Gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/login">Saya Sudah Punya Akun</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Mulai dalam hitungan menit • Tanpa setup rumit</p>
        </div>
      </section>
    </main>
  )
}
