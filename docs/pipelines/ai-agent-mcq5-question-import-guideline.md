# AI agent guideline — Gaspol admin question import (MCQ5 only)

Use this document as **system or user context** when generating questions. The human will also paste **style examples**; your job is to output **valid JSON** for **Admin → Questions → Import Questions from JSON**.

---

## Fixed exam

| Field | Value |
|--------|--------|
| `exam_id` | `8ba11dae-864e-442a-8737-7df5dd1becf0` |

Always use this UUID in the import wrapper when using `skill_code` (see below).

---

## Taxonomy source (real nodes)

| Item | Location |
|------|-----------|
| Full export | `docs/generated/taxonomy_nodes_rows.json` (array of row objects) |

**Rules for linking questions**

1. Only **level 5** rows are valid micro-skills for import (`level === 5`).
2. Each row has `code` (e.g. `TPS-PU-IND-01-A`), `name`, `description`, `exam_id`. For this exam, `exam_id` must match the UUID above.
3. In JSON, set **`skill_code`** to that row’s `code` **or** set **`skill_id`** to that row’s `id` (UUID). If you use `skill_id`, you may omit `exam_id` on the wrapper.
4. Align question content with the L5 skill’s **name** and **description** when the human specifies a target skill.

**Sample L5 codes from this export** (non-exhaustive; prefer searching the file):

- `TPS-PU-IND-01-A` — Mengidentifikasi Relasi Analogis  
- `TPS-PU-DED-02-A` — Menafsirkan Pernyataan Bersyarat  
- `LIT-LBE-VEV-01-A` — Interpret Word Meaning  
- `TPS-PK-ARI-01-A` — Menghitung Persentase  

---

## Multiple questions per import

**Yes.** The API accepts an array: `questions: [ ... ]`. One POST imports **all** items in that array, all attached to the **same** micro-skill (`skill_code` + `exam_id` or `skill_id`).

---

## Scope: MCQ5 only

- Set `"question_type": "MCQ5"`.
- Use **`answer.interaction_type": "single_choice"`**.
- Provide **exactly five** options with keys **`A`**, **`B`**, **`C`**, **`D`**, **`E`**.
- Set **`correct_answer`** to **one** of those keys (the only correct option).
- **`stimulus`** and **`explanation`** are `{ "blocks": [ ... ] }` (see block types below).
- Options may use `{ "key", "text" }` **or** `{ "key", "content": { "blocks": [...] } }`.

**Optional fields** (use when appropriate):

- `difficulty`: `easy` | `medium` | `hard` (default `medium`)
- `cognitive_level`: `L1` | `L2` | `L3` (default `L2`)
- `time_estimate_seconds`: positive integer
- `construct_weights`: object whose **numeric values sum to 1.0** (e.g. `C.ATTENTION`, `C.SPEED`, `C.REASONING`, `C.COMPUTATION`, `C.READING`)

---

## Content block types (`stimulus.blocks`, `explanation.blocks`, option `content.blocks`)

| `type` | Shape | Notes |
|--------|--------|--------|
| `text` | `{ "type": "text", "content": "..." }` | Plain text |
| `inline_math` | `{ "type": "inline_math", "content": "..." }` | Inline LaTeX (escape backslashes in JSON) |
| `block_math` | `{ "type": "block_math", "content": "..." }` | Display LaTeX |
| `table` | `{ "type": "table", "spec": { "headers": [...], "rows": [[...], ...] } }` | Cell values string or number |
| `chart` | `{ "type": "chart", "spec": { ... } }` | Vega-Lite–compatible; `$schema` optional |
| `function_graph` | `{ "type": "function_graph", "spec": { "domain", "curves", ... } }` | `curves[].expression` evaluated via mathjs |
| `geometry` | `{ "type": "geometry", "spec": { "elements": [...], "viewBox"? } }` | Elements use `kind`: `point`, `segment` |
| `venn` | `{ "type": "venn", "spec": { "sets": [...], "regions": [...] } }` | Set diagrams |
| `image` | `{ "type": "image", "spec": { "url": "https://...", "alt"?, "caption"? } }` | **`url` must be a valid absolute URL** |

