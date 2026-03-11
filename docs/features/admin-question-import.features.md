# Admin Question Import — Structured Content

**Status:** Design / Decision Record  
**Last Updated:** 2025-03-09

---

## 1. Overview

Admin can import questions as JSON linked to Level-5 taxonomy nodes (micro-skills). The import format uses structured document blocks for stimulus, answer, and explanation. This aligns with the principle:

- AI generates **structured semantic content**
- Admin validates and stores it
- Frontend renders it deterministically

---

## 2. Taxonomy Linkage

All imports **require** a Level-5 taxonomy node (micro-skill). Two reference styles:

| Reference | Format | Resolved by |
|-----------|--------|-------------|
| By code | `"skill_code": "TPS-PU-LOG-01-A"` | Lookup via `exam_id` |
| By UUID | `"skill_id": "uuid-here"` | Direct reference |

When using `skill_code`, `exam_id` is required for resolution.

---

## 3. Import JSON Structure (Wrapper)

```json
{
  "skill_code": "TPS-PU-LOG-01-A",
  "exam_id": "uuid-of-exam",
  "questions": [
    { "question_type": "MCQ5", "difficulty": "medium", "cognitive_level": "L2", "stimulus": { "blocks": [{ "type": "text", "content": "..." }] }, "answer": { "interaction_type": "single_choice", "options": [], "correct_answer": "A" }, "explanation": { "blocks": [] }, "construct_weights": {} }
  ]
}
```

Or with `skill_id` (no `exam_id` needed):

```json
{
  "skill_id": "uuid-of-level5-node",
  "questions": [
    { "question_type": "MCQ5", "stimulus": { "blocks": [] }, "answer": { "options": [], "correct_answer": "A" }, "explanation": { "blocks": [] } }
  ]
}
```

*See Section 5 for complete question object examples per type.*

---

## 4. Content Block Types

| Block Type | Description | Spec Shape |
|------------|-------------|------------|
| `text` | Plain text | `{ "type": "text", "content": "..." }` |
| `inline_math` | Inline LaTeX | `{ "type": "inline_math", "content": "x^2" }` |
| `block_math` | Display LaTeX | `{ "type": "block_math", "content": "\\frac{a}{b}" }` |
| `table` | Data table | `{ "type": "table", "spec": { "headers": [...], "rows": [...] } }` |
| `chart` | Vega-Lite | `{ "type": "chart", "spec": { ... } }` |
| `function_graph` | Coordinate plot | `{ "type": "function_graph", "spec": { ... } }` |
| `geometry` | Geometry diagram | `{ "type": "geometry", "spec": { "elements": [...] } }` |
| `venn` | Venn/set diagram | `{ "type": "venn", "spec": { "sets": [...], "regions": [...] } }` |
| `image` | Image URL | `{ "type": "image", "spec": { "url": "...", "alt": "..." } }` |

---

## 5. Question Type Examples

### 5.1 MCQ5 — Text + Inline Math

```json
{
  "question_type": "MCQ5",
  "difficulty": "medium",
  "cognitive_level": "L2",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Nilai dari " },
      { "type": "inline_math", "content": "2^3 \\times 3^2" },
      { "type": "text", "content": " adalah..." }
    ]
  },
  "answer": {
    "interaction_type": "single_choice",
    "options": [
      { "key": "A", "content": { "blocks": [{ "type": "text", "content": "72" }] }, "is_correct": false },
      { "key": "B", "content": { "blocks": [{ "type": "text", "content": "36" }] }, "is_correct": false },
      { "key": "C", "content": { "blocks": [{ "type": "text", "content": "54" }] }, "is_correct": false },
      { "key": "D", "content": { "blocks": [{ "type": "text", "content": "48" }] }, "is_correct": false },
      { "key": "E", "content": { "blocks": [{ "type": "text", "content": "24" }] }, "is_correct": true }
    ],
    "correct_answer": "E"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "2³ = 8, 3² = 9. Jadi 8 × 9 = 72." }
    ]
  },
  "time_estimate_seconds": 60,
  "construct_weights": {
    "C.ATTENTION": 0.20,
    "C.SPEED": 0.25,
    "C.REASONING": 0.15,
    "C.COMPUTATION": 0.35,
    "C.READING": 0.05
  }
}
```

### 5.2 MCQ5 — With Function Graph

