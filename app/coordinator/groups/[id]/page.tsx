'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Faculty {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  email: string;
}

interface LabGroup {
  _id: string;
  name: string;
  className: string;
  semester: string;
  academicYear: string;
  facultyId?: string;
  facultyName?: string;
  students?: string[];
  studentCount?: number;
}

export default function CoordinatorGroupDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState<LabGroup | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    name: '',
    className: '',
    semester: '',
    academicYear: '',
    facultyId: '',
  });
  const [importStatus, setImportStatus] = useState<{ fileName: string; matched: number; unmatched: number } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      const [groupRes, facultyRes, studentsRes] = await Promise.all([
        fetch(`/api/lab-groups/${groupId}`),
        fetch('/api/coordinator/faculty'),
        fetch('/api/coordinator/students'),
      ]);

      const [groupData, facultyData, studentsData] = await Promise.all([
        groupRes.json(),
        facultyRes.json(),
        studentsRes.json(),
      ]);

      if (groupData.success) {
        const currentGroup = groupData.data;
        setGroup(currentGroup);
        setFormData({
          name: currentGroup.name || '',
          className: currentGroup.className || '',
          semester: currentGroup.semester || '',
          academicYear: currentGroup.academicYear || '',
          facultyId: currentGroup.facultyId || '',
        });
        setSelectedStudents((currentGroup.students || []).map((studentId: any) => studentId.toString()));
      }

      if (facultyData.success) {
        setFaculty((facultyData.data || []).map((item: any) => ({
          _id: item._id?.toString() || '',
          firstName: item.firstName || '',
          lastName: item.lastName || '',
          email: item.email || '',
        })));
      }

      if (studentsData.success) {
        setStudents((studentsData.data || []).map((item: any) => ({
          _id: item._id?.toString() || '',
          firstName: item.firstName || '',
          lastName: item.lastName || '',
          enrollmentNumber: item.enrollmentNumber || '',
          email: item.email || '',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch lab group detail data', error);
      setErrors({ general: 'Failed to load group data' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      `${student.firstName} ${student.lastName} ${student.enrollmentNumber} ${student.email}`.toLowerCase().includes(query)
    );
  }, [search, students]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleStudentImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setErrors({ general: 'The uploaded file does not contain any sheets' });
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      const normalize = (value: string) => String(value || '').trim().toLowerCase();
      const matchedStudentIds = new Set<string>();
      let unmatched = 0;

      rows.forEach((row) => {
        const rowEnrollment = normalize(row.enrollmentNumber || row.enrollment || row.enrollment_number || row.rollNumber || row.roll_no);
        const rowEmail = normalize(row.email || row.mail);
        const rowId = normalize(row.studentId || row._id || row.id);
        const rowFullName = normalize(row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim());

        const matchedStudent = students.find((student) => {
          const studentEnrollment = normalize(student.enrollmentNumber);
          const studentEmail = normalize(student.email);
          const studentId = normalize(student._id);
          const studentFullName = normalize(`${student.firstName} ${student.lastName}`.trim());

          return (
            (rowEnrollment && rowEnrollment === studentEnrollment) ||
            (rowEmail && rowEmail === studentEmail) ||
            (rowId && rowId === studentId) ||
            (rowFullName && rowFullName === studentFullName)
          );
        });

        if (matchedStudent) {
          matchedStudentIds.add(matchedStudent._id);
        } else {
          unmatched += 1;
        }
      });

      const selectedIds = Array.from(matchedStudentIds);
      setSelectedStudents(selectedIds);
      setImportStatus({ fileName: file.name, matched: selectedIds.length, unmatched });
      setErrors(prev => {
        const next = { ...prev };
        delete next.general;
        return next;
      });
    } catch (error) {
      console.error('Student import failed:', error);
      setErrors({ general: 'Failed to import students from the file' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(`/api/lab-groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          students: selectedStudents,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
      } else if (data.error?.fields) {
        setErrors(data.error.fields);
      } else {
        setErrors({ general: data.error?.message || 'Failed to update group' });
      }
    } catch (error) {
      setErrors({ general: 'Failed to update group' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/coordinator/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">LabSync</Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/coordinator/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/coordinator/groups" className="text-[var(--accent)] font-medium">Lab Groups</Link>
                <Link href="/coordinator/faculty" className="text-[var(--ink3)] hover:text-[var(--ink)]">Faculty</Link>
                <Link href="/coordinator/reports" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reports</Link>
              </nav>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href="/coordinator/groups" className="text-[var(--accent)] hover:text-[var(--accent2)] mb-4 inline-block">← Back to Lab Groups</Link>
            <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Manage Lab Group</h1>
            <p className="text-[var(--ink3)]">Update faculty, students, and group details in one place</p>
          </div>
          <div className="rounded-lg border border-[var(--paper3)] bg-white px-4 py-3 text-sm text-[var(--ink3)]">
            <div><span className="text-[var(--ink)] font-medium">Faculty:</span> {group?.facultyName || 'Not assigned'}</div>
            <div><span className="text-[var(--ink)] font-medium">Students:</span> {group?.studentCount || selectedStudents.length}</div>
          </div>
        </div>

        {errors.general && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{errors.general}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[var(--paper3)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--ink)] heading">Group Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Group Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Class *</label>
                <input name="className" value={formData.className} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Semester *</label>
                <input name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Academic Year *</label>
                <input name="academicYear" value={formData.academicYear} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Faculty *</label>
              <select name="facultyId" value={formData.facultyId} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg">
                <option value="">Select faculty</option>
                {faculty.map(member => (
                  <option key={member._id} value={member._id}>{member.firstName} {member.lastName} ({member.email})</option>
                ))}
              </select>
              {errors.facultyId && <p className="mt-1 text-sm text-red-600">{errors.facultyId}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block text-sm font-medium text-[var(--ink)]">Students</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleStudentImport} className="hidden" id="student-import" />
                  <label htmlFor="student-import" className="px-3 py-1.5 text-xs bg-white border border-[var(--paper3)] rounded-lg text-[var(--ink)] hover:border-[var(--accent)] cursor-pointer">Import CSV / Excel</label>
                </div>
              </div>

              {importStatus && (
                <div className="mb-3 rounded-lg border border-[var(--paper3)] bg-[var(--paper)] p-3 text-xs text-[var(--ink3)]">
                  Imported <span className="font-medium text-[var(--ink)]">{importStatus.fileName}</span>. Matched {importStatus.matched} student(s), {importStatus.unmatched} row(s) did not match.
                </div>
              )}

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="mb-3 w-full px-4 py-2 border border-[var(--paper3)] rounded-lg"
              />

              <div className="max-h-72 overflow-auto rounded-lg border border-[var(--paper3)] p-3 space-y-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-[var(--ink3)]">No students found</p>
                ) : filteredStudents.map(student => (
                  <label key={student._id} className="flex items-start gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={selectedStudents.includes(student._id)} onChange={() => toggleStudent(student._id)} className="mt-1 h-4 w-4" />
                    <div>
                      <div className="text-[var(--ink)] font-medium">{student.firstName} {student.lastName}</div>
                      <div className="text-[var(--ink3)]">{student.enrollmentNumber || 'No enrollment number'} • {student.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Group'}
            </button>
          </form>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--ink)] heading">Current Summary</h2>
            <div className="rounded-lg border border-[var(--paper3)] bg-[var(--paper)] p-4 text-sm text-[var(--ink3)] space-y-1">
              <p><span className="text-[var(--ink)] font-medium">Group:</span> {group?.name || formData.name || 'Unnamed'}</p>
              <p><span className="text-[var(--ink)] font-medium">Semester:</span> {formData.semester || '—'}</p>
              <p><span className="text-[var(--ink)] font-medium">Year:</span> {formData.academicYear || '—'}</p>
              <p><span className="text-[var(--ink)] font-medium">Faculty:</span> {faculty.find(item => item._id === formData.facultyId)?.firstName ? `${faculty.find(item => item._id === formData.facultyId)?.firstName} ${faculty.find(item => item._id === formData.facultyId)?.lastName}` : 'Not assigned'}</p>
              <p><span className="text-[var(--ink)] font-medium">Selected Students:</span> {selectedStudents.length}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
