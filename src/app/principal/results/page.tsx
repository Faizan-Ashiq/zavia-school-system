import { BarChart3, TrendingUp, TrendingDown, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AcademicResultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Academic Performance</h2>
          <p className="text-sm text-muted-foreground">
            Institutional overview of exam results, average scores, and performance trends.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Overall Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">76.4%</div>
            <p className="text-xs text-slate-500 mt-1">Mid-Term Exams 2026</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">92.1%</div>
            <p className="text-xs text-emerald-600 mt-1">+2.4% from last term</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">At-Risk Students</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">112</div>
            <p className="text-xs text-slate-500 mt-1">Scoring below 40%</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Top Performing Class</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Class 10-A</div>
            <p className="text-xs text-slate-500 mt-1">88.5% Average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class-wise Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-slate-50/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Class / Section</th>
                  <th className="px-4 py-3 font-medium">Total Students</th>
                  <th className="px-4 py-3 font-medium">Average Score</th>
                  <th className="px-4 py-3 font-medium">Pass Rate</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { class: 'Class 10-A', total: 35, avg: '88.5%', pass: '100%', status: 'EXCELLENT' },
                  { class: 'Class 9-B', total: 42, avg: '72.1%', pass: '88%', status: 'GOOD' },
                  { class: 'Class 8-C', total: 38, avg: '58.4%', pass: '65%', status: 'NEEDS ATTENTION' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium">{row.class}</td>
                    <td className="px-4 py-3">{row.total}</td>
                    <td className="px-4 py-3 font-mono">{row.avg}</td>
                    <td className="px-4 py-3 font-mono">{row.pass}</td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant="outline" 
                        className={
                          row.status === 'EXCELLENT' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                          row.status === 'GOOD' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                          'border-rose-200 text-rose-700 bg-rose-50'
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
