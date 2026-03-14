/**
 * Transform taxonomy import JSON to flat insert order
 * @see docs/generated/taxonomy.json
 */
import type { TaxonomyImport } from "./taxonomy-import-schema"
import type { FlatTaxonomyNode } from "./taxonomy-import-schema"

function flatten(
  data: TaxonomyImport,
  out: FlatTaxonomyNode[] = [],
  parentCode: string | null = null,
) {
  for (const subject of data.subjects) {
    out.push({
      level: 1,
      code: subject.code,
      name: subject.name,
      description: subject.description ?? "",
      parentCode: null,
      position: out.filter((n) => n.level === 1).length,
    })
    for (let si = 0; si < (subject.subtests ?? []).length; si++) {
      const st = subject.subtests![si]
      out.push({
        level: 2,
        code: st.code,
        name: st.name,
        description: st.description ?? "",
        parentCode: subject.code,
        position: si,
      })
      for (let ti = 0; ti < (st.topics ?? []).length; ti++) {
        const topic = st.topics![ti]
        out.push({
          level: 3,
          code: topic.code,
          name: topic.name,
          description: topic.description ?? "",
          parentCode: st.code,
          position: ti,
        })
        for (let sbi = 0; sbi < (topic.subtopics ?? []).length; sbi++) {
          const sub = topic.subtopics![sbi]
          out.push({
            level: 4,
            code: sub.code,
            name: sub.name,
            description: sub.description ?? "",
            parentCode: topic.code,
            position: sbi,
          })
          for (let mi = 0; mi < (sub.micro_skills ?? []).length; mi++) {
            const m = sub.micro_skills![mi]
            out.push({
              level: 5,
              code: m.code,
              name: m.name,
              description: m.description ?? "",
              parentCode: sub.code,
              position: mi,
            })
          }
        }
      }
    }
  }
  return out
}

export function flattenTaxonomyImport(data: TaxonomyImport): FlatTaxonomyNode[] {
  return flatten(data)
}
