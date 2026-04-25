'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface FacultySummary {
  assignedGroups: number;
  assignedStudents: number;
  totalSessions: number;
  totalSubmissions: number;
  pendingReviews: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
}

interface FacultyInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
}

interface FacultyGroup {
  _id: string;
  name: string;
  className: string;
  semester: string;
  academicYear: string;
  studentCount: number;
  sessionCount: number;
  submissionCount: number;
  pendingReviews: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
}

interface FacultyDetailResponse {
  faculty: FacultyInfo;
  summary: FacultySummary;
  groups: FacultyGroup[];
}

export default function CoordinatorFacultyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const facultyId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<FacultyDetailResponse | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [facultyId]);

  const fetchDetail = async () => {
    try {
      const response = await fetch(`/api/coordinator/faculty/${facultyId}`);
      const data = await response.json();
      if (data.success) {
        setDetail(data.data);
      } else {
        setError(data.error?.message || 'Failed to load faculty detail');
      }
    } catch (fetchError) {
      setError('Failed to load faculty detail');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!detail?.groups) return [];
    const query = search.trim().toLowerCase();
    if (!query) return detail.groups;
    return detail.groups.filter((group) =>
      `${group.name} ${group.className} ${group.semester} ${group.academicYear}`.toLowerCase().includes(query)
    );
  }, [detail?.groups, search]);

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

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <main className="max-w-3xl mx-auto px-4 py-20">
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-[var(--ink)] mb-3">Faculty Details</h1>
            <p className="text-red-600 mb-6">{error || 'Unable to load faculty details'}</p>
            <Link href="/coordinator/faculty" className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white">Back to Faculty</Link>
          </div>
        </main>
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
                <Link href="/coordinator/groups" className="text-[var(--ink3)] hover:text-[var(--ink)]">Lab Groups</Link>
                <Link href="/coordinator/faculty" className="text-[var(--accent)] font-medium">Faculty</Link>
                <Link href="/coordinator/reports" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reports</Link>
              </nav>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/coordinator/faculty" className="text-[var(--accent)] hover:text-[var(--accent2)]">← Back to Faculty</Link>
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mt-2">
            {detail.faculty.firstName} {detail.faculty.lastName}
          </h1>
          <p className="text-[var(--ink3)] mt-1">{detail.faculty.email}{detail.faculty.employeeId ? ` • ${detail.faculty.employeeId}` : ''}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white border border-[var(--paper3)] rounded-xl p-4"><div className="text-xs text-[var(--ink3)]">Groups</div><div className="text-2xl font-bold text-[var(--ink)] heading">{detail.summary.assignedGroups}</div></div>
          <div className="bg-white border border-[var(--paper3)] rounded-xl p-4"><div className="text-xs text-[var(--ink3)]">Students</div><div className="text-2xl font-bold text-[var(--ink)] heading">{detail.summary.assignedStudents}</div></div>
          <div className="bg-white border border-[var(--paper3)] rounded-xl p-4"><div className="text-xs text-[var(--ink3)]">Sessions</div><div className="text-2xl font-bold text-[var(--ink)] heading">{detail.summary.totalSessions}</div></div>
          <div className="bg-white border border-[var(--paper3)] rounded-xl p-4"><div className="text-xs text-[var(--ink3)]">Submissions</div><div className="text-2xl font-bold text-[var(--ink)] heading">{detail.summary.totalSubmissions}</div></div>
          <div className="bg-white border border-[var(--paper3)] rounded-xl p-4"><div className="text-xs text-[var(--ink3)]">Pending</div><div className="text-2xl font-bold text-[var(--amber)] heading">{detail.summary.pendingReviews}</div></div>
          <div className="bg-white border border-[var(--paper3)] rounded-xl p-4"><div className="text-xs text-[var(--ink3)]">Accepted</div><div className="text-2xl font-bold text-[var(--green)] heading">{detail.summary.acceptedSubmissions}</div></div>
          <div className="bg-white border border-[var(--paper3)] rounded-xl p-4"><div className="text-xs text-[var(--ink3)]">Rejected</div><div className="text-2xl font-bold text-red-600 heading">{detail.summary.rejectedSubmissions}</div></div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--paper3)] flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[var(--ink)] heading">Assigned Groups</h2>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search groups..."
              className="w-full max-w-xs px-3 py-2 border border-[var(--paper3)] rounded-lg text-sm"
            />
          </div>
          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-[var(--ink3)]">No groups found for this faculty.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-[var(--paper)] border-b border-[var(--paper3)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Group</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Submissions</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Accepted</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--paper3)]">
                  {filteredGroups.map((group) => (
                    <tr key={group._id} className="hover:bg-[var(--paper)]">
                      <td className="px-6 py-3 text-sm text-[var(--ink)] font-medium">{group.name}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.className || '-'}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.semester || '-'}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.studentCount}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.sessionCount}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.submissionCount}</td>
                      <td className="px-6 py-3 text-sm text-[var(--amber)]">{group.pendingReviews}</td>
                      <td className="px-6 py-3 text-sm text-[var(--green)]">{group.acceptedSubmissions}</td>
                      <td className="px-6 py-3 text-sm text-red-600">{group.rejectedSubmissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
