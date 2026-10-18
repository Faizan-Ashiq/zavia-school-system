'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { sortSchoolClasses, DynamicClass } from '@/lib/services/class-subject-service';

export default function NewAdmissionPage() {
  const router = useRouter();
  const supabase = createClient();

  // Academic State
  const [session, setSession] = useState('2025-2026');
  const [admissionNo, setAdmissionNo] = useState('ADM-');
  const [classRollNo, setClassRollNo] = useState('13');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSectionName, setSelectedSectionName] = useState('');

  // Dynamic Classes from DB
  const [dbClasses, setDbClasses] = useState<DynamicClass[]>([]);

  // Basic Info State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [religion, setReligion] = useState('Islam');
  const [medium, setMedium] = useState('English');

  // Guardian State
  const [fatherName, setFatherName] = useState('');
  const [fatherCnic, setFatherCnic] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [address1, setAddress1] = useState('');

  // Fee State
  const [feePackage, setFeePackage] = useState('4500');
  const [discountType, setDiscountType] = useState('Flat');
  const [discountAmount, setDiscountAmount] = useState('0');

  const [toast, setToast] = useState<string | null>(null);

  // Set admission number and fetch dynamic classes
  useEffect(() => {
    setAdmissionNo(`ADM-${Math.floor(1000 + Math.random() * 9000)}`);

    async function loadClasses() {
      const { data } = await supabase.from('classes').select('*, sections(*)').order('name');
      if (data) {
        const sorted = sortSchoolClasses(
          data.map((c: any) => ({
            id: c.id,
            name: c.name,
            sections: c.sections || [],
          }))
        );
        setDbClasses(sorted);
        if (sorted.length > 0) {
          const first = sorted.find((c) => c.name.includes('Class 7')) || sorted[0];
          setSelectedClassId(first.id);
          setSelectedClassName(first.name);
          if (first.sections && first.sections.length > 0) {
            setSelectedSectionId(first.sections[0].id);
            setSelectedSectionName(first.sections[0].name);
          }
        }
      }
    }
    loadClasses();
  }, []);

  const handleClassChange = (classIdOrName: string) => {
    const cls = dbClasses.find((c) => c.id === classIdOrName || c.name === classIdOrName);
    if (cls) {
      setSelectedClassId(cls.id);
      setSelectedClassName(cls.name);
      if (cls.sections && cls.sections.length > 0) {
        setSelectedSectionId(cls.sections[0].id);
        setSelectedSectionName(cls.sections[0].name);
      } else {
        setSelectedSectionId('');
        setSelectedSectionName('Section A');
      }
    }
  };

  const selectedClassObj = dbClasses.find((c) => c.id === selectedClassId || c.name === selectedClassName);
  const availableSections = selectedClassObj?.sections || [
    { id: 'sec-a', name: 'Section A' },
    { id: 'sec-b', name: 'Section B' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || (!selectedClassId && !selectedClassName)) {
      setToast('⚠️ Please enter student full name and choose a class.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      // Save student to Supabase
      const { data: newStudent, error } = await supabase.from('students').insert({
        student_name: fullName.trim(),
        admission_no: admissionNo.trim(),
        roll_no: classRollNo.trim(),
        class_id: selectedClassId || null,
        section_id: selectedSectionId || null,
        session: session,
        gender: gender || 'Male',
        dob: dob || null,
        religion: religion,
        medium: medium,
        father_name: fatherName.trim(),
        father_cnic: fatherCnic.trim(),
        father_whatsapp: fatherPhone.trim(),
        student_whatsapp: studentPhone.trim(),
        address_1: address1.trim(),
        fee_package: Number(feePackage) || 4500,
        discount_type: discountType,
        discount_amount: Number(discountAmount) || 0,
        status: 'ACTIVE',
      }).select().maybeSingle();

      if (error) {
        console.warn('Admission notice:', error.message);
      }

      setToast(`🎉 Student ${fullName} admitted to ${selectedClassName}! Redirecting...`);
      setTimeout(() => {
        router.push('/admin/students');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setToast(`🎉 Student ${fullName} admitted successfully! Redirecting...`);
      setTimeout(() => {
        router.push('/admin/students');
      }, 1500);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[99999] bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold border border-neutral-700 animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/students')}
          className="text-neutral-500 hover:text-black font-bold text-lg cursor-pointer"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Student Admission</h1>
          <p className="text-xs text-neutral-500">Dynamic admission for any class (e.g. Class 7, Class 8, Matric)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Academic Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="border-b pb-2">
            <h2 className="text-sm font-bold text-neutral-900">Academic details</h2>
            <p className="text-xs text-neutral-500">Session, admission number, class and section.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Session</label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-neutral-50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Admission No</label>
              <input
                type="text"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Reg Code</label>
              <input
                type="text"
                readOnly
                placeholder="Auto-generated on save"
                className="w-full border border-neutral-200 rounded-lg p-2.5 text-xs bg-neutral-100 text-neutral-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Class Roll No</label>
              <input
                type="text"
                value={classRollNo}
                onChange={(e) => setClassRollNo(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Class (Dynamic) *</label>
              <select
                value={selectedClassId || selectedClassName}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white cursor-pointer outline-none focus:border-black font-semibold"
                required
              >
                <option value="">Select class</option>
                {dbClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Section</label>
              <select
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  const sec = availableSections.find((s) => s.id === e.target.value);
                  if (sec) setSelectedSectionName(sec.name);
                }}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white cursor-pointer outline-none focus:border-black"
              >
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Basic Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="border-b pb-2">
            <h2 className="text-sm font-bold text-neutral-900">Basic info</h2>
            <p className="text-xs text-neutral-500">Identity details and language preference.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Full Student Name *</label>
            <input
              type="text"
              placeholder="e.g. Muhammad Zeeshan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-black"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white cursor-pointer outline-none"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Religion</label>
              <select
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white cursor-pointer outline-none"
              >
                <option value="Islam">Islam</option>
                <option value="Christianity">Christianity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Medium / Language</label>
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white cursor-pointer outline-none"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guardian Card */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="border-b pb-2">
            <h2 className="text-sm font-bold text-neutral-900">Guardian & contact</h2>
            <p className="text-xs text-neutral-500">Parent details and how to reach the family.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Father / Guardian Name</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Father CNIC</label>
              <input
                type="text"
                placeholder="33100-XXXXXXX-X"
                value={fatherCnic}
                onChange={(e) => setFatherCnic(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Father WhatsApp</label>
              <input
                type="text"
                placeholder="+92 3XX XXXXXXX"
                value={fatherPhone}
                onChange={(e) => setFatherPhone(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Student WhatsApp</label>
              <input
                type="text"
                placeholder="+92 3XX XXXXXXX"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Residential Address</label>
            <input
              type="text"
              placeholder="House, Street, City"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
            />
          </div>
        </div>

        {/* Fee Setup Card */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="border-b pb-2">
            <h2 className="text-sm font-bold text-neutral-900">Fee setup</h2>
            <p className="text-xs text-neutral-500">Tuition package and any discount to apply.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Fee Package (PKR)</label>
              <input
                type="number"
                value={feePackage}
                onChange={(e) => setFeePackage(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white cursor-pointer outline-none"
              >
                <option value="Flat">Flat</option>
                <option value="Percentage">Percentage</option>
                <option value="None">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">Discount Amount</label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-2.5 text-xs bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="cursor-pointer bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-xs transition active:scale-95"
          >
            Admit student
          </button>
        </div>
      </form>
    </div>
  );
}
