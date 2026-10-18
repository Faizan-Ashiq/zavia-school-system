import { Wallet, TrendingUp, AlertCircle, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FinanceHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Institutional Financials</h2>
          <p className="text-sm text-muted-foreground">
            Live analytics, total collections, and banking deposit tracking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Collections</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Rs. 12.4M</div>
            <p className="text-xs text-slate-500 mt-1">For Academic Year 2026</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Bank Deposits</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Rs. 11.2M</div>
            <p className="text-xs text-slate-500 mt-1">Cleared in HBL Acct</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Vouchers</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">Rs. 2.1M</div>
            <p className="text-xs text-slate-500 mt-1">115 Overdue Challans</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Revenue Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">+14.2%</div>
            <p className="text-xs text-slate-500 mt-1">Vs. Previous Term</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent High-Value Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b bg-slate-50/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Challan ID</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date Cleared</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'CHL-2026-901', cat: 'Annual Fee Bundle', amount: 'Rs. 145,000', date: '22 Oct 2026', status: 'CLEARED' },
                  { id: 'CHL-2026-882', cat: 'Transport & Tuition', amount: 'Rs. 42,500', date: '21 Oct 2026', status: 'CLEARED' },
                  { id: 'CHL-2026-805', cat: 'Late Admission Fee', amount: 'Rs. 75,000', date: '19 Oct 2026', status: 'CLEARED' },
                ].map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{tx.id}</td>
                    <td className="px-4 py-3 font-medium">{tx.cat}</td>
                    <td className="px-4 py-3">{tx.amount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                        {tx.status}
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