```json
{
  "question_type": "MCQ5",
  "difficulty": "medium",
  "cognitive_level": "L2",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Perhatikan grafik berikut." },
      {
        "type": "function_graph",
        "spec": {
          "domain": { "x": [-2, 6], "y": [-2, 8] },
          "axes": true,
          "grid": true,
          "curves": [
            { "type": "function", "expression": "-x + 4", "label": "y = -x + 4" }
          ],
          "points": [
            { "x": 0, "y": 4, "label": "A" },
            { "x": 4, "y": 0, "label": "B" }
          ]
        }
      },
      { "type": "text", "content": "Persamaan garis yang melalui titik A dan B adalah..." }
    ]
  },
  "answer": {
    "interaction_type": "single_choice",
    "options": [
      { "key": "A", "content": { "blocks": [{ "type": "inline_math", "content": "y = -x + 4" }] }, "is_correct": true },
      { "key": "B", "content": { "blocks": [{ "type": "inline_math", "content": "y = x + 4" }] }, "is_correct": false },
      { "key": "C", "content": { "blocks": [{ "type": "inline_math", "content": "y = -\\frac{1}{2}x + 4" }] }, "is_correct": false },
      { "key": "D", "content": { "blocks": [{ "type": "inline_math", "content": "y = 2x - 4" }] }, "is_correct": false },
      { "key": "E", "content": { "blocks": [{ "type": "text", "content": "Tidak dapat ditentukan" }] }, "is_correct": false }
    ],
    "correct_answer": "A"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "Gradien " },
      { "type": "inline_math", "content": "m = \\frac{0-4}{4-0} = -1" },
      { "type": "text", "content": ", intercept c = 4. Jadi y = -x + 4." }
    ]
  },
  "time_estimate_seconds": 90,
  "construct_weights": {
    "C.ATTENTION": 0.20,
    "C.SPEED": 0.15,
    "C.REASONING": 0.35,
    "C.COMPUTATION": 0.15,
    "C.READING": 0.15
  }
}
```

### 5.3 MCQ5 — With Table Stimulus

```json
{
  "question_type": "MCQ5",
  "difficulty": "easy",
  "cognitive_level": "L1",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Tabel berikut menunjukkan nilai ulangan 4 siswa." },
      {
        "type": "table",
        "spec": {
          "headers": ["Nama", "Matematika", "Fisika", "Rata-rata"],
          "rows": [
            ["Andi", "85", "90", "87.5"],
            ["Budi", "78", "82", "80"],
            ["Citra", "92", "88", "90"],
            ["Dewi", "75", "95", "85"]
          ]
        }
      },
      { "type": "text", "content": "Siswa dengan rata-rata tertinggi adalah..." }
    ]
  },
  "answer": {
    "interaction_type": "single_choice",
    "options": [
      { "key": "A", "content": { "blocks": [{ "type": "text", "content": "Andi" }] }, "is_correct": false },
      { "key": "B", "content": { "blocks": [{ "type": "text", "content": "Budi" }] }, "is_correct": false },
      { "key": "C", "content": { "blocks": [{ "type": "text", "content": "Citra" }] }, "is_correct": true },
      { "key": "D", "content": { "blocks": [{ "type": "text", "content": "Dewi" }] }, "is_correct": false },
      { "key": "E", "content": { "blocks": [{ "type": "text", "content": "Andi dan Citra" }] }, "is_correct": false }
    ],
    "correct_answer": "C"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "Rata-rata tertinggi adalah Citra (90), diikuti Dewi (85), Andi (87.5), Budi (80)." }
    ]
  },
  "time_estimate_seconds": 45,
  "construct_weights": {
    "C.ATTENTION": 0.30,
    "C.SPEED": 0.20,
    "C.REASONING": 0.20,
    "C.COMPUTATION": 0.15,
    "C.READING": 0.15
  }
}
```

### 5.4 MCQ5 — With Chart (Vega-Lite)