Unknown block types are not rendered in the student UI.

---

## Output contract

1. Output **only** valid JSON (no markdown fences unless the human asks for display).
2. Top level must satisfy: **either** `skill_id` **or** (`skill_code` + `exam_id`).
3. For this pipeline, prefer a wrapper like:

   ```text
   {
     "exam_id": "8ba11dae-864e-442a-8737-7df5dd1becf0",
     "skill_code": "<L5 code from taxonomy_nodes_rows.json>",
     "questions": []
   }
   ```

4. Do not invent `skill_code` values; they must exist as **level 5** in the taxonomy export for this `exam_id`.

---

## Reference example — nine MCQ5 questions, every block type, single import

The following is **illustrative** (dummy math/copy). Replace `skill_code` with the human’s target L5 code from `taxonomy_nodes_rows.json`. Each question’s **stimulus** highlights one block type (Q9 is a short composite).

```json
{
  "exam_id": "8ba11dae-864e-442a-8737-7df5dd1becf0",
  "skill_code": "TPS-PU-IND-01-A",
  "questions": [
    {
      "question_type": "MCQ5",
      "difficulty": "medium",
      "cognitive_level": "L2",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Nilai dari " },
          { "type": "inline_math", "content": "2^4 + 3^2" },
          { "type": "text", "content": " adalah …" }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "19", "is_correct": false },
          { "key": "B", "text": "25", "is_correct": true },
          { "key": "C", "text": "17", "is_correct": false },
          { "key": "D", "text": "22", "is_correct": false },
          { "key": "E", "text": "27", "is_correct": false }
        ],
        "correct_answer": "B"
      },
      "explanation": {
        "blocks": [
          { "type": "text", "content": "2^4 = 16, 3^2 = 9, jadi 16 + 9 = 25." }
        ]
      },
      "time_estimate_seconds": 60,
      "construct_weights": {
        "C.ATTENTION": 0.2,
        "C.SPEED": 0.2,
        "C.REASONING": 0.2,
        "C.COMPUTATION": 0.2,
        "C.READING": 0.2
      }
    },
    {
      "question_type": "MCQ5",
      "difficulty": "medium",
      "cognitive_level": "L2",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Luas lingkaran berjari-jari r:" },
          { "type": "block_math", "content": "A = \\pi r^2" }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "2πr", "is_correct": false },
          { "key": "B", "text": "πr²", "is_correct": true },
          { "key": "C", "text": "πd", "is_correct": false },
          { "key": "D", "text": "r²", "is_correct": false },
          { "key": "E", "text": "2r²", "is_correct": false }
        ],
        "correct_answer": "B"
      },
      "explanation": {
        "blocks": [{ "type": "text", "content": "Rumus luas lingkaran adalah πr²." }]
      },
      "time_estimate_seconds": 60
    },
    {
      "question_type": "MCQ5",
      "difficulty": "easy",
      "cognitive_level": "L1",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Perhatikan tabel berikut." },
          {
            "type": "table",
            "spec": {
              "headers": ["Hari", "Jumlah buku"],
              "rows": [
                ["Senin", 4],
                ["Selasa", 7],
                ["Rabu", 5]
              ]
            }
          },
          { "type": "text", "content": "Total buku pada Senin dan Rabu adalah …" }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "7", "is_correct": false },
          { "key": "B", "text": "9", "is_correct": true },
          { "key": "C", "text": "11", "is_correct": false },
          { "key": "D", "text": "12", "is_correct": false },
          { "key": "E", "text": "16", "is_correct": false }
        ],
        "correct_answer": "B"
      },
      "explanation": {
        "blocks": [{ "type": "text", "content": "4 + 5 = 9." }]
      },
      "time_estimate_seconds": 60
    },
    {
      "question_type": "MCQ5",
      "difficulty": "medium",
      "cognitive_level": "L2",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Diagram batang berikut menunjukkan skor dua tim. Tim mana yang lebih tinggi?" },
          {
            "type": "chart",
            "spec": {
              "data": {
                "values": [
                  { "tim": "X", "skor": 12 },
                  { "tim": "Y", "skor": 18 }
                ]
              },
              "mark": "bar",
              "encoding": {
                "x": { "field": "tim", "type": "nominal" },
                "y": { "field": "skor", "type": "quantitative" }
              }
            }
          }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "Tim X", "is_correct": false },
          { "key": "B", "text": "Tim Y", "is_correct": true },
          { "key": "C", "text": "Sama besar", "is_correct": false },
          { "key": "D", "text": "Tidak dapat ditentukan", "is_correct": false },
          { "key": "E", "text": "Keduanya nol", "is_correct": false }
        ],
        "correct_answer": "B"
      },
      "explanation": {
        "blocks": [{ "type": "text", "content": "18 > 12, jadi Tim Y lebih tinggi." }]
      },
      "time_estimate_seconds": 75
    },
    {
      "question_type": "MCQ5",
      "difficulty": "medium",
      "cognitive_level": "L2",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Grafik berikut menunjukkan y = x² − 2x + 1 untuk x pada [−1, 3]. Nilai minimum fungsi pada interval tersebut dicapai di x = …" },
          {
            "type": "function_graph",
            "spec": {
              "domain": { "x": [-1, 3], "y": [-0.5, 5] },
              "axes": true,
              "grid": true,
              "curves": [{ "expression": "x^2 - 2*x + 1", "label": "f(x)" }]
            }
          }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "−1", "is_correct": false },
          { "key": "B", "text": "0", "is_correct": false },
          { "key": "C", "text": "1", "is_correct": true },
          { "key": "D", "text": "2", "is_correct": false },
          { "key": "E", "text": "3", "is_correct": false }
        ],
        "correct_answer": "C"
      },
      "explanation": {
        "blocks": [
          { "type": "text", "content": "f(x) = (x−1)²; minimum 0 di x = 1." }
        ]
      },
      "time_estimate_seconds": 90
    },
    {
      "question_type": "MCQ5",
      "difficulty": "easy",
      "cognitive_level": "L1",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Pada gambar, berapa banyak titik yang dilabeli?" },
          {
            "type": "geometry",
            "spec": {
              "viewBox": { "width": 120, "height": 100 },
              "elements": [
                { "kind": "point", "at": { "x": 10, "y": 90 }, "label": "O" },
                { "kind": "point", "at": { "x": 70, "y": 30 }, "label": "A" },
                {
                  "kind": "segment",
                  "from": { "x": 10, "y": 90 },
                  "to": { "x": 70, "y": 30 }
                }
              ]
            }
          }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "0", "is_correct": false },
          { "key": "B", "text": "1", "is_correct": false },
          { "key": "C", "text": "2", "is_correct": true },
          { "key": "D", "text": "3", "is_correct": false },
          { "key": "E", "text": "4", "is_correct": false }
        ],
        "correct_answer": "C"
      },
      "explanation": {
        "blocks": [
          { "type": "text", "content": "Ada dua titik berlabel: O dan A." }
        ]
      },
      "time_estimate_seconds": 75
    },
    {
      "question_type": "MCQ5",
      "difficulty": "medium",
      "cognitive_level": "L2",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Himpunan A dan B seperti diagram. Berapa banyak himpunan yang digambar?" },
          {
            "type": "venn",
            "spec": {
              "sets": [
                { "id": "A", "label": "A", "cx": 75, "cy": 110, "r": 55 },
                { "id": "B", "label": "B", "cx": 135, "cy": 110, "r": 55 }
              ],
              "regions": [
                { "id": "intersection", "label": "A ∩ B", "setIds": ["A", "B"] }
              ]
            }
          }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "1", "is_correct": false },
          { "key": "B", "text": "2", "is_correct": true },
          { "key": "C", "text": "3", "is_correct": false },
          { "key": "D", "text": "4", "is_correct": false },
          { "key": "E", "text": "0", "is_correct": false }
        ],
        "correct_answer": "B"
      },
      "explanation": {
        "blocks": [{ "type": "text", "content": "Ada dua lingkaran/himpunan: A dan B." }]
      },
      "time_estimate_seconds": 60
    },
    {
      "question_type": "MCQ5",
      "difficulty": "easy",
      "cognitive_level": "L1",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Perhatikan gambar berikut." },
          {
            "type": "image",
            "spec": {
              "url": "https://picsum.photos/id/237/400/240",
              "alt": "Anjing hitam duduk di lantai kayu",
              "caption": "Ilustrasi kontekstual (placeholder)."
            }
          },
          { "type": "text", "content": "Jika ini hanya ilustrasi dekoratif, pernyataan yang paling tepat adalah …" }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "Gambar menunjukkan data kuantitatif", "is_correct": false },
          { "key": "B", "text": "Gambar tidak memberi informasi numerik untuk menjawab soal", "is_correct": true },
          { "key": "C", "text": "Gambar membuktikan hipotesis secara deduktif", "is_correct": false },
          { "key": "D", "text": "Gambar menggantikan teks soal sepenuhnya", "is_correct": false },
          { "key": "E", "text": "Gambar selalu menunjukkan diagram Venn", "is_correct": false }
        ],
        "correct_answer": "B"
      },
      "explanation": {
        "blocks": [
          { "type": "text", "content": "Placeholder gambar tidak membawa data soal kecuali soal secara eksplisit merujuk isi visual." }
        ]
      },
      "time_estimate_seconds": 45
    },
    {
      "question_type": "MCQ5",
      "difficulty": "medium",
      "cognitive_level": "L2",
      "stimulus": {
        "blocks": [
          { "type": "text", "content": "Dari tabel dan rumus " },
          { "type": "inline_math", "content": "s = v \\cdot t" },
          { "type": "text", "content": ", jarak pada baris kedua adalah …" },
          {
            "type": "table",
            "spec": {
              "headers": ["v (m/s)", "t (s)", "s (m)"],
              "rows": [
                [10, 3, 30],
                [8, 4, "?"]
              ]
            }
          }
        ]
      },
      "answer": {
        "interaction_type": "single_choice",
        "options": [
          { "key": "A", "text": "12", "is_correct": false },
          { "key": "B", "text": "24", "is_correct": false },
          { "key": "C", "text": "32", "is_correct": true },
          { "key": "D", "text": "36", "is_correct": false },
          { "key": "E", "text": "40", "is_correct": false }
        ],
        "correct_answer": "C"
      },
      "explanation": {
        "blocks": [{ "type": "text", "content": "s = 8 × 4 = 32 m." }]
      },
      "time_estimate_seconds": 60
    }
  ]
}
```

---

## Checklist before returning JSON

- [ ] `exam_id` is `8ba11dae-864e-442a-8737-7df5dd1becf0` when using `skill_code`
- [ ] `skill_code` or `skill_id` refers to a **level 5** node in `taxonomy_nodes_rows.json` for this exam
- [ ] Every question: `question_type` = `MCQ5`, `single_choice`, keys A–E, `correct_answer` ∈ {A,B,C,D,E}
- [ ] Every `stimulus` has `{ "blocks": [ ... ] }` (may be empty only if intentional; prefer non-empty)
- [ ] If `construct_weights` is present, values sum to **1.0**
- [ ] `image` blocks use **https** URLs
- [ ] LaTeX in JSON: escape backslashes (`\\`)

---

## Human workflow (reminder)

1. Paste **this guideline** + **taxonomy path** + target **L5 `skill_code`** to the AI.  
2. Paste **style examples** of questions you want mimicked.  
3. Receive **JSON** → paste into **Admin → Questions → Import Questions from JSON** → import.

Canonical schema reference in repo: `lib/import/question-import-schema.ts`, `docs/features/admin-question-import.features.md`.
