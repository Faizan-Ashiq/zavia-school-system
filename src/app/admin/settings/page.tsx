'use client'

import { useState } from 'react'
import { Save, Building, Phone, Mail, MapPin, Building2, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    // Simulating server action to save settings
    setTimeout(() => {
      setSaving(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }, 800)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campus Settings</h1>
        <p className="text-muted-foreground mt-1.5">
          Manage your school's global branding, contact details, and financial accounts.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                General Branding
              </CardTitle>
              <CardDescription>
                This information appears on public portals, challans, and printed reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input id="schoolName" defaultValue="Zavia School System" required />

              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Contact Email
                  </Label>
                  <Input id="contactEmail" type="email" defaultValue="zaviaschool2015@gmail.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Contact Phone
                  </Label>
                  <Input id="contactPhone" defaultValue="03014717700" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusAddress" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Campus Address
                </Label>
                <Input id="campusAddress" defaultValue="Zavia School System Campus" required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Financial Settings
              </CardTitle>
              <CardDescription>
                Bank account details used for fee challan generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" defaultValue="Meezan Bank Limited" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountTitle">Account Title</Label>
                  <Input id="accountTitle" defaultValue="Zavia School System Fee Collection" required />

                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban" className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Account IBAN
                </Label>
                <Input id="iban" defaultValue="PK90 MEZN 0001 2345 6789 01" className="font-mono" required />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm font-medium">
                {showToast && (
                  <span className="text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                    Settings saved successfully.
                  </span>
                )}
              </div>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
