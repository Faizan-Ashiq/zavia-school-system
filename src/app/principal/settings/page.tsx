'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveSchoolSettings } from '@/app/actions/settings'

export default function PrincipalSettingsPage() {
  const [isPending, startTransition] = useTransition()

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveSchoolSettings(formData)
      if (result.success) {
        alert("Settings saved successfully!")
      } else {
        alert(result.error || "Failed to save settings")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Master Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500">Configure global institutional settings and contact information.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Institution Title</label>
            <input 
              name="title"
              type="text" 
              defaultValue="Zavia School System"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Official Contact Email</label>
            <input 
              name="email"
              type="email" 
              defaultValue="zaviaschool2015@gmail.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Official WhatsApp Helpline</label>
            <input 
              name="whatsapp"
              type="text" 
              defaultValue="+92 301 4717700"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold text-slate-800 mb-4">Bank Details for Fee Collection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                <input 
                  name="bankName"
                  type="text" 
                  defaultValue="Meezan Bank Limited"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account IBAN</label>
                <input 
                  name="iban"
                  type="text" 
                  defaultValue="PK90 MEZN 0001 2345 6789 01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  )
}
