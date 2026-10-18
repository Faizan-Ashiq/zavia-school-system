import Link from 'next/link'
import { ArrowLeft, BookOpen, Calendar, Clock, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PrintTriggerButton } from '@/components/student/print-trigger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface WorksheetData {
  id: string
  subject: string
  title: string
  teacher: string
  assignedDate: string
  dueDate: string
  totalMarks: number
  concepts: string[]
  questions: Array<{ q: string; marks: number }>
}

function generateDynamicQuestions(subject: string, className: string, title?: string): WorksheetData {
  const s = (subject || 'Mathematics').toLowerCase()
  const c = (className || 'Class 7').toLowerCase()

  if (s.includes('math')) {
    if (c.includes('7') || c.includes('8') || c.includes('6')) {
      return {
        id: `HW-MATH-${className.replace(/\s+/g, '')}`,
        subject: 'Mathematics',
        title: title || 'Rational Numbers, Fractions & Linear Algebraic Equations',
        teacher: 'Engr. Tariq Mehmood',
        assignedDate: 'Current Session',
        dueDate: 'Within 7 Days',
        totalMarks: 25,
        concepts: [
          'Rational Numbers definition: Any number expressed in p/q form where q ≠ 0',
          'Operations on integers and decimals: Addition, Subtraction, Multiplication and Division',
          'Linear equations in one variable: ax + b = c',
          'Ratio, Proportion and Unitary method applications',
        ],
        questions: [
          { q: 'Express the rational numbers 3/4, -5/8, and 7/12 with a common denominator and arrange them in ascending order.', marks: 5 },
          { q: 'Solve the linear equation for x: 3(2x - 5) + 4 = 2(x + 7) - 1. Verify your answer with step-by-step substitution.', marks: 5 },
          { q: 'Simplify the algebraic expression: 4(3a - 2b) - 2(5a - 4b) + 7ab when a = 2 and b = -3.', marks: 5 },
          { q: 'Word Problem: The sum of three consecutive integers is 72. Formulate a linear equation and find the three integers.', marks: 5 },
          { q: 'Find the perimeter and area of a rectangular classroom playground of length 18.5m and breadth 12.4m.', marks: 5 },
        ],
      }
    } else {
      return {
        id: 'HW-MATH-MATRIC',
        subject: 'Mathematics',
        title: title || 'Algebraic Formulas, Factorization & Quadratic Equations',
        teacher: 'Engr. Tariq Mehmood',
        assignedDate: 'Current Session',
        dueDate: 'Within 7 Days',
        totalMarks: 25,
        concepts: [
          'Standard form of quadratic equation: ax² + bx + c = 0 (where a ≠ 0)',
          'Quadratic formula: x = (-b ± √(b² - 4ac)) / (2a)',
          'Nature of roots determined by discriminant: D = b² - 4ac',
          'Algebraic identities: (a + b)³ = a³ + b³ + 3ab(a + b)',
        ],
        questions: [
          { q: 'Solve the quadratic equation 3x² - 5x - 2 = 0 using the Factorization method. Verify your solution roots.', marks: 5 },
          { q: 'Derive the value of discriminant for 2x² - 7x + 3 = 0 and explain whether the roots are real, rational, or unequal.', marks: 5 },
          { q: 'Evaluate the algebraic expression (a + b + c)² when a = 3, b = -2, and c = 5 using expansion formula.', marks: 5 },
          { q: 'Solve by completing the square: x² - 8x + 12 = 0. Show complete intermediate square-addition steps.', marks: 5 },
          { q: 'Word Problem: The product of two consecutive positive even integers is 168. Formulate a quadratic equation and find the two numbers.', marks: 5 },
        ],
      }
    }
  }

  if (s.includes('phy') || s.includes('science')) {
    return {
      id: `HW-SCI-${className.replace(/\s+/g, '')}`,
      subject: subject || 'Science',
      title: title || 'Force, Motion, Energy & Ecosystem Dynamics',
      teacher: 'Sir Usman Khan',
      assignedDate: 'Current Session',
      dueDate: 'Within 7 Days',
      totalMarks: 25,
      concepts: [
        'Newton’s Laws of Motion and fundamental SI units',
        'Kinetic and Potential energy transformations',
        'Plant and animal cell organelles and functions',
        'Elements, compounds, and chemical reactions',
      ],
      questions: [
        { q: 'Explain the difference between speed and velocity. Calculate the average speed of a car that travels 150 km in 2.5 hours.', marks: 5 },
        { q: 'State Newton’s First Law of Motion with two daily life examples illustrating inertia.', marks: 5 },
        { q: 'Draw and label the main structures of a plant cell (Cell wall, Nucleus, Chloroplast, Vacuole).', marks: 5 },
        { q: 'Describe the process of photosynthesis with its balanced chemical word equation.', marks: 5 },
        { q: 'What is renewable energy? Compare Solar and Hydroelectric power generation with advantages and limitations.', marks: 5 },
      ],
    }
  }

  if (s.includes('eng')) {
    return {
      id: `HW-ENG-${className.replace(/\s+/g, '')}`,
      subject: 'English',
      title: title || 'Reading Comprehension, Essay & Applied Grammar',
      teacher: 'Ms. Ayesha Siddiqa',
      assignedDate: 'Current Session',
      dueDate: 'Within 7 Days',
      totalMarks: 25,
      concepts: [
        'Paragraph structure: Topic sentence, Supporting facts, Concluding remark',
        'Parts of Speech and Tenses (Present, Past, Future Perfect)',
        'Active and Passive voice transformation',
        'Vocabulary development and contextual usage',
      ],
      questions: [
        { q: 'Write a 200-word paragraph describing "The Importance of Discipline in School Life".', marks: 5 },
        { q: 'Identify the Parts of Speech for each underlined word in the sentences provided on board.', marks: 5 },
        { q: 'Change the following into Passive Voice: (a) Ali wrote an essay. (b) The gardener is watering the plants.', marks: 5 },
        { q: 'Fill in the blanks with correct prepositions: in, on, at, into, across, between.', marks: 5 },
        { q: 'Write a formal application to the Principal requesting three days leave due to urgent domestic work.', marks: 5 },
      ],
    }
  }

  // Default generic worksheet
  return {
    id: `HW-${subject.substring(0, 3).toUpperCase()}-${className.replace(/\s+/g, '')}`,
    subject: subject || 'General Subject',
    title: title || `${subject} Syllabus Practice Worksheet`,
    teacher: 'Faculty Member',
    assignedDate: 'Current Session',
    dueDate: 'Within 7 Days',
    totalMarks: 25,
    concepts: [
      `Key concepts and definitions for ${subject}`,
      'Chapter summary and analytical problem solving',
      'Evaluation rubric and review guidelines',
    ],
    questions: [
      { q: `Define the fundamental principles of Chapter 1 in ${subject}.`, marks: 5 },
      { q: `Explain the practical application of this topic with two diagrams or examples.`, marks: 5 },
      { q: `Short Question: Differentiate between the primary terminology discussed in class.`, marks: 5 },
      { q: `Solve the comprehensive exercise problem from notebook section A.`, marks: 5 },
      { q: `Write a concise summary highlighting key takeaways and future study goals.`, marks: 5 },
    ],
  }
}

