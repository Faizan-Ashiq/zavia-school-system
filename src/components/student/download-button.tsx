'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle2 } from 'lucide-react'

interface DownloadButtonProps {
  filename: string
  title: string
  subject: string
  fileType?: 'Worksheet' | 'Past Paper' | 'Notes'
  className?: string
  size?: 'default' | 'sm' | 'xs'
}

export function DownloadButton({
  filename,
  title,
  subject,
  fileType = 'Worksheet',
  className = '',
  size = 'sm',
}: DownloadButtonProps) {
  const [downloaded, setDownloaded] = useState(false)

  function handleDownload() {
    const content = `========================================================
THE SCHOOL SYSTEM - ACADEMIC PORTAL
Subject: ${subject}
Document: ${title} (${fileType})
File: ${filename}
Class: Class 9 (Matric) - Academic Session 2025-2026
========================================================

INSTRUCTIONS & OVERVIEW:
1. Review the conceptual problems and questions listed below.
2. Complete all assigned exercises in your academic workbook.
3. For past papers, solve under standard timed examination conditions (3 Hours).

[SECTION A - OBJECTIVE & CORE CONCEPTS]
- Review key definitions, formulas, and terminology from the curriculum.
- Solve the standard practice equations and illustrative questions.

[SECTION B - DETAILED EXERCISE / SUBJECTIVE PROBLEMS]
- Problem Set 1: Theoretical foundation and derivation.
- Problem Set 2: Comprehensive problem-solving and numerical calculations.

Issued by: Academic Department, The School System
Status: Official Student Resource
Downloaded: ${new Date().toLocaleString()}
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.txt') || filename.endsWith('.pdf') ? filename : `${filename}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <Button
      variant={downloaded ? 'secondary' : 'outline'}
      size={size}
      onClick={handleDownload}
      className={`cursor-pointer transition-all ${className}`}
    >
      {downloaded ? (
        <>
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
          Downloaded
        </>
      ) : (
        <>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download {fileType === 'Past Paper' ? 'Paper' : 'Worksheet'}
        </>
      )}
    </Button>
  )
}
