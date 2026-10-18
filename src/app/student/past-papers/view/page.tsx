import Link from 'next/link'
import { ArrowLeft, Award, BookOpen, Clock, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PrintTriggerButton } from '@/components/student/print-trigger'

export const dynamic = 'force-dynamic'

interface SubjectExamData {
  code: string
  subject: string
  timeAllowed: string
  maxMarks: number
  mcqs: Array<{ q: string; a: string; b: string; c: string; d: string; ans: string }>
  shortQuestions: Array<{ q: string; marks: number }>
  longQuestions: Array<{ q: string; marks: number }>
}

const examDatabase: Record<string, SubjectExamData> = {
  Mathematics: {
    code: 'MATH-901',
    subject: 'Mathematics (Science Group)',
    timeAllowed: '2 Hours 30 Minutes',
    maxMarks: 75,
    mcqs: [
      { q: 'The discriminant of quadratic equation ax² + bx + c = 0 is given by:', a: 'b² - 4ac', b: 'b² + 4ac', c: '-b ± √(b² - 4ac)', d: '4ac - b²', ans: 'A' },
      { q: 'The order of matrix [2  5  7] is:', a: '3 × 1', b: '1 × 3', c: '1 × 1', d: '3 × 3', ans: 'B' },
      { q: 'The value of log₁₀(1000) is equal to:', a: '2', b: '3', c: '10', d: '100', ans: 'B' },
      { q: 'If x² - 9 = 0, then the solution set is:', a: '{3}', b: '{-3}', c: '{±3}', d: '{9}', ans: 'C' },
      { q: 'In any right-angled triangle, sin²θ + cos²θ equals:', a: '0', b: '1', c: '2', d: 'tan θ', ans: 'B' },
    ],
    shortQuestions: [
      { q: 'Solve the system of linear equations using Cramer\'s Rule: 2x - y = 5 and 3x + 2y = 11.', marks: 4 },
      { q: 'Simplify the radical expression: (√50 - √18 + √32) / √2.', marks: 4 },
      { q: 'Factorize completely: x³ - 8y³ - 6x²y + 12xy².', marks: 4 },
      { q: 'Find the value of x if log₂(x - 3) = 5.', marks: 4 },
      { q: 'Solve the quadratic equation by completing the square: x² - 6x - 7 = 0.', marks: 4 },
      { q: 'Find the standard deviation and variance for the given data points: 4, 8, 10, 12, 16.', marks: 4 },
    ],
    longQuestions: [
      { q: 'Derive the standard Quadratic Formula from the general form ax² + bx + c = 0 using the method of completing the square. Hence solve: 3x² + 7x - 6 = 0.', marks: 9 },
      { q: 'Prove that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides (Pythagoras Theorem) with a detailed geometric diagram.', marks: 9 },
      { q: 'Find the solution set of the non-linear simultaneous equations: x + y = 7 and x² + y² = 29.', marks: 9 },
    ],
  },
  Physics: {
    code: 'PHY-902',
    subject: 'Physics (Theory & Numerical)',
    timeAllowed: '2 Hours 30 Minutes',
    maxMarks: 75,
    mcqs: [
      { q: 'The SI unit of momentum is:', a: 'N·m', b: 'kg·m/s', c: 'J/s', d: 'kg·m/s²', ans: 'B' },
      { q: 'The slope of a Velocity-Time graph represents:', a: 'Distance', b: 'Speed', c: 'Acceleration', d: 'Force', ans: 'C' },
      { q: 'The rate of doing work is called:', a: 'Energy', b: 'Power', c: 'Momentum', d: 'Torque', ans: 'B' },
      { q: 'The value of gravitational acceleration (g) at the surface of Earth is approximately:', a: '9.8 m/s²', b: '1.6 m/s²', c: '6.67 × 10⁻¹¹ N·m²/kg²', d: '100 m/s²', ans: 'A' },
      { q: 'Hydraulic brakes in vehicles operate on the principle of:', a: 'Archimedes Principle', b: 'Hooke\'s Law', c: 'Pascal\'s Law', d: 'Boyle\'s Law', ans: 'C' },
    ],
    shortQuestions: [
      { q: 'Differentiate between scalar and vector quantities with two examples of each.', marks: 4 },
      { q: 'State Newton\'s Second Law of Motion and derive the mathematical equation F = ma.', marks: 4 },
      { q: 'Define Centripetal Force and write its mathematical formula in terms of mass, velocity, and radius.', marks: 4 },
      { q: 'State the Principle of Moments and define Center of Gravity of an irregular lamina.', marks: 4 },
      { q: 'What is meant by Latent Heat of Fusion? Calculate heat required to melt 2 kg of ice at 0°C (Lf = 3.36 × 10⁵ J/kg).', marks: 4 },
      { q: 'Explain why evaporation causes cooling with reference to kinetic molecular theory.', marks: 4 },
    ],
    longQuestions: [
      { q: 'Derive the three fundamental equations of uniformly accelerated motion with the help of a labeled Velocity-Time graph.', marks: 9 },
      { q: 'A car starting from rest accelerates uniformly to a velocity of 20 m/s in 10 seconds. It travels at this speed for 20 seconds and is then brought to rest in 5 seconds. Calculate: (a) Total distance covered, (b) Average speed.', marks: 9 },
      { q: 'State Pascal\'s Law. Explain the construction and working of a Hydraulic Lift with a neat schematic diagram.', marks: 9 },
    ],
  },
  Chemistry: {
    code: 'CHEM-903',
    subject: 'Chemistry (Theory & Analytical)',
    timeAllowed: '2 Hours 30 Minutes',
    maxMarks: 75,
    mcqs: [
      { q: 'The number of moles present in 36 grams of pure water (H₂O) is:', a: '1 mole', b: '2 moles', c: '18 moles', d: '0.5 mole', ans: 'B' },
      { q: 'The electronic configuration of Sodium (Na, Z = 11) is:', a: '2, 8, 1', b: '2, 8, 8', c: '2, 8, 2', d: '2, 7, 2', ans: 'A' },
      { q: 'The chemical bond formed between Sodium and Chlorine in NaCl is:', a: 'Covalent bond', b: 'Ionic / Electrovalent bond', c: 'Coordinate covalent bond', d: 'Metallic bond', ans: 'B' },
      { q: 'Halogens belong to which group in the Modern Periodic Table:', a: 'Group 1', b: 'Group 2', c: 'Group 17 (VII-A)', d: 'Group 18 (Zero Group)', ans: 'C' },
      { q: 'The pH of a neutral aqueous solution at 25°C is:', a: '0', b: '7', c: '14', d: '1', ans: 'B' },
    ],
    shortQuestions: [
      { q: 'Define Isotopes. Write the names and symbolic representation of three isotopes of Hydrogen.', marks: 4 },
      { q: 'State two main defects / drawbacks of Rutherford\'s Atomic Model.', marks: 4 },
      { q: 'Differentiate between Polar Covalent and Non-Polar Covalent bonds with appropriate examples.', marks: 4 },
      { q: 'State Boyle\'s Law and write its mathematical formulation at constant temperature.', marks: 4 },
      { q: 'Define Electronegativity. Explain its trend across a period and down a group in the periodic table.', marks: 4 },
      { q: 'Calculate the molarity of a solution prepared by dissolving 4.0 g of NaOH in 250 cm³ of solution.', marks: 4 },
    ],
    longQuestions: [
      { q: 'Explain Bohr\'s Atomic Theory. State its main postulates and how it resolved the stability problem of Rutherford\'s model.', marks: 9 },
      { q: 'Discuss the periodic trends of: (a) Atomic Radius, (b) Ionization Energy, and (c) Electron Affinity in the Modern Periodic Table with suitable reasoning.', marks: 9 },
      { q: 'Describe the process of electroplating of Nickel on an iron spoon with an electrochemical cell diagram and anode/cathode reactions.', marks: 9 },
    ],
  },
  'Computer Science': {
    code: 'CS-904',
    subject: 'Computer Science (Coding & Logic)',
    timeAllowed: '2 Hours 30 Minutes',
    maxMarks: 75,
    mcqs: [
      { q: 'The base of the Hexadecimal number system is:', a: '2', b: '8', c: '10', d: '16', ans: 'D' },
      { q: 'In standard flowchart symbols, a Diamond shape is used for:', a: 'Input / Output', b: 'Process', c: 'Decision / Condition', d: 'Connector', ans: 'C' },
      { q: 'Which of the following is an example of volatile primary memory:', a: 'Hard Disk', b: 'ROM', c: 'RAM', d: 'Flash Drive', ans: 'C' },
      { q: 'In Python programming, the result of 17 % 5 is:', a: '3', b: '2', c: '3.4', d: '0', ans: 'B' },
      { q: 'The communication protocol used for secure browsing over the internet is:', a: 'FTP', b: 'HTTP', c: 'HTTPS', d: 'SMTP', ans: 'C' },
    ],
    shortQuestions: [
      { q: 'Differentiate between an Algorithm and a Flowchart with one example.', marks: 4 },
      { q: 'Convert binary number (110101)₂ into its equivalent Decimal system.', marks: 4 },
      { q: 'Explain the difference between Compiler, Interpreter, and Assembler.', marks: 4 },
      { q: 'What is the purpose of primary key in a database table? Give an example.', marks: 4 },
      { q: 'Define variables in Python and state two rules for naming identifiers.', marks: 4 },
      { q: 'Explain the working of Star Network Topology with its main advantages.', marks: 4 },
    ],
    longQuestions: [
      { q: 'Write an algorithm, draw an ANSI standard flowchart, and write a Python script to check whether a given integer is Prime or Composite.', marks: 9 },
      { q: 'Explain the working of Binary Search algorithm. Trace its execution on the sorted array [3, 8, 12, 19, 25, 33, 42] searching for key 25.', marks: 9 },
      { q: 'Describe common cyber security threats (Malware, Phishing, Ransomware) and outline essential defense mechanisms.', marks: 9 },
    ],
  },
}

