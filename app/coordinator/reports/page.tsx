'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CoordinatorReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('submissions');
  const [dateRange, setDateRange] = useState('month');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleGenerateReport = () => {
    setLoading(true);
    // Simulate report generation
    setTimeout(() => {
      setLoading(false);
      alert('Report generated successfully!');
    }, 2000);
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
                <Link href="/coordinator/faculty" className="text-[var(--ink3)] hover:text-[var(--ink)]">Faculty</Link>
                <Link href="/coordinator/reports" className="text-[var(--accent)] font-medium">Reports</Link>
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
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Reports & Analytics</h1>
          <p className="text-[var(--ink3)]">Generate department reports and view analytics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <h2 className="text-xl font-bold text-[var(--ink)] heading mb-6">Generate Report</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                  >
                    <option value="submissions">Submission Statistics</option>
                    <option value="faculty">Faculty Performance</option>
                    <option value="students">Student Progress</option>
                    <option value="groups">Lab Group Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="semester">Current Semester</option>
                    <option value="year">Academic Year</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <div className="text-sm text-[var(--ink3)] mb-1">Total Submissions</div>
                <div className="text-3xl font-bold text-[var(--ink)] heading">0</div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <div className="text-sm text-[var(--ink3)] mb-1">Approval Rate</div>
                <div className="text-3xl font-bold text-[var(--green)] heading">0%</div>
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div>
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <h3 className="text-lg font-bold text-[var(--ink)] heading mb-4">Recent Reports</h3>
              <div className="space-y-3">
                <p className="text-sm text-[var(--ink3)] text-center py-8">No reports generated yet</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
