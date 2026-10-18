'use client'

import React, { useState } from 'react'
import { Wallet, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ConcessionItem {
  id: number
  name: string
  class: string
  type: string
  amount: string
  requestBy: string
}

export function PendingConcessionsCard({ initialConcessions = [] }: { initialConcessions?: ConcessionItem[] }) {
  const [concessions, setConcessions] = useState<ConcessionItem[]>(initialConcessions)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleConcessionApprove = (id: number, name: string) => {
    setConcessions((prev) => prev.filter((c) => c.id !== id))
    showToast(`Fee concession approved for ${name}`)
  }

  const handleConcessionReject = (id: number) => {
    setConcessions((prev) => prev.filter((c) => c.id !== id))
    showToast('Concession request rejected')
  }

  return (
    <>
      {toast && (
        <div className="fixed top-5 right-5 z-[999999] bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          ✅ {toast}
        </div>
      )}

      <Card className="shadow-xs border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Fee Concession Requests</CardTitle>
            </div>
            <Badge variant={concessions.length > 0 ? 'secondary' : 'outline'} className="text-xs">
              {concessions.length} Requests
            </Badge>
          </div>
          <CardDescription>Review and approve discount/scholarship requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {concessions.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8 border rounded-lg border-dashed bg-slate-50/50">
                No active fee concession requests.
              </div>
            ) : (
              concessions.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-slate-50/60 hover:bg-slate-100/80 transition-colors gap-3"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-slate-900">
                      {req.name} <span className="text-xs text-slate-500 font-normal">({req.class})</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700">
                        {req.type}
                      </Badge>
                      <span className="text-xs font-bold text-slate-700">{req.amount}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Requested by: {req.requestBy}</p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      onClick={() => handleConcessionReject(req.id)}
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleConcessionApprove(req.id, req.name)}
                      size="sm"
                      className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer gap-1 shadow-2xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