export default async function PastPaperViewPage(props: {
  searchParams: Promise<{ subject?: string; year?: string; term?: string }>
}) {
  const { subject: rawSubject, year = '2025', term = 'Annual Examination' } = await props.searchParams
  const matchedKey = Object.keys(examDatabase).find(
    (k) => rawSubject && k.toLowerCase().includes(rawSubject.toLowerCase())
  ) || 'Mathematics'

  const exam = examDatabase[matchedKey]

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col print:bg-white print:p-0 print:min-h-0">
      {/* Top action header - Hidden during print */}
      <header className="bg-white border-b px-4 py-3 no-print print:hidden flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/student/past-papers"
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Past Papers
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="font-semibold text-sm text-foreground hidden sm:block">
            {exam.subject} · {year} Paper
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <PrintTriggerButton size="sm" />
        </div>
      </header>

      {/* Floating print trigger for quick 1-click execution */}
      <PrintTriggerButton floating label="Print / Save as PDF" />

      {/* Printable Paper Canvas */}
      <main className="flex-1 p-4 sm:p-8 flex justify-center items-start print:p-0 print:overflow-visible">
        <div className="w-full max-w-4xl bg-white text-black p-8 sm:p-12 shadow-xl rounded-lg border border-neutral-200 print:shadow-none print:border-none print:w-full print:max-w-none print:p-4 print:rounded-none">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: A4 portrait; margin: 12mm 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
              .no-print { display: none !important; }
            }
          `}} />

          {/* Exam Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="font-extrabold text-lg sm:text-xl tracking-wider uppercase">
              Board of Intermediate &amp; Secondary Education
            </h1>
            <h2 className="text-sm font-bold uppercase mt-1 tracking-wide">
              {term} {year} · Class 9 (Matriculation)
            </h2>
            <div className="mt-2 text-base font-extrabold underline uppercase">
              {exam.subject}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-dashed border-gray-400 text-xs font-semibold">
              <div className="text-left">Paper Code: <span className="font-mono">{exam.code}</span></div>
              <div className="text-center">Time Allowed: {exam.timeAllowed}</div>
              <div className="text-right">Max Marks: {exam.maxMarks}</div>
            </div>
          </div>

          {/* Roll No Entry Box */}
          <div className="flex items-center justify-between border border-black p-2.5 rounded text-xs mb-6 bg-gray-50/50 print:bg-transparent">
            <div>
              <span className="font-bold">Candidate Name:</span> Muhammad Hamdan
            </div>
            <div>
              <span className="font-bold">Admission No:</span> ADM-5672
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold">Roll No:</span>
              <div className="flex border border-black divide-x divide-black font-mono">
                <span className="px-2 py-0.5 font-bold">1</span>
                <span className="px-2 py-0.5 font-bold">2</span>
              </div>
            </div>
          </div>

          {/* SECTION A: MCQs */}
          <div className="mb-6">
            <div className="flex items-center justify-between border-b border-black pb-1 mb-3">
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Section – A (Multiple Choice Questions)
              </h3>
              <span className="text-xs font-bold font-mono">Marks: 15 (1 Mark Each)</span>
            </div>
            <p className="text-xs italic text-gray-700 mb-3">
              Note: Select the correct answer. Cutting, overwriting, or multiple options will result in zero credit.
            </p>

            <div className="space-y-3 text-xs">
              {exam.mcqs.map((mcq, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="font-medium">
                    <span className="font-bold mr-1.5">Q{idx + 1}.</span>
                    {mcq.q}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4 text-gray-800">
                    <div>(A) {mcq.a}</div>
                    <div>(B) {mcq.b}</div>
                    <div>(C) {mcq.c}</div>
                    <div>(D) {mcq.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION B: Short Questions */}
          <div className="mb-6 pt-4 border-t-2 border-black">
            <div className="flex items-center justify-between border-b border-black pb-1 mb-3">
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Section – B (Short Structured Questions)
              </h3>
              <span className="text-xs font-bold font-mono">Marks: 36 (Attempt Any 6 × 6 Marks)</span>
            </div>
            <p className="text-xs italic text-gray-700 mb-3">
              Note: Provide clear step-by-step solutions, formulas, and brief explanations.
            </p>

            <div className="space-y-3.5 text-xs">
              {exam.shortQuestions.map((sq, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4">
                  <p className="leading-relaxed">
                    <span className="font-bold mr-1.5">Q{idx + 2}.</span>
                    {sq.q}
                  </p>
                  <span className="font-mono font-bold text-gray-700 shrink-0">({sq.marks} M)</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION C: Long Questions */}
          <div className="pt-4 border-t-2 border-black">
            <div className="flex items-center justify-between border-b border-black pb-1 mb-3">
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Section – C (Descriptive / Theoretical Problems)
              </h3>
              <span className="text-xs font-bold font-mono">Marks: 24 (Attempt Any 2 × 12 Marks)</span>
            </div>
            <p className="text-xs italic text-gray-700 mb-3">
              Note: Draw neat, labeled diagrams where necessary. Show all working clearly.
            </p>

            <div className="space-y-4 text-xs">
              {exam.longQuestions.map((lq, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4">
                  <p className="leading-relaxed">
                    <span className="font-bold mr-1.5">Q{idx + 8}.</span>
                    {lq.q}
                  </p>
                  <span className="font-mono font-bold text-gray-700 shrink-0">({lq.marks} M)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Signature Box */}
          <div className="mt-12 pt-6 border-t border-gray-400 grid grid-cols-2 text-center text-[11px] font-medium text-gray-600">
            <div>
              <div className="border-t border-black w-40 mx-auto pt-1">Senior Subject Examiner</div>
            </div>
            <div>
              <div className="border-t border-black w-40 mx-auto pt-1">Controller of Examinations</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