```json
{
  "question_type": "MCQ5",
  "difficulty": "medium",
  "cognitive_level": "L2",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Grafik batang berikut menunjukkan penjualan per bulan." },
      {
        "type": "chart",
        "spec": {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "data": {
            "values": [
              { "bulan": "Jan", "jumlah": 120 },
              { "bulan": "Feb", "jumlah": 150 },
              { "bulan": "Mar", "jumlah": 130 },
              { "bulan": "Apr", "jumlah": 180 }
            ]
          },
          "mark": "bar",
          "encoding": {
            "x": { "field": "bulan", "type": "ordinal" },
            "y": { "field": "jumlah", "type": "quantitative" }
          }
        }
      },
      { "type": "text", "content": "Bulan dengan penjualan tertinggi adalah..." }
    ]
  },
  "answer": {
    "interaction_type": "single_choice",
    "options": [
      { "key": "A", "content": { "blocks": [{ "type": "text", "content": "Januari" }] }, "is_correct": false },
      { "key": "B", "content": { "blocks": [{ "type": "text", "content": "Februari" }] }, "is_correct": false },
      { "key": "C", "content": { "blocks": [{ "type": "text", "content": "Maret" }] }, "is_correct": false },
      { "key": "D", "content": { "blocks": [{ "type": "text", "content": "April" }] }, "is_correct": true },
      { "key": "E", "content": { "blocks": [{ "type": "text", "content": "Februari dan April" }] }, "is_correct": false }
    ],
    "correct_answer": "D"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "April memiliki penjualan 180, tertinggi di antara semua bulan." }
    ]
  },
  "time_estimate_seconds": 60,
  "construct_weights": {
    "C.ATTENTION": 0.35,
    "C.SPEED": 0.15,
    "C.REASONING": 0.25,
    "C.COMPUTATION": 0.05,
    "C.READING": 0.20
  }
}
```

### 5.5 MCK (Multi-Select)

```json
{
  "question_type": "MCK",
  "difficulty": "hard",
  "cognitive_level": "L3",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Pilih SEMUA pernyataan yang ekuivalen dengan " },
      { "type": "inline_math", "content": "\\neg(p \\wedge q)" },
      { "type": "text", "content": ":" }
    ]
  },
  "answer": {
    "interaction_type": "multi_choice",
    "options": [
      { "key": "A", "content": { "blocks": [{ "type": "inline_math", "content": "\\neg p \\vee \\neg q" }] }, "is_correct": true },
      { "key": "B", "content": { "blocks": [{ "type": "inline_math", "content": "p \\rightarrow \\neg q" }] }, "is_correct": true },
      { "key": "C", "content": { "blocks": [{ "type": "inline_math", "content": "\\neg p \\wedge \\neg q" }] }, "is_correct": false },
      { "key": "D", "content": { "blocks": [{ "type": "inline_math", "content": "q \\rightarrow \\neg p" }] }, "is_correct": true }
    ],
    "correct_answer": "A,B,D"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "De Morgan: " },
      { "type": "inline_math", "content": "\\neg(p \\wedge q) \\equiv \\neg p \\vee \\neg q" },
      { "type": "text", "content": ". Juga ekuivalen dengan " },
      { "type": "inline_math", "content": "p \\rightarrow \\neg q" },
      { "type": "text", "content": " dan " },
      { "type": "inline_math", "content": "q \\rightarrow \\neg p" },
      { "type": "text", "content": ". Opsi C adalah negasi dari p ∨ q." }
    ]
  },
  "time_estimate_seconds": 120,
  "construct_weights": {
    "C.ATTENTION": 0.25,
    "C.SPEED": 0.10,
    "C.REASONING": 0.50,
    "C.COMPUTATION": 0.05,
    "C.READING": 0.10
  }
}
```

### 5.6 MCK-Table

```json
{
  "question_type": "MCK-Table",
  "difficulty": "medium",
  "cognitive_level": "L2",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Centang semua sel yang benar berdasarkan pernyataan di baris kiri dan kolom atas." },
      {
        "type": "table",
        "spec": {
          "headers": ["", "Pernyataan A", "Pernyataan B", "Pernyataan C"],
          "rows": [
            ["Jika p maka q", "implikasi", "logika", "syarat"],
            ["p dan q", "konjungsi", "disjungsi", "negasi"]
          ]
        }
      }
    ]
  },
  "answer": {
    "interaction_type": "table_select",
    "options": {
      "rows": [
        { "id": "R1", "content": { "blocks": [{ "type": "text", "content": "Jika p maka q" }] } },
        { "id": "R2", "content": { "blocks": [{ "type": "text", "content": "p dan q" }] } }
      ],
      "columns": [
        { "id": "C1", "content": { "blocks": [{ "type": "text", "content": "Pernyataan A" }] } },
        { "id": "C2", "content": { "blocks": [{ "type": "text", "content": "Pernyataan B" }] } },
        { "id": "C3", "content": { "blocks": [{ "type": "text", "content": "Pernyataan C" }] } }
      ]
    },
    "correct_answer": "R1-C1,R2-C1"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "Implikasi = jika p maka q. Konjungsi = p dan q." }
    ]
  },
  "time_estimate_seconds": 90,
  "construct_weights": {
    "C.ATTENTION": 0.30,
    "C.SPEED": 0.15,
    "C.REASONING": 0.35,
    "C.COMPUTATION": 0.05,
    "C.READING": 0.15
  }
}
```

