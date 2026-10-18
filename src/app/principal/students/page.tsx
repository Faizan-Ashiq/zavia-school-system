'use client';

import React, { useState } from 'react';

interface Student {
  id: string;
  name: string;
  className: string;
  section: string;
  rollNo: string;
  regCode: string;
  feePackage: string;
  status: 'Active' | 'Defaulter';
}

const fullSchoolData: Student[] = [
  { id: '1', name: 'Zayan Ali', className: 'Nursery', section: 'Rose', rollNo: 'N-01', regCode: 'REG-2026-N01', feePackage: 'Rs. 3,500', status: 'Active' },
  { id: '2', name: 'Areeba Fatima', className: 'Prep', section: 'Tulip', rollNo: 'P-05', regCode: 'REG-2026-P05', feePackage: 'Rs. 3,800', status: 'Active' },
  { id: '3', name: 'Abdullah Khan', className: 'Class 1', section: 'Section A', rollNo: 'C1-12', regCode: 'REG-2026-112', feePackage: 'Rs. 4,000', status: 'Active' },
  { id: '4', name: 'Hania Imran', className: 'Class 2', section: 'Section B', rollNo: 'C2-08', regCode: 'REG-2026-208', feePackage: 'Rs. 4,000', status: 'Active' },
  { id: '5', name: 'Bilal Hassan', className: 'Class 3', section: 'Section A', rollNo: 'C3-15', regCode: 'REG-2026-315', feePackage: 'Rs. 4,200', status: 'Defaulter' },
  { id: '6', name: 'Maryam Noor', className: 'Class 4', section: 'Section A', rollNo: 'C4-04', regCode: 'REG-2026-404', feePackage: 'Rs. 4,200', status: 'Active' },
  { id: '7', name: 'Usman Ghani', className: 'Class 5', section: 'Section B', rollNo: 'C5-19', regCode: 'REG-2026-519', feePackage: 'Rs. 4,500', status: 'Active' },
  { id: '8', name: 'Zainab Bibi', className: 'Class 6', section: 'Section A', rollNo: 'C6-22', regCode: 'REG-2026-622', feePackage: 'Rs. 4,500', status: 'Defaulter' },
  { id: '9', name: 'Hamza Tariq', className: 'Class 7', section: 'Section B', rollNo: 'C7-11', regCode: 'REG-2026-711', feePackage: 'Rs. 4,800', status: 'Active' },
  { id: '10', name: 'Ayesha Malik', className: 'Class 8', section: 'Section A', rollNo: 'C8-03', regCode: 'REG-2026-803', feePackage: 'Rs. 4,800', status: 'Active' },
  { id: '11', name: 'Muhammad Hamdan', className: 'Class 9', section: 'Section A', rollNo: 'C9-101', regCode: 'REG-2026-901', feePackage: 'Rs. 5,000', status: 'Active' },
  { id: '12', name: 'Ali Raza', className: 'Class 9', section: 'Section B', rollNo: 'C9-102', regCode: 'REG-2026-902', feePackage: 'Rs. 5,000', status: 'Active' },
  { id: '13', name: 'Fatima Zahra', className: 'Class 10', section: 'Section A', rollNo: 'C10-201', regCode: 'REG-2026-101', feePackage: 'Rs. 5,500', status: 'Active' },
  { id: '14', name: 'Zaid Khan', className: 'Class 10', section: 'Section B', rollNo: 'C10-202', regCode: 'REG-2026-102', feePackage: 'Rs. 5,500', status: 'Defaulter' }
];

export default function PrincipalStudentsPage() {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filtered = fullSchoolData.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      st.regCode.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'all' || st.className === selectedClass;
    const matchesStatus = selectedStatus === 'all' || st.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="relative z-10 pointer-events-auto p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Student Registry & Academics</h1>
          <p className="text-xs text-neutral-500">Comprehensive student records from Nursery to Class 10</p>
        </div>
        <div className="text-xs font-semibold bg-neutral-100 text-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200">
          Showing {filtered.length} of {fullSchoolData.length} Total Enrolled Students
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <input
          type="text"
          placeholder="Search student name, roll number, or reg code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-xs w-72 outline-none focus:border-black bg-white"
        />

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-xs bg-white cursor-pointer outline-none focus:border-black"
        >
          <option value="all">All Classes (Nursery to 10)</option>
          <option value="Nursery">Nursery</option>
          <option value="Prep">Prep</option>
          <option value="Class 1">Class 1</option>
          <option value="Class 2">Class 2</option>
          <option value="Class 3">Class 3</option>
          <option value="Class 4">Class 4</option>
          <option value="Class 5">Class 5</option>
          <option value="Class 6">Class 6</option>
          <option value="Class 7">Class 7</option>
          <option value="Class 8">Class 8</option>
          <option value="Class 9">Class 9</option>
          <option value="Class 10">Class 10</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-xs bg-white cursor-pointer outline-none focus:border-black"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Defaulter">Fee Defaulter</option>
        </select>

        {(search || selectedClass !== 'all' || selectedStatus !== 'all') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSelectedClass('all'); setSelectedStatus('all'); }}
            className="cursor-pointer text-xs text-red-600 hover:underline px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 uppercase font-semibold text-neutral-600">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Class / Section</th>
                <th className="p-3.5">Roll No</th>
                <th className="p-3.5">Reg Code</th>
                <th className="p-3.5">Monthly Fee</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-400">
                    No students match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-neutral-50/80 transition">
                    <td className="p-3.5 font-bold text-neutral-900">{st.name}</td>
                    <td className="p-3.5 font-medium">{st.className} - {st.section}</td>
                    <td className="p-3.5 font-mono text-neutral-700">{st.rollNo}</td>
                    <td className="p-3.5 font-mono text-neutral-500">{st.regCode}</td>
                    <td className="p-3.5 font-semibold text-neutral-800">{st.feePackage}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        st.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => window.open(`/student/dashboard?viewAs=${st.id}`, '_blank')}
                        className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white font-semibold px-2.5 py-1 rounded-lg transition text-[11px]"
                        title="Impersonate & View Portal as Student"
                      >
                        👁️ View Portal
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(st)}
                        className="cursor-pointer border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold px-2.5 py-1 rounded-lg transition text-[11px]"
                      >
                        Dossier
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(`/print/challan/${st.id}`, '_blank')}
                        className="cursor-pointer bg-neutral-900 hover:bg-black text-white font-semibold px-2.5 py-1 rounded-lg transition text-[11px]"
                      >
                        Challan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dossier Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-300">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-neutral-900">Official Student Dossier</h3>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="cursor-pointer text-neutral-400 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-neutral-800">
              <div className="flex justify-between py-1 border-b"><span>Name:</span><strong>{selectedStudent.name}</strong></div>
              <div className="flex justify-between py-1 border-b"><span>Class & Section:</span><strong>{selectedStudent.className} ({selectedStudent.section})</strong></div>
              <div className="flex justify-between py-1 border-b"><span>Roll Number:</span><strong className="font-mono">{selectedStudent.rollNo}</strong></div>
              <div className="flex justify-between py-1 border-b"><span>Registration Code:</span><strong className="font-mono">{selectedStudent.regCode}</strong></div>
              <div className="flex justify-between py-1 border-b"><span>Monthly Tuition Fee:</span><strong>{selectedStudent.feePackage}</strong></div>
              <div className="flex justify-between py-1"><span>Current Standing:</span><strong className={selectedStudent.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}>{selectedStudent.status}</strong></div>
            </div>
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="cursor-pointer bg-neutral-950 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}