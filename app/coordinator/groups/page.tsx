'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LabGroup {
  _id: string;
  name: string;
  subject: string;
  semester: string;
  academicYear: string;
  facultyName?: string;
  studentCount: number;
}

export default function CoordinatorGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<LabGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [semesterFilter, academicYearFilter]);

  const fetchGroups = async () => {
    try {
      const query = new URLSearchParams();
      if (semesterFilter) query.set('semester', semesterFilter);
      if (academicYearFilter) query.set('academicYear', academicYearFilter);

      const response = await fetch(`/api/lab-groups${query.toString() ? `?${query.toString()}` : ''}`);
      const data = await response.json();
      if (data.success) {
        setGroups(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups', error);
      setGroups([]);
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
                <Link href="/coordinator/groups" className="text-[var(--accent)] font-medium">Lab Groups</Link>
                <Link href="/coordinator/faculty" className="text-[var(--ink3)] hover:text-[var(--ink)]">Faculty</Link>
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Lab Groups</h1>
            <p className="text-[var(--ink3)]">Manage lab groups and assignments</p>
          </div>
          <Link
            href="/coordinator/groups/new"
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
          >
            Create Group
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="semesterFilter" className="block text-sm font-medium text-[var(--ink)] mb-2">
              Filter by Semester
            </label>
            <select
              id="semesterFilter"
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">All semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="Semester 3">Semester 3</option>
              <option value="Semester 4">Semester 4</option>
              <option value="Semester 5">Semester 5</option>
              <option value="Semester 6">Semester 6</option>
              <option value="Semester 7">Semester 7</option>
              <option value="Semester 8">Semester 8</option>
            </select>
          </div>

          <div>
            <label htmlFor="academicYearFilter" className="block text-sm font-medium text-[var(--ink)] mb-2">
              Filter by Academic Year
            </label>
            <input
              id="academicYearFilter"
              value={academicYearFilter}
              onChange={(event) => setAcademicYearFilter(event.target.value)}
              placeholder="e.g., 2026-2027"
              className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-12 text-center">
            <p className="text-[var(--ink3)] mb-4">No lab groups created yet</p>
            <Link
              href="/coordinator/groups/new"
              className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
            >
              Create Your First Group
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group._id} className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
                <div className="mb-4">
                  <span className="text-xs font-medium text-[var(--accent)] bg-[var(--accent3)] px-2 py-1 rounded">
                    {group.subject}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">{group.name}</h3>
                <div className="text-sm text-[var(--ink3)] space-y-1 mb-4">
                  <p>Semester: {group.semester}</p>
                  <p>Year: {group.academicYear}</p>
                  <p>Faculty: {group.facultyName || 'Not assigned'}</p>
                  <p>Students: {group.studentCount || 0}</p>
                </div>
                <Link
                  href={`/coordinator/groups/${group._id}`}
                  className="block w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm text-center"
                >
                  Manage Group
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
