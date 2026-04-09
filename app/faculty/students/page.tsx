'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNumber: string;
  totalSubmissions: number;
  approvedSubmissions: number;
}

export default function FacultyStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Fetch lab groups
      const response = await fetch('/api/lab-groups');
      const data = await response.json();
      if (data.success && data.data) {
        const groups = Array.isArray(data.data) ? data.data : [];
        
        // Collect all unique student IDs
        const studentIds = new Set<string>();
        groups.forEach((group: any) => {
          if (group.students && Array.isArray(group.students)) {
            group.students.forEach((studentId: any) => {
              studentIds.add(studentId.toString());
            });
          }
        });

        // For now, create placeholder student data
        // In a real app, you'd fetch actual student data from a users API
        const studentList: Student[] = Array.from(studentIds).map((id, index) => ({
          _id: id,
          firstName: `Student`,
          lastName: `${index + 1}`,
          email: `student${index + 1}@test.com`,
          enrollmentNumber: `ENR${String(index + 1).padStart(4, '0')}`,
          totalSubmissions: 0,
          approvedSubmissions: 0,
        }));

        setStudents(studentList);
      }
    } catch (error) {
      console.error('Failed to fetch students', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/faculty/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/faculty/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/faculty/reviews" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reviews</Link>
                <Link href="/faculty/sessions" className="text-[var(--ink3)] hover:text-[var(--ink)]">Sessions</Link>
                <Link href="/faculty/students" className="text-[var(--accent)] font-medium">Students</Link>
              </nav>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Students</h1>
          <p className="text-[var(--ink3)]">View and manage students in your lab groups</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or enrollment number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
          />
        </div>

        {/* Students List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-12 text-center">
            <p className="text-[var(--ink3)]">
              {searchTerm ? 'No students found matching your search' : 'No students assigned to your lab groups'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--paper)] border-b border-[var(--paper3)]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Enrollment No.</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Submissions</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Approved</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--paper3)]">
                {filteredStudents.map((student, index) => (
                  <tr key={student._id || `student-${index}`} className="hover:bg-[var(--paper)] transition">
                    <td className="px-6 py-4 text-sm text-[var(--ink)]">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink3)]">
                      {student.enrollmentNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink3)]">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink3)]">
                      {student.totalSubmissions || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--green)]">
                      {student.approvedSubmissions || 0}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/faculty/students/${student._id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