### 5.7 Fill-in (Numeric)

```json
{
  "question_type": "Fill-in",
  "difficulty": "easy",
  "cognitive_level": "L1",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Jika " },
      { "type": "inline_math", "content": "x = 5" },
      { "type": "text", "content": ", maka nilai dari " },
      { "type": "inline_math", "content": "2x + 3 = " }
    ]
  },
  "answer": {
    "interaction_type": "fill_in",
    "options": {
      "type": "numeric",
      "unit": null,
      "placeholder": "Masukkan jawaban..."
    },
    "correct_answer": "13"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "2(5) + 3 = 10 + 3 = 13" }
    ]
  },
  "time_estimate_seconds": 30,
  "construct_weights": {
    "C.ATTENTION": 0.15,
    "C.SPEED": 0.20,
    "C.REASONING": 0.10,
    "C.COMPUTATION": 0.50,
    "C.READING": 0.05
  }
}
```

### 5.8 Geometry Diagram

```json
{
  "question_type": "MCQ5",
  "difficulty": "medium",
  "cognitive_level": "L2",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Perhatikan segitiga berikut." },
      {
        "type": "geometry",
        "spec": {
          "elements": [
            { "kind": "segment", "id": "AB", "from": { "x": 0, "y": 0 }, "to": { "x": 4, "y": 0 } },
            { "kind": "segment", "id": "BC", "from": { "x": 4, "y": 0 }, "to": { "x": 2, "y": 3.46 } },
            { "kind": "segment", "id": "CA", "from": { "x": 2, "y": 3.46 }, "to": { "x": 0, "y": 0 } },
            { "kind": "point", "id": "A", "at": { "x": 0, "y": 0 }, "label": "A" },
            { "kind": "point", "id": "B", "at": { "x": 4, "y": 0 }, "label": "B" },
            { "kind": "point", "id": "C", "at": { "x": 2, "y": 3.46 }, "label": "C" }
          ],
          "viewBox": { "width": 200, "height": 180 }
        }
      },
      { "type": "text", "content": "Jika AB = 4 cm, luas segitiga ABC adalah..." }
    ]
  },
  "answer": {
    "interaction_type": "single_choice",
    "options": [
      { "key": "A", "content": { "blocks": [{ "type": "inline_math", "content": "4\\sqrt{3}" }] }, "is_correct": true },
      { "key": "B", "content": { "blocks": [{ "type": "inline_math", "content": "2\\sqrt{3}" }] }, "is_correct": false },
      { "key": "C", "content": { "blocks": [{ "type": "inline_math", "content": "6\\sqrt{3}" }] }, "is_correct": false },
      { "key": "D", "content": { "blocks": [{ "type": "inline_math", "content": "8\\sqrt{3}" }] }, "is_correct": false },
      { "key": "E", "content": { "blocks": [{ "type": "text", "content": "12 cm²" }] }, "is_correct": false }
    ],
    "correct_answer": "A"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "Segitiga sama sisi dengan sisi 4. Tinggi = " },
      { "type": "inline_math", "content": "2\\sqrt{3}" },
      { "type": "text", "content": ", luas = ½ × 4 × " },
      { "type": "inline_math", "content": "2\\sqrt{3} = 4\\sqrt{3}" },
      { "type": "text", "content": " cm²." }
    ]
  },
  "time_estimate_seconds": 90,
  "construct_weights": {
    "C.ATTENTION": 0.20,
    "C.SPEED": 0.15,
    "C.REASONING": 0.30,
    "C.COMPUTATION": 0.30,
    "C.READING": 0.05
  }
}
```

### 5.9 TF (True/False)

```json
{
  "question_type": "TF",
  "difficulty": "easy",
  "cognitive_level": "L1",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Pernyataan \"Semua bilangan prima adalah ganjil\" bernilai benar." }
    ]
  },
  "answer": {
    "interaction_type": "single_choice",
    "options": [
      { "key": "True", "content": { "blocks": [{ "type": "text", "content": "Benar" }] }, "is_correct": false },
      { "key": "False", "content": { "blocks": [{ "type": "text", "content": "Salah" }] }, "is_correct": true }
    ],
    "correct_answer": "False"
  },
  "explanation": {
    "blocks": [
      { "type": "text", "content": "2 adalah bilangan prima dan genap. Jadi pernyataan salah." }
    ]
  },
  "time_estimate_seconds": 30,
  "construct_weights": {
    "C.ATTENTION": 0.30,
    "C.SPEED": 0.20,
    "C.REASONING": 0.25,
    "C.COMPUTATION": 0.05,
    "C.READING": 0.20
  }
}
```

