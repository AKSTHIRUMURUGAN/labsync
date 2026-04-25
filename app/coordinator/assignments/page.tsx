'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
}

interface Assignment {
  _id: string;
  subjectName: string;
  labName: string;
  semester: string;
  className: string;
  studentSource?: 'manual' | 'external' | 'group';
  faculty?: Faculty;
  labGroup?: LabGroup;
  studentIds: string[];
}

export default function CoordinatorAssignmentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [labGroups, setLabGroups] = useState<LabGroup[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    labGroupId: '',
    facultyId: '',
    semester: '',
    className: '',
    studentSource: 'manual' as 'manual' | 'external' | 'group',
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<{
    fileName: string;
    matched: number;
    unmatched: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, facultyRes, studentsRes, labGroupsRes] = await Promise.all([
        fetch('/api/coordinator/assignments'),
        fetch('/api/coordinator/faculty'),
        fetch('/api/coordinator/students'),
        fetch('/api/lab-groups'),
      ]);

      const [assignmentsData, facultyData, studentsData, labGroupsData] = await Promise.all([
        assignmentsRes.json(),
        facultyRes.json(),
        studentsRes.json(),
        labGroupsRes.json(),
      ]);

      if (assignmentsData.success) setAssignments(assignmentsData.data || []);
      if (facultyData.success) setFaculty((facultyData.data || []).map((item: any) => ({
        _id: item._id?.toString() || '',
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        email: item.email || '',
      })));
      if (studentsData.success) setStudents((studentsData.data || []).map((item: any) => ({
        _id: item._id?.toString() || '',
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        enrollmentNumber: item.enrollmentNumber || '',
        email: item.email || '',
      })));
      if (labGroupsData.success) setLabGroups((labGroupsData.data || []).map((item: any) => ({
        _id: item._id?.toString() || '',
        name: item.name || '',
        className: item.className || '',
        semester: item.semester || '',
      })));
    } catch (error) {
      console.error('Failed to fetch coordinator assignment data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const response = await fetch('/api/coordinator/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studentIds: selectedStudents,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchData();
        setFormData({ labGroupId: '', facultyId: '', semester: '', className: '', studentSource: 'manual' });
        setSelectedStudents([]);
      } else if (data.error?.fields) {
        setErrors(data.error.fields);
      } else {
        setErrors({ general: data.error?.message || 'Failed to create assignment' });
      }
    } catch (error) {
      setErrors({ general: 'Failed to create assignment' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'labGroupId') {
      const selectedGroup = labGroups.find((group) => group._id === value);
      if (selectedGroup) {
        setFormData(prev => ({
          ...prev,
          semester: selectedGroup.semester,
          className: selectedGroup.className,
        }));
      }
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const resetImport = () => {
    setImportStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      if (rows.length === 0) {
        setErrors({ general: 'The uploaded file is empty' });
        return;
      }

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
      setFormData((prev) => ({ ...prev, studentSource: 'manual' }));
      setImportStatus({
        fileName: file.name,
        matched: selectedIds.length,
        unmatched,
      });

      if (selectedIds.length === 0) {
        setErrors({ general: 'No students from the file matched the current coordinator student list' });
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.general;
          return next;
        });
      }
    } catch (error) {
      console.error('Student import failed:', error);
      setErrors({ general: 'Failed to import students from the file' });
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
              <Link href="/coordinator/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/coordinator/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/coordinator/groups" className="text-[var(--ink3)] hover:text-[var(--ink)]">Lab Groups</Link>
                <Link href="/coordinator/assignments" className="text-[var(--accent)] font-medium">Assignments</Link>
                <Link href="/coordinator/reports" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reports</Link>
              </nav>
                  <Link href="/coordinator/groups" className="text-[var(--ink3)] hover:text-[var(--ink)]">Lab Groups</Link>
                  <Link href="/coordinator/reports" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reports</Link>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Faculty Assignments</h1>
          <p className="text-[var(--ink3)]">Map students, faculty, and lab groups by subject and semester</p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[var(--paper3)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--ink)] heading">Create Assignment</h2>
            <p className="text-sm text-[var(--ink3)]">Assign a faculty member to an existing lab group. Students can be added manually here or left to the external source later.</p>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Student Source *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${formData.studentSource === 'manual' ? 'border-[var(--accent)] bg-[var(--accent3)]' : 'border-[var(--paper3)]'}`}>
                  <input type="radio" name="studentSource" value="manual" checked={formData.studentSource === 'manual'} onChange={handleChange} />
                  <span className="text-sm text-[var(--ink)]">Manual entry</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${formData.studentSource === 'external' ? 'border-[var(--accent)] bg-[var(--accent3)]' : 'border-[var(--paper3)]'}`}>
                  <input type="radio" name="studentSource" value="external" checked={formData.studentSource === 'external'} onChange={handleChange} />
                  <span className="text-sm text-[var(--ink)]">External website import</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Lab Group *</label>
              <select name="labGroupId" value={formData.labGroupId} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg">
                <option value="">Select lab group</option>
                {labGroups.map(group => (
                  <option key={group._id} value={group._id}>{group.name} - {group.className} ({group.semester})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">Faculty *</label>
              <select name="facultyId" value={formData.facultyId} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg">
                <option value="">Select faculty</option>
                {faculty.map(member => (
                  <option key={member._id} value={member._id}>{member.firstName} {member.lastName} ({member.email})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Semester *</label>
                <input name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Class *</label>
                <input name="className" value={formData.className} onChange={handleChange} className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg" />
              </div>
            </div>

            {formData.labGroupId && (
              <div className="rounded-lg border border-[var(--paper3)] bg-[var(--paper)] p-4">
                {(() => {
                  const selectedGroup = labGroups.find((group) => group._id === formData.labGroupId);
                  return selectedGroup ? (
                    <div className="text-sm text-[var(--ink3)] space-y-1">
                      <p><span className="text-[var(--ink)] font-medium">Group:</span> {selectedGroup.name}</p>
                      <p><span className="text-[var(--ink)] font-medium">Semester:</span> {selectedGroup.semester}</p>
                      <p><span className="text-[var(--ink)] font-medium">Class:</span> {selectedGroup.className}</p>
                      <p>Students are managed inside the lab group.</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {formData.studentSource === 'manual' ? (
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">Students</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleStudentImport}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs bg-white border border-[var(--paper3)] rounded-lg text-[var(--ink)] hover:border-[var(--accent)]"
                    >
                      Import CSV / Excel
                    </button>
                    {(selectedStudents.length > 0 || importStatus) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudents([]);
                          resetImport();
                        }}
                        className="px-3 py-1.5 text-xs bg-white border border-[var(--paper3)] rounded-lg text-[var(--ink3)] hover:border-[var(--accent)]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {importStatus && (
                  <div className="mb-3 rounded-lg border border-[var(--paper3)] bg-[var(--paper)] p-3 text-xs text-[var(--ink3)]">
                    Imported <span className="font-medium text-[var(--ink)]">{importStatus.fileName}</span>. Matched {importStatus.matched} student(s), {importStatus.unmatched} row(s) did not match.
                  </div>
                )}

                <div className="max-h-64 overflow-auto rounded-lg border border-[var(--paper3)] p-3 space-y-2">
                  {students.length === 0 ? (
                    <p className="text-sm text-[var(--ink3)]">No students found</p>
                  ) : students.map(student => (
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
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--paper3)] p-4 text-sm text-[var(--ink3)]">
                External import is not connected yet. Use CSV/Excel import or manual selection for now, or wire your external allocation feed here next.
              </div>
            )}

            <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Assignment'}
            </button>
          </form>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h2 className="text-xl font-bold text-[var(--ink)] heading mb-4">Current Assignments</h2>
            {assignments.length === 0 ? (
              <p className="text-[var(--ink3)]">No assignments created yet</p>
            ) : (
              <div className="space-y-4">
                {assignments.map(assignment => (
                  <div key={assignment._id} className="p-4 border border-[var(--paper3)] rounded-lg">
                    <div className="font-semibold text-[var(--ink)]">{assignment.labGroup?.name || assignment.subjectName || 'Assignment'}</div>
                    <div className="text-sm text-[var(--ink3)] mt-1">
                      Faculty: {assignment.faculty ? `${assignment.faculty.firstName} ${assignment.faculty.lastName}` : 'Unknown'}
                    </div>
                    <div className="text-sm text-[var(--ink3)]">Group: {assignment.labGroup?.name || 'Unknown'}</div>
                    <div className="text-sm text-[var(--ink3)]">Students: {assignment.studentIds?.length || 0} {assignment.studentSource ? `(${assignment.studentSource})` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
