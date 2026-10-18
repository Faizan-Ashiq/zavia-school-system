import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processLeaveSubmission } from '@/app/actions/leaves'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))

    const leaveType = (body.leaveType || body.leave_type || 'CASUAL').toString()
    const startDate = (body.startDate || body.from_date || body.start_date || '').toString()
    const endDate = (body.endDate || body.to_date || body.end_date || '').toString()
    const reason = (body.reason || body.description || '').toString()

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required.' },
        { status: 400 }
      )
    }

    const result = await processLeaveSubmission({
      userId: user.id,
      leaveType,
      startDate,
      endDate,
      reason: reason || 'Duty leave request',
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data, message: result.message },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[API /api/staff/leaves] Error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
