'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HODAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch analytics data
    setTimeout(() => setLoading(false), 1000);
  }, []);

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
              <Link href="/hod/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/hod/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/hod/departments" className="text-[var(--ink3)] hover:text-[var(--ink)]">Departments</Link>
                <Link href="/hod/faculty" className="text-[var(--ink3)] hover:text-[var(--ink)]">Faculty</Link>
                <Link href="/hod/analytics" className="text-[var(--accent)] font-medium">Analytics</Link>
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
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Department Analytics</h1>
          <p className="text-[var(--ink3)]">Comprehensive performance metrics and insights</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <div className="text-sm text-[var(--ink3)] mb-1">Completion Rate</div>
                <div className="text-3xl font-bold text-[var(--green)] heading">0%</div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <div className="text-sm text-[var(--ink3)] mb-1">Avg. Review Time</div>
                <div className="text-3xl font-bold text-[var(--accent)] heading">0h</div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <div className="text-sm text-[var(--ink3)] mb-1">Active Students</div>
                <div className="text-3xl font-bold text-[var(--ink)] heading">0</div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <div className="text-sm text-[var(--ink3)] mb-1">Faculty Utilization</div>
                <div className="text-3xl font-bold text-[var(--amber)] heading">0%</div>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <h3 className="text-lg font-bold text-[var(--ink)] heading mb-4">Submission Trends</h3>
                <div className="h-64 flex items-center justify-center text-[var(--ink3)]">
                  Chart visualization would appear here
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <h3 className="text-lg font-bold text-[var(--ink)] heading mb-4">Faculty Performance</h3>
                <div className="h-64 flex items-center justify-center text-[var(--ink3)]">
                  Chart visualization would appear here
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
