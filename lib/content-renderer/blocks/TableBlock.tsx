"use client"

import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "table" }>
}

export function TableBlock({ block }: Props) {
  const { headers, rows } = block.spec

  return (
    <div className="my-4 overflow-x-auto rounded-lg border-2 border-border">
      <table className="w-full min-w-[200px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-border px-3 py-2 text-left font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-muted/50">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="border border-border px-3 py-2"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
