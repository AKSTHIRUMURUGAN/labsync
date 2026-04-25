'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Faculty {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  assignedGroups: number;
  assignedStudents: number;
  totalSubmissions: number;
  pendingReviews: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
}

export default function CoordinatorFacultyPage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await fetch('/api/coordinator/faculty');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const normalized = data.data.map((member: any) => ({
          _id: member._id?.toString() || '',
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          email: member.email || '',
          employeeId: member.employeeId || '',
          assignedGroups: Number(member.assignedGroups || 0),
          assignedStudents: Number(member.assignedStudents || 0),
          totalSubmissions: Number(member.totalSubmissions || 0),
          pendingReviews: Number(member.pendingReviews || 0),
          acceptedSubmissions: Number(member.acceptedSubmissions || 0),
          rejectedSubmissions: Number(member.rejectedSubmissions || 0),
        }));
        setFaculty(normalized);
      } else {
        setFaculty([]);
      }
    } catch (error) {
      console.error('Failed to fetch faculty');
      setFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
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
                <Link href="/coordinator/faculty" className="text-[var(--accent)] font-medium">Faculty</Link>
                <Link href="/coordinator/reports" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reports</Link>
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
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Faculty Management</h1>
          <p className="text-[var(--ink3)]">View and manage faculty assignments</p>
        </div>

        {/* Faculty List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : faculty.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-12 text-center">
            <p className="text-[var(--ink3)]">No faculty members found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--paper)] border-b border-[var(--paper3)]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Employee ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Assigned Groups</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Students</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Pending</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Accepted</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Rejected</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[var(--ink)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--paper3)]">
                {faculty.map((member) => (
                  <tr key={member._id} className="hover:bg-[var(--paper)] transition">
                    <td className="px-6 py-4 text-sm text-[var(--ink)]">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink3)]">
                      {member.employeeId}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink3)]">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink3)]">
                      {member.assignedGroups}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink3)]">
                      {member.assignedStudents}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--amber)]">
                      {member.pendingReviews}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--green)]">
                      {member.acceptedSubmissions}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {member.rejectedSubmissions}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/coordinator/faculty/${member._id}`}
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
