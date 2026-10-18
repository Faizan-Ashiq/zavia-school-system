import Link from 'next/link'
import {
  MessageCircle,
  Video,
  Mail,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  Share2,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Globe,
  Headphones,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function StudentSocialPage() {
  const adminClient = createAdminClient()

  // Gracefully fetch school branding/settings if table exists
  let settings: any = null
  try {
    const { data } = await adminClient.from('school_settings').select('*').limit(1).maybeSingle()
    settings = data
  } catch {
    // Fallback to institutional defaults
  }

  const schoolName = settings?.school_name ?? 'Zavia School System'
  const whatsappNumber = settings?.whatsapp_number ?? '+92 301 4717700'
  const whatsappClean = whatsappNumber.replace(/[^0-9]/g, '') || '923014717700'
  const officialEmail = settings?.email ?? 'zaviaschool2015@gmail.com'
  const officialPhone = settings?.phone ?? '03014717700'
  const campusAddress = settings?.address ?? 'Zavia School System Campus'
  const youtubeUrl = settings?.youtube_url ?? 'https://www.youtube.com'

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Social &amp; Official Channels</h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
              Verified Official Hub
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect directly with {schoolName} administration, academic helpdesks, and live media feeds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Academic Session 2025–2026
          </Badge>
        </div>
      </div>

      {/* Main Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Official WhatsApp Support */}
        <Card className="shadow-xs border hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Direct WhatsApp Helpdesk
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Official Student &amp; Parent Assistance Line
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white text-[11px] font-semibold">
                Fast Response
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1 text-xs flex-1 flex flex-col justify-between">
            <p className="text-muted-foreground leading-relaxed">
              Connect directly with the campus administration office for instant inquiries regarding
              fee challan reconciliation, syllabus updates, exam dates, and transport queries.
            </p>

            <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-900">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Instant fee voucher payment confirmation</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Dedicated student support team online Mon–Sat</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 pt-1">
                <span>WhatsApp: {whatsappNumber}</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs font-semibold gap-2 h-9'
                )}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-80" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Official YouTube Channel */}
        <Card className="shadow-xs border hover:border-red-500/50 hover:shadow-md transition-all group flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Video Lectures &amp; Events
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Official Academy YouTube Broadcasts
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-[11px] font-semibold">
                Curriculum Videos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1 text-xs flex-1 flex flex-col justify-between">
            <p className="text-muted-foreground leading-relaxed">
              Watch recorded classroom lectures, concept review sessions for Matric board exams,
              annual sports galas, science exhibitions, and speech contest broadcasts.
            </p>

            <div className="space-y-1.5 p-3 rounded-lg bg-red-50/50 border border-red-100 text-red-900">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span>Chapter-by-chapter Math &amp; Physics solved guides</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span>Annual prize distribution and convocation streams</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-red-700 pt-1">
                <span>Channel: @ZaviaSchoolSystemOfficial</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'w-full bg-red-600 hover:bg-red-500 text-white shadow-xs font-semibold gap-2 h-9'
                )}
              >
                <Video className="h-4 w-4" />
                <span>Visit YouTube Channel</span>
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-80" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Official Email (Admissions & Academic Office) */}
        <Card className="shadow-xs border hover:border-sky-500/50 hover:shadow-md transition-all group flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Academic &amp; Admissions Office
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Formal Correspondence &amp; Document Inquiries
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-sky-700 border-sky-300 bg-sky-50 text-[11px] font-semibold">
                Official Records
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1 text-xs flex-1 flex flex-col justify-between">
            <p className="text-muted-foreground leading-relaxed">
              Send formal inquiries, character certificate requests, verified transcript issuance,
              or long-term medical leave applications directly to the Principal&apos;s secretariat.
            </p>

            <div className="space-y-1.5 p-3 rounded-lg bg-sky-50/50 border border-sky-100 text-sky-900">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span>Formal certificates, transcripts, and migration letters</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span>Official email: {officialEmail}</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`mailto:${officialEmail}?subject=Student%20Portal%20Inquiry%20-%20Zavia%20School%20System`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'w-full bg-sky-600 hover:bg-sky-500 text-white shadow-xs font-semibold gap-2 h-9'
                )}
              >
                <Mail className="h-4 w-4" />
                <span>Send Official Email</span>
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-80" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Campus Helpdesk & Address */}
        <Card className="shadow-xs border hover:border-indigo-500/50 hover:shadow-md transition-all group flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <PhoneCall className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Campus Helpdesk &amp; Visiting Hours
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    In-Person Assistance &amp; Accounts Desk
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-indigo-700 border-indigo-300 bg-indigo-50 text-[11px] font-semibold">
                On Campus
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{campusAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>Mon – Fri: 08:00 AM – 02:00 PM | Sat: 08:00 AM – 12:30 PM</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-mono">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>Landline: {officialPhone}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-900">
              <span className="font-semibold block mb-0.5">Accounts &amp; Fee Submission Counter:</span>
              <span className="text-[11px]">Located at Main Academic Block, Ground Floor Window #2</span>
            </div>

            <div className="pt-2">
              <a
                href={`tel:${officialPhone.replace(/[^0-9+]/g, '')}`}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs font-semibold gap-2 h-9'
                )}
              >
                <Phone className="h-4 w-4" />
                <span>Call Campus Helpdesk</span>
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-80" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Channels Notice */}
      <Card className="shadow-xs border bg-muted/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary shrink-0" />
            <span>
              Follow official announcements on the student notice board and digital notification channels.
            </span>
          </div>
          <Badge variant="secondary" className="text-[11px]">
            Zavia School System Central Portal
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
