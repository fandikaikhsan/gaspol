import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * API route to fix baseline module references
 * POST /admin/diagnostics/fix
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get all baseline modules
    const { data: baselineModules, error: bmError } = await supabase
      .from('baseline_modules')
      .select('id, module_id, title, checkpoint_order')
      .order('checkpoint_order')

    if (bmError) throw bmError

    // Get all modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name, module_type, is_published')
      .eq('is_published', true)

    if (modulesError) throw modulesError

    const fixes = []
    const issues = []

    // For each baseline module, check if its module_id exists
    for (const bm of baselineModules || []) {
      const moduleExists = modules?.some(m => m.id === bm.module_id)

      if (!moduleExists) {
        // Try to find a matching module by name similarity
        const possibleMatch = modules?.find(m =>
          bm.title.toLowerCase().includes(m.name.toLowerCase()) ||
          m.name.toLowerCase().includes(bm.title.toLowerCase())
        )

        if (possibleMatch) {
          // Update the baseline module to point to the correct module
          const { error: updateError } = await supabase
            .from('baseline_modules')
            .update({ module_id: possibleMatch.id })
            .eq('id', bm.id)

          if (updateError) {
            issues.push({
              baseline_module: bm.title,
              error: updateError.message
            })
          } else {
            fixes.push({
              baseline_module: bm.title,
              old_module_id: bm.module_id,
              new_module_id: possibleMatch.id,
              matched_to: possibleMatch.name
            })
          }
        } else {
          issues.push({
            baseline_module: bm.title,
            module_id: bm.module_id,
            error: 'No matching module found'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixes,
      issues,
      message: `Fixed ${fixes.length} baseline module(s), ${issues.length} issue(s) remaining`
    })

  } catch (error) {
    console.error('Fix error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
