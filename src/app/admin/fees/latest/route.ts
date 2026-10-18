import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const studentId = searchParams.get('student')

  if (!studentId) {
    return NextResponse.redirect(new URL('/admin/fees', request.url))
  }

  const supabase = await createClient()

  const { data: latestVoucher } = await supabase
    .from('fee_vouchers')
    .select('id')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestVoucher) {
    return NextResponse.redirect(new URL(`/admin/fees/${latestVoucher.id}/print`, request.url))
  }

  // Fallback if no voucher exists
  return NextResponse.redirect(new URL(`/admin/fees?student=${studentId}`, request.url))
}
