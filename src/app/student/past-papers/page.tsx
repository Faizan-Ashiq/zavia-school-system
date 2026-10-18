import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  FileText,
  FileCheck2,
  GraduationCap,
  Printer,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentPastPapersPage() {
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

  const className = student?.classes?.name ?? 'Class 9 (Matric)'

  const subjectGroups = [
    {
      subject: 'Mathematics',
      description: 'BISE Board Annual & Model Papers for Matric Science Group',
      papers: [
        {
          title: 'Mathematics Annual Exam 2025 (Group I & II)',
          term: 'Annual / Final',
          year: '2025',
          size: '2.4 MB',
          hasSolution: true,
          filename: 'Math_Class9_Annual_2025_Solved.pdf',
        },
        {
          title: 'Mathematics Annual Exam 2024 (Group I & II)',
          term: 'Annual / Final',
          year: '2024',
          size: '2.1 MB',
          hasSolution: true,
          filename: 'Math_Class9_Annual_2024_Solved.pdf',
        },
      ],
    },
    {
      subject: 'Physics',
      description: 'Theoretical, Numerical & Experimental Viva Question Papers',
      papers: [
        {
          title: 'Physics Annual Exam 2025 (Theory & Practical)',
          term: 'Annual / Final',
          year: '2025',
          size: '2.2 MB',
          hasSolution: true,
          filename: 'Physics_Class9_Annual_2025_Solved.pdf',
        },
        {
          title: 'Physics Annual Exam 2024 (Theory & Objective)',
          term: 'Annual / Final',
          year: '2024',
          size: '1.9 MB',
          hasSolution: true,
          filename: 'Physics_Class9_Annual_2024_Solved.pdf',
        },
      ],
    },
    {
      subject: 'Chemistry',
      description: 'Chemical Equations, Periodic Table & Analytical Problem Banks',
      papers: [
        {
          title: 'Chemistry Annual Exam 2025 (Subjective & Objective)',
          term: 'Annual / Final',
          year: '2025',
          size: '2.3 MB',
          hasSolution: true,
          filename: 'Chemistry_Class9_Annual_2025_Solved.pdf',
        },
        {
          title: 'Chemistry Annual Exam 2024 (Subjective & Objective)',
          term: 'Annual / Final',
          year: '2024',
          size: '2.0 MB',
          hasSolution: true,
          filename: 'Chemistry_Class9_Annual_2024_Solved.pdf',
        },
      ],
    },
    {
      subject: 'Computer Science',
      description: 'Programming Logic, Algorithms, Binary Arithmetic & Hardware',
      papers: [
        {
          title: 'Computer Science Annual Exam 2025 (Python & Algorithms)',
          term: 'Annual / Final',
          year: '2025',
          size: '2.5 MB',
          hasSolution: true,
          filename: 'Computer_Science_Class9_Annual_2025.pdf',
        },
        {
          title: 'Computer Science Annual Exam 2024 (Theory & Lab)',
          term: 'Annual / Final',
          year: '2024',
          size: '1.8 MB',
          hasSolution: true,
          filename: 'Computer_Science_Class9_Annual_2024.pdf',
        },
      ],
    },
  ]

  const totalCount = subjectGroups.reduce((acc, g) => acc + g.papers.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Past Examination Papers &amp; Model Tests</h1>
          <p className="text-sm text-muted-foreground">
            Official BISE Board exam archives, solved keys, and term test papers curated for {className}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
            {totalCount} Official Papers
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Curriculum: 2025–2026
          </Badge>
        </div>
      </div>

      {/* Subject Groups */}
      <div className="space-y-6">
        {subjectGroups.map((group, gIdx) => (
          <Card key={gIdx} className="shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/40 py-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {group.subject}
                  </CardTitle>
                  <CardDescription className="text-xs">{group.description}</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold bg-background">
                  {group.papers.length} Papers
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {group.papers.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-semibold text-sm text-foreground">{p.title}</h2>
                          <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                            Year: {p.year}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">
                            {p.term}
                          </Badge>
                          {p.hasSolution && (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] py-0 h-4 border border-emerald-300">
                              <FileCheck2 className="mr-0.5 h-3 w-3" /> Solved Key
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Subject: <span className="font-medium text-foreground">{group.subject}</span> · File Size: <span className="font-mono">{p.size}</span> · Format: PDF Document
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Link
                        href={`/student/past-papers/view?subject=${encodeURIComponent(group.subject)}&year=${p.year}&term=${encodeURIComponent(p.term)}`}
                        target="_blank"
                        prefetch={true}
                        className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'cursor-pointer inline-flex items-center text-xs h-8 px-3.5 shadow-xs')}
                      >
                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                        View &amp; Print Paper (PDF)
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
