import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { getDataJudApi } from '@/lib/integrations/datajud/api'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const processNumber = request.nextUrl.searchParams.get('processNumber')
    if (!processNumber) {
      return NextResponse.json({ error: 'processNumber query param is required' }, { status: 400 })
    }

    const digits = processNumber.replace(/\D/g, '')
    if (digits.length !== 20) {
      return NextResponse.json({ error: 'Invalid CNJ number: expected 20 digits' }, { status: 400 })
    }

    const api = getDataJudApi()
    const results = await api.searchByProcessNumber(processNumber)

    if (results.length === 0) {
      return NextResponse.json({ found: false })
    }

    const processo = results[0]

    return NextResponse.json({
      found: true,
      tribunal: processo.tribunal || '',
      courtName: processo.orgaoJulgador?.nome || '',
      municipality: processo.orgaoJulgador?.municipio || '',
      state: processo.orgaoJulgador?.uf || '',
      className: processo.classe?.nome || '',
      filingDate: processo.dataAjuizamento || null,
      caseValue: processo.valorCausa ?? null,
      subjects: (processo.assuntos || []).map(a => a.nome),
      movementCount: (processo.movimentos || []).length,
      participantCount: (processo.participantes || []).length,
    })
  } catch (error) {
    console.error('DataJud lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to query DataJud', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
