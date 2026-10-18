'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShieldCheck, 
  Search, 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ChevronDown 
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function PortalJumper() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const portals = [
    {
      name: 'Campus Admin Desk',
      badge: 'Operations',
      path: '/admin/dashboard',
      icon: '🏢',
      desc: 'Admissions, fee collection & daily logs',
    },
    {
      name: 'Faculty & Staff Workspace',
      badge: 'Academics',
      path: '/staff/homework',
      icon: '📚',
      desc: 'Homework, grading & staff leaves',
    },
    {
      name: 'Student Academic Portal',
      badge: 'Student View',
      path: '/student/dashboard',
      icon: '🎓',
      desc: 'View student dossier, past papers & challans',
    },
    {
      name: 'Master Gateway Landing',
      badge: 'Root',
      path: '/',
      icon: '🏛️',
      desc: 'Main school gateway 4-portal screen',
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50 active:scale-95 transition"
      >
        <span>Portal Jumper</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black/5 border border-neutral-200 divide-y divide-neutral-100 z-[99999] focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2.5 bg-neutral-50 rounded-t-xl border-b border-neutral-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Executive Impersonation Switcher
            </p>
            <p className="text-[11px] text-neutral-400">Switch context with Supreme Admin authority</p>
          </div>

          <div className="p-1.5 space-y-1">
            {portals.map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(p.path);
                }}
                className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-100 transition cursor-pointer group"
              >
                <span className="text-base mt-0.5">{p.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 group-hover:text-black">
                      {p.name}
                    </span>
                    <span className="text-[10px] bg-neutral-200/70 text-neutral-700 px-1.5 py-0.5 rounded font-medium">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PrincipalCommandBar() {
  return (
    <div className="flex flex-1 items-center justify-between gap-4 px-2 relative z-50">
      <div className="hidden lg:flex items-center gap-2">
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1.5 font-semibold py-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Institutional Supreme Authority (Principal)
        </Badge>
      </div>
      
      <div className="flex-1 max-w-xl mx-auto flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Universal Search (Students, Staff, Challans)..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          />
        </div>
      </div>
      
      <div className="flex items-center">
        <PortalJumper />
      </div>
    </div>
  )
}