### 5.10 Image Fallback

```json
{
  "question_type": "MCQ5",
  "stimulus": {
    "blocks": [
      { "type": "text", "content": "Perhatikan gambar berikut." },
      {
        "type": "image",
        "spec": {
          "url": "https://storage.example.com/diagram.png",
          "alt": "Diagram yang tidak dapat direpresentasikan secara terstruktur",
          "caption": "Sumber: UTBK 2024"
        }
      },
      { "type": "text", "content": "Berdasarkan gambar, pilih jawaban yang benar." }
    ]
  },
  "answer": {
    "interaction_type": "single_choice",
    "options": [
      { "key": "A", "content": { "blocks": [{ "type": "text", "content": "Opsi A" }] }, "is_correct": false },
      { "key": "B", "content": { "blocks": [{ "type": "text", "content": "Opsi B" }] }, "is_correct": true }
    ],
    "correct_answer": "B"
  },
  "explanation": {
    "blocks": [{ "type": "text", "content": "Penjelasan berdasarkan gambar." }]
  }
}
```

---

## 6. Full Import Payload Example

```json
{
  "skill_code": "TPS-PU-LOG-01-A",
  "exam_id": "550e8400-e29b-41d4-a716-446655440000",
  "questions": [
    {
      "question_type": "MCQ5",
      "difficulty": "medium",
      "cognitive_level": "L2",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Nilai " },
          { "type": "inline_math", "content": "2^3 \\times 3^2" },
          { "type": "text", "content": " = ..." }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "content": { "blocks": [{ "type": "text", "content": "72" }] }, "is_correct": true },
          { "key": "B", "content": { "blocks": [{ "type": "text", "content": "36" }] }, "is_correct": false }
        ],
        "correct_answer": "A"
      },
      "explanation": {
        "blocks": [{ "type": "text", "content": "2³ × 3² = 8 × 9 = 72" }]
      },
      "time_estimate_seconds": 60,
      "construct_weights": {
        "C.ATTENTION": 0.20,
        "C.SPEED": 0.20,
        "C.REASONING": 0.20,
        "C.COMPUTATION": 0.20,
        "C.READING": 0.20
      }
    }
  ]
}
```

---

## 7. Validation Rules

| Rule | Description |
|------|-------------|
| `skill_code` or `skill_id` | At least one required |
| `skill_code` + `exam_id` | Required when using code |
| Level-5 node | Resolved node must be level 5 |
| `construct_weights` | Sum = 1.0, keys: C.ATTENTION, C.SPEED, C.REASONING, C.COMPUTATION, C.READING |
| `cognitive_level` | L1, L2, or L3 |
| MCQ5 | Exactly one `is_correct: true` |
| MCK | Multiple correct, `correct_answer` comma-separated |
| LaTeX | Valid KaTeX; use `\\` for backslashes in JSON (server-side validation optional) |

---

## 8. Database Storage

- `questions.content` stores the full document: `{ stimulus, answer, explanation }`
- Legacy fields (`stem`, `options`, `explanation`) are retained for backward compatibility
- On import, both `content` and legacy fields should be populated when possible for gradual migration

**Required migration (when implementing):**

```sql
ALTER TABLE questions ADD COLUMN IF NOT EXISTS content JSONB DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;
```

---

## 9. AI Instructions (for Question Generation Prompts)

When generating import JSON, follow these rules:

- **LaTeX escaping:** In JSON, backslashes must be escaped. Use `\\` for LaTeX commands: `\\frac`, `\\sqrt`, `\\times`, `\\neg`, `\\wedge`, `\\vee`, `\\rightarrow`, `\\equiv`. Example: `"content": "\\\\frac{a}{b}"` produces LaTeX `\frac{a}{b}`.
- **Points:** Do not include `points` in the JSON. Points are derived from `cognitive_level` (L1→1pt, L2→2pt, L3→5pt) per [SCORING_GUIDELINE](../SCORING_GUIDELINE.md).
- **Optional fields:** `difficulty` and `cognitive_level` default to `"medium"` and `"L2"` if omitted.
- **MCK vs MCK-Table:** MCK (multi-select from list) uses `interaction_type: "multi_choice"`. MCK-Table (select cells in a grid) uses `interaction_type: "table_select"` with `options: { rows, columns }`. Ensure you use the correct structure for each.

---

## 10. Related Docs

- [SCORING_GUIDELINE.md](../SCORING_GUIDELINE.md) — points (L1=1pt, L2=2pt, L3=5pt), constructs, coverage
