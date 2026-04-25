'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalStudents: 0,
    activeGroups: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const groupsRes = await fetch('/api/lab-groups');
      const groupsData = await groupsRes.json();
      
      if (groupsData.success && groupsData.data) {
        const groups = Array.isArray(groupsData.data) ? groupsData.data : [];
        setStats(prev => ({
          ...prev,
          activeGroups: groups.length,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-[var(--ink)] heading">LabSync</h1>
              <nav className="hidden md:flex gap-6">
                <Link href="/coordinator/dashboard" className="text-[var(--accent)] font-medium">Dashboard</Link>
                <Link href="/coordinator/groups" className="text-[var(--ink3)] hover:text-[var(--ink)]">Lab Groups</Link>
                <Link href="/coordinator/faculty" className="text-[var(--ink3)] hover:text-[var(--ink)]">Faculty</Link>
                <Link href="/coordinator/reports" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reports</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--ink3)]">{user?.firstName} {user?.lastName}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)] transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--ink)] heading mb-2">
            Coordinator Dashboard
          </h2>
          <p className="text-[var(--ink3)]">Manage lab groups, faculty, and department operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Total Faculty</div>
            <div className="text-3xl font-bold text-[var(--ink)] heading">{stats.totalFaculty}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Total Students</div>
            <div className="text-3xl font-bold text-[var(--accent)] heading">{stats.totalStudents}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Active Groups</div>
            <div className="text-3xl font-bold text-[var(--green)] heading">{stats.activeGroups}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Pending Approvals</div>
            <div className="text-3xl font-bold text-[var(--amber)] heading">{stats.pendingApprovals}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/coordinator/groups/new"
            className="bg-[var(--accent)] text-white rounded-xl p-6 hover:bg-[var(--accent2)] transition"
          >
            <div className="text-lg font-bold mb-2 heading">Create Lab Group</div>
            <p className="text-sm text-white/80">Set up a new lab group with students</p>
          </Link>
          <Link
            href="/coordinator/groups"
            className="bg-white border border-[var(--paper3)] rounded-xl p-6 hover:border-[var(--accent)] transition"
          >
            <div className="text-lg font-bold mb-2 text-[var(--ink)] heading">Manage Lab Groups</div>
            <p className="text-sm text-[var(--ink3)]">Manage faculty, students, and assignments in one place</p>
          </Link>
        </div>

        {/* Recent Groups */}
        <div className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--paper3)]">
            <h3 className="text-xl font-bold text-[var(--ink)] heading">Recent Lab Groups</h3>
          </div>
          <div className="p-6">
            <p className="text-[var(--ink3)] text-center py-8">No lab groups created yet</p>
          </div>
        </div>
      </main>
    </div>
  );
}
