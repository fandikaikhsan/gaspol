/**
 * Inline SVG illustrations for each Gaspol Tutor topic card.
 * Each illustration matches the visual style from the design reference.
 */

export function IllustrationAturanUTBK({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <rect x="30" y="8" width="48" height="62" rx="6" fill="white" fillOpacity={0.18} />
      <rect x="18" y="22" width="48" height="62" rx="6" fill="white" fillOpacity={0.28} />
      <rect x="28" y="38" width="28" height="3" rx="1.5" fill="white" fillOpacity={0.5} />
      <rect x="28" y="46" width="20" height="3" rx="1.5" fill="white" fillOpacity={0.4} />
      <rect x="28" y="54" width="24" height="3" rx="1.5" fill="white" fillOpacity={0.35} />
    </svg>
  )
}

export function IllustrationUjianMandiri({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <circle cx="50" cy="46" r="30" fill="white" fillOpacity={0.15} />
      <circle cx="50" cy="46" r="20" fill="white" fillOpacity={0.12} />
      <rect x="60" y="18" width="7" height="44" rx="3.5" fill="white" fillOpacity={0.3} transform="rotate(25 63 40)" />
      <circle cx="57" cy="13" r="4" fill="white" fillOpacity={0.35} />
    </svg>
  )
}

export function IllustrationMateri({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" className={className} aria-hidden>
      {/* Book stack */}
      <rect x="80" y="142" width="100" height="14" rx="3" fill="#1a5c50" />
      <rect x="76" y="128" width="108" height="14" rx="3" fill="#1e6e60" />
      <rect x="82" y="114" width="96" height="14" rx="3" fill="#236d5f" />

      {/* Character body */}
      <ellipse cx="130" cy="160" rx="32" ry="12" fill="#1a1a1a" fillOpacity={0.2} />
      <path d="M110 80 C110 80 105 130 108 150 L152 150 C155 130 150 80 150 80Z" fill="#2D2D2D" />

      {/* Head */}
      <circle cx="130" cy="58" r="22" fill="#F5DEB3" />
      <ellipse cx="130" cy="42" rx="24" ry="18" fill="#2D2D2D" />

      {/* Face */}
      <circle cx="123" cy="58" r="2.5" fill="#2D2D2D" />
      <circle cx="137" cy="58" r="2.5" fill="#2D2D2D" />
      <path d="M126 66 Q130 70 134 66" stroke="#2D2D2D" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Left arm pointing */}
      <path d="M110 90 C100 95 82 85 75 78" stroke="#F5DEB3" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Right arm on book */}
      <path d="M150 90 C160 110 165 125 160 140" stroke="#F5DEB3" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Open book in hand */}
      <rect x="56" y="64" width="26" height="20" rx="2" fill="white" fillOpacity={0.6} />
      <rect x="58" y="68" width="10" height="2" rx="1" fill="#2D7D6F" fillOpacity={0.5} />
      <rect x="58" y="72" width="8" height="2" rx="1" fill="#2D7D6F" fillOpacity={0.4} />

      {/* Lightbulb / idea */}
      <circle cx="72" cy="42" r="8" fill="#FFD700" fillOpacity={0.5} />
      <line x1="72" y1="30" x2="72" y2="26" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeOpacity={0.5} />
      <line x1="80" y1="34" x2="83" y2="31" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeOpacity={0.5} />
      <line x1="64" y1="34" x2="61" y2="31" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeOpacity={0.5} />
    </svg>
  )
}

export function IllustrationTipsUjian({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <circle cx="50" cy="44" r="28" stroke="white" strokeWidth="2.5" strokeOpacity={0.2} />
      <circle cx="50" cy="44" r="18" stroke="white" strokeWidth="2" strokeOpacity={0.25} strokeDasharray="4 3" />
      <circle cx="50" cy="44" r="8" fill="white" fillOpacity={0.3} />
      {/* Arrow hitting target */}
      <line x1="78" y1="16" x2="54" y2="40" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeOpacity={0.7} />
      <polygon points="54,40 58,32 62,36" fill="#FFD700" fillOpacity={0.7} />
      {/* Decorative dots */}
      <circle cx="22" cy="70" r="2.5" fill="white" fillOpacity={0.2} />
      <circle cx="30" cy="76" r="2" fill="white" fillOpacity={0.15} />
      <circle cx="75" cy="72" r="3" fill="white" fillOpacity={0.2} />
      <circle cx="82" cy="64" r="1.5" fill="white" fillOpacity={0.18} />
    </svg>
  )
}

export function IllustrationJurusan({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      {/* Yarn ball */}
      <circle cx="60" cy="56" r="22" fill="white" fillOpacity={0.15} />
      <ellipse cx="60" cy="56" rx="22" ry="14" stroke="#FFD700" strokeWidth="1.5" strokeOpacity={0.5} transform="rotate(-20 60 56)" />
      <ellipse cx="60" cy="56" rx="20" ry="10" stroke="#FFD700" strokeWidth="1.5" strokeOpacity={0.4} transform="rotate(30 60 56)" />
      <ellipse cx="60" cy="56" rx="18" ry="8" stroke="#FFD700" strokeWidth="1.5" strokeOpacity={0.3} transform="rotate(70 60 56)" />
      {/* Thread trail */}
      <path d="M38 56 C28 48 20 55 18 42 S25 28 32 32" stroke="#FFD700" strokeWidth="2" strokeOpacity={0.5} fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function IllustrationTanyaCatatan({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <rect x="22" y="18" width="56" height="70" rx="5" fill="white" fillOpacity={0.2} />
      <rect x="26" y="26" width="36" height="3" rx="1.5" fill="white" fillOpacity={0.45} />
      <rect x="26" y="34" width="28" height="3" rx="1.5" fill="white" fillOpacity={0.35} />
      <rect x="26" y="42" width="32" height="3" rx="1.5" fill="white" fillOpacity={0.3} />
      <rect x="26" y="54" width="20" height="20" rx="3" fill="white" fillOpacity={0.15} />
      <path
        d="M32 62 L38 68 L50 56"
        stroke="#FFD700"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.75}
      />
      <circle cx="72" cy="28" r="10" fill="white" fillOpacity={0.25} />
      <path
        d="M68 28h8M72 24v8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={0.5}
      />
    </svg>
  )
}

export function IllustrationMotivasi({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      {/* Bar chart */}
      <rect x="20" y="58" width="12" height="24" rx="2" fill="white" fillOpacity={0.2} />
      <rect x="38" y="44" width="12" height="38" rx="2" fill="white" fillOpacity={0.25} />
      <rect x="56" y="32" width="12" height="50" rx="2" fill="white" fillOpacity={0.3} />
      <rect x="74" y="22" width="12" height="60" rx="2" fill="white" fillOpacity={0.35} />
      {/* Upward arrow */}
      <line x1="28" y1="20" x2="78" y2="14" stroke="white" strokeWidth="2" strokeOpacity={0.3} strokeLinecap="round" />
      <polygon points="78,14 72,10 74,18" fill="white" fillOpacity={0.3} />
    </svg>
  )
}

export function DecoThreeDashes({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" fill="none" className={className} aria-hidden>
      <rect x="8" y="17" width="10" height="6" rx="3" fill="#2D2D2D" fillOpacity={0.25} />
      <rect x="24" y="17" width="10" height="6" rx="3" fill="#2D2D2D" fillOpacity={0.25} />
      <rect x="40" y="17" width="10" height="6" rx="3" fill="#2D2D2D" fillOpacity={0.25} />
    </svg>
  )
}