export default async function HomeworkViewPage(props: {
  searchParams: Promise<{
    id?: string
    subject?: string
    className?: string
    section?: string
    title?: string
    viewAs?: string
  }>
}) {
  const { id, subject, className: queryClass, section: querySection, title: queryTitle, viewAs } =
    await props.searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  // 1. Fetch Student profile
  let student: any = null
  if (viewAs) {
    const { data: matched } = await adminClient
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('id', viewAs)
      .maybeSingle()
    student = matched
  } else if (user) {
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

  // 2. Fetch specific assignment from DB if id passed
  let dbAssignment: any = null
  if (id && !id.startsWith('hw-')) {
    const [asgRes, tmRes] = await Promise.all([
      adminClient.from('assignments').select('*').eq('id', id).maybeSingle(),
      adminClient.from('teacher_materials').select('*').eq('id', id).maybeSingle(),
    ])
    dbAssignment = asgRes.data || tmRes.data
  }

  const effectiveSubject =
    dbAssignment?.subject || subject || 'Mathematics'
  const effectiveClass =
    queryClass || dbAssignment?.class_name || student?.classes?.name || 'Class 7'
  const effectiveSection =
    querySection || dbAssignment?.section || student?.sections?.name || 'Section A'
  const effectiveTitle =
    dbAssignment?.title || queryTitle || undefined

  const studentName = student?.student_name?.trim() || 'Enrolled Student'
  const rollNo = student?.roll_no || '12'
  const admissionNo = student?.admission_no || 'ADM-5672'

  const worksheet = generateDynamicQuestions(effectiveSubject, effectiveClass, effectiveTitle)

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col print:bg-white print:p-0 print:min-h-0">
      {/* Top action header - Hidden during print */}
      <header className="bg-white border-b px-4 py-3 no-print print:hidden flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/student/homework"
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-black transition-colors p-1.5 rounded-md hover:bg-neutral-100 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Homework
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="font-semibold text-sm text-foreground hidden sm:block">
            {effectiveClass} · {worksheet.subject}: {worksheet.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <PrintTriggerButton size="sm" />
        </div>
      </header>

      {/* Floating print trigger */}
      <PrintTriggerButton floating label="Print / Save as PDF" />

      {/* Printable Worksheet Sheet */}
      <main className="flex-1 p-4 sm:p-8 flex justify-center items-start print:p-0 print:overflow-visible">
        <div className="w-full max-w-4xl bg-white text-black p-8 sm:p-12 shadow-xl rounded-lg border border-neutral-200 print:shadow-none print:border-none print:w-full print:max-w-none print:p-4 print:rounded-none">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @media print {
              @page { size: A4 portrait; margin: 12mm 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
              .no-print { display: none !important; }
            }
          `,
            }}
          />

          {/* Worksheet Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="font-extrabold text-lg sm:text-xl tracking-wider uppercase">
              The School System
            </h1>
            <p className="text-xs text-gray-700 tracking-wide mt-0.5">
              Department of Academic Excellence · Main Campus
            </p>
            <h2 className="text-sm font-bold uppercase mt-2 tracking-wide bg-gray-100 py-1 border-y border-black">
              Official Homework &amp; Practice Worksheet · {effectiveClass}
            </h2>
            <div className="mt-2 text-base font-extrabold uppercase">
              {worksheet.subject}: {worksheet.title}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-dashed border-gray-400 text-xs font-semibold">
              <div className="text-left">
                Worksheet ID: <span className="font-mono">{worksheet.id}</span>
              </div>
              <div className="text-center">Instructor: {worksheet.teacher}</div>
              <div className="text-right">Max Marks: {worksheet.totalMarks} Points</div>
            </div>
          </div>

          {/* Student Info & Submission Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-black p-3 rounded text-xs mb-6 bg-gray-50/50 print:bg-transparent">
            <div>
              <span className="font-bold text-gray-600 block">Candidate:</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div>
              <span className="font-bold text-gray-600 block">Admission / Roll No:</span>
              <span className="font-mono font-medium">
                {admissionNo} (Roll: {rollNo})
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-600 block">Class &amp; Section:</span>
              <span className="font-semibold">
                {effectiveClass} - {effectiveSection}
              </span>
            </div>
            <div>
              <span className="font-bold text-red-700 block">Submission Due Date:</span>
              <span className="font-semibold text-red-700">{worksheet.dueDate}</span>
            </div>
          </div>

          {/* SECTION 1: Key Concepts */}
          <div className="mb-6 p-3.5 border border-gray-300 rounded bg-gray-50 print:bg-transparent">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Core Academic Principles &amp; Key Concepts ({effectiveClass}):
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-800">
              {worksheet.concepts.map((concept, cIdx) => (
                <li key={cIdx} className="leading-relaxed">
                  {concept}
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 2: Problem Sets */}
          <div className="mb-8">
            <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Structured Practice Exercises &amp; Problem Sets
              </h3>
              <span className="text-xs font-bold font-mono">5 Questions × 5 Marks = 25 Marks</span>
            </div>

            <div className="space-y-6 text-xs">
              {worksheet.questions.map((qItem, qIdx) => (
                <div key={qIdx} className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-semibold leading-relaxed text-sm">
                      <span className="font-bold mr-1.5">Q{qIdx + 1}.</span>
                      {qItem.q}
                    </p>
                    <span className="font-mono font-bold text-gray-700 shrink-0">
                      ({qItem.marks} Marks)
                    </span>
                  </div>

                  {/* Lined student answer workspace for printing */}
                  <div className="border border-dashed border-gray-300 rounded-md p-3 min-h-[90px] bg-gray-50/20 print:bg-transparent">
                    <span className="text-[10px] text-gray-400 italic block mb-1">
                      Student Working / Solution Space for Q{qIdx + 1}:
                    </span>
                    <div className="space-y-4 pt-2">
                      <div className="border-b border-dotted border-gray-300" />
                      <div className="border-b border-dotted border-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Evaluation Rubric & Signatures */}
          <div className="pt-6 border-t-2 border-black">
            <div className="border border-black p-3 rounded bg-gray-50 print:bg-transparent mb-6">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span>Teacher Evaluation &amp; Grading Rubric:</span>
                <span>Max Points: 25</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-center border-t border-gray-400 pt-2">
                <div>Conceptual Clarity (10 M)</div>
                <div>Methodology &amp; Steps (10 M)</div>
                <div>Neatness &amp; Punctuality (5 M)</div>
              </div>
            </div>

            <div className="grid grid-cols-2 text-center text-xs font-medium text-gray-700 pt-4">
              <div>
                <div className="border-t border-black w-44 mx-auto pt-1">
                  Parent / Guardian Signature
                </div>
              </div>
              <div>
                <div className="border-t border-black w-44 mx-auto pt-1">
                  Subject Teacher Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
