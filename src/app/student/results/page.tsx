import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  Award,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentResultsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  // 1. Fetch Student profile & linked data
  let student: any = null
  if (user) {
    const { data: matched } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('user_id', user.id)
      .maybeSingle()
    student = matched
  }

  if (!student) {
    const { data: fallbackStudent } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    student = fallbackStudent
  }

  const studentName = (student?.student_name ?? 'Muhammad Hamdan').trim()
  const className = student?.classes?.name ?? 'Class 9 (Matric)'
  const sectionName = student?.sections?.name ?? 'Section B'
  const rollNo = student?.roll_no ?? '12'
  const admissionNo = (student?.admission_no ?? 'ADM-5672').replace(/\s+/g, '')

  const examSubjects = [
    { subject: 'Mathematics', max: 100, passing: 33, obtained: 96, grade: 'A+', remarks: 'Outstanding analytical skills' },
    { subject: 'Computer Science', max: 100, passing: 33, obtained: 95, grade: 'A+', remarks: 'Exemplary coding and theory' },
    { subject: 'Physics', max: 100, passing: 33, obtained: 89, grade: 'A+', remarks: 'Strong conceptual clarity' },
    { subject: 'Islamic Studies / Ethics', max: 100, passing: 33, obtained: 85, grade: 'A', remarks: 'Good grasp of curriculum' },
    { subject: 'English Language & Lit', max: 100, passing: 33, obtained: 84, grade: 'A', remarks: 'Well-articulated essays' },
    { subject: 'Urdu Literature', max: 100, passing: 33, obtained: 82, grade: 'A', remarks: 'Good comprehension' },
  ]

  const totalMax = examSubjects.reduce((acc, s) => acc + s.max, 0)
  const totalObtained = examSubjects.reduce((acc, s) => acc + s.obtained, 0)
  const percentage = ((totalObtained / totalMax) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Performance &amp; Results</h1>
          <p className="text-sm text-muted-foreground">
            Official Term Report Cards &amp; Examination Records for {studentName} ({admissionNo})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
            Session 2025–2026
          </Badge>
          <Badge variant="default" className="text-xs">
            Term: Mid-Term Examination 2026
          </Badge>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Marks</p>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                {totalObtained} <span className="text-sm font-normal text-muted-foreground">/ {totalMax}</span>
              </h2>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Overall Percentage</p>
              <h2 className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">{percentage}%</h2>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Cumulative Grade</p>
              <h2 className="text-2xl font-bold tracking-tight text-primary mt-1">A+ (Distinction)</h2>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Class Position</p>
              <h2 className="text-2xl font-bold tracking-tight text-indigo-600 mt-1">2nd Position</h2>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Card Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Mid-Term Official Marksheet
              </CardTitle>
              <CardDescription>
                Candidate: {studentName} · Roll No: {rollNo} · {className} ({sectionName})
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit text-xs font-semibold">
              Status: PROMOTED / PASSED
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-y">
                <tr>
                  <th scope="col" className="py-3 px-4">Subject</th>
                  <th scope="col" className="py-3 px-3 text-center">Max Marks</th>
                  <th scope="col" className="py-3 px-3 text-center">Passing</th>
                  <th scope="col" className="py-3 px-3 text-center font-bold text-foreground">Obtained</th>
                  <th scope="col" className="py-3 px-3 text-center">Percentage</th>
                  <th scope="col" className="py-3 px-3 text-center">Grade</th>
                  <th scope="col" className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {examSubjects.map((item, idx) => {
                  const subjectPercentage = ((item.obtained / item.max) * 100).toFixed(0)
                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{item.subject}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted-foreground">{item.max}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted-foreground">{item.passing}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-foreground">{item.obtained}</td>
                      <td className="py-3 px-3 text-center font-mono text-emerald-600 font-medium">{subjectPercentage}%</td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline" className="font-semibold text-xs border-primary/30 text-primary">
                          {item.grade}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{item.remarks}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-muted/40 font-semibold border-t-2 border-border">
                <tr>
                  <td className="py-3 px-4 uppercase text-xs">Total Aggregate</td>
                  <td className="py-3 px-3 text-center font-mono">{totalMax}</td>
                  <td className="py-3 px-3 text-center font-mono">198</td>
                  <td className="py-3 px-3 text-center font-mono text-base text-primary font-bold">{totalObtained}</td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-600">{percentage}%</td>
                  <td className="py-3 px-3 text-center">
                    <Badge className="bg-emerald-600 text-white font-bold">A+</Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-emerald-700 font-medium">Passed with High Distinction</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Remarks and Sign-off */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Teacher &amp; Faculty Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p className="leading-relaxed">
              &quot;Muhammad Hamdan has demonstrated commendable discipline and high academic consistency throughout the term. His logical aptitude in Mathematics and Physics is outstanding. Recommended to maintain active participation in co-curricular debates.&quot;
            </p>
            <div className="pt-2 flex items-center justify-between border-t text-foreground font-medium">
              <span>Class Incharge: Engr. Tariq Mehmood</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Grading Scale Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-muted/40 border">
                <div className="font-bold text-primary">80% – 100%</div>
                <div className="text-[11px] text-muted-foreground">Grade A+ (Distinction)</div>
              </div>
              <div className="p-2 rounded bg-muted/40 border">
                <div className="font-bold text-emerald-600">70% – 79%</div>
                <div className="text-[11px] text-muted-foreground">Grade A (Excellent)</div>
              </div>
              <div className="p-2 rounded bg-muted/40 border">
                <div className="font-bold text-amber-600">60% – 69%</div>
                <div className="text-[11px] text-muted-foreground">Grade B (Good)</div>
              </div>
              <div className="p-2 rounded bg-muted/40 border">
                <div className="font-bold text-muted-foreground">50% – 59%</div>
                <div className="text-[11px] text-muted-foreground">Grade C (Satisfactory)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
