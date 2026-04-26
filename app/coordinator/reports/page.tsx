'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ReportRange = 'week' | 'month' | 'semester' | 'year';

interface ReportSummary {
  totalFaculty: number;
  totalStudents: number;
  totalGroups: number;
  groupsWithFaculty: number;
  groupsWithoutFaculty: number;
  totalSessions: number;
  activeSessions: number;
  totalSubmissions: number;
  pendingReviews: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  approvalRate: number;
}

interface ActiveSession {
  _id: string;
  title: string;
  groupName: string;
  className: string;
  semester: string;
  academicYear: string;
  facultyName: string;
  departmentId: string;
  location: string;
  status: string;
  startedAt: string | null;
  duration: number;
}

interface FacultyPerformance {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  assignedGroups: number;
  sessionsInRange: number;
  submissionsInRange: number;
  pendingReviews: number;
}

interface GroupActivity {
  _id: string;
  name: string;
  className: string;
  semester: string;
  academicYear: string;
  facultyName: string;
  studentCount: number;
  sessionsInRange: number;
  submissionsInRange: number;
  pendingReviews: number;
  approvalRate: number;
}

interface ReportsPayload {
  range: ReportRange;
  generatedAt: string;
  summary: ReportSummary;
  statusBreakdown: {
    submitted: number;
    approved: number;
    rejected: number;
  };
  activeSessions: ActiveSession[];
  facultyPerformance: FacultyPerformance[];
  groupActivity: GroupActivity[];
}

export default function CoordinatorReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportType, setReportType] = useState<'submissions' | 'faculty' | 'students' | 'groups'>('submissions');
  const [dateRange, setDateRange] = useState<ReportRange>('month');
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    try {
      setError('');
      if (!data) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await fetch(`/api/coordinator/reports?range=${dateRange}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load reports');
      }
    } catch (fetchError) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleGenerateReport = async () => {
    await loadReport();
  };

  const metrics = useMemo(() => {
    const summary = data?.summary;
    if (!summary) {
      return [
        { label: 'Total Submissions', value: '0', tone: 'text-[var(--ink)]' },
        { label: 'Approval Rate', value: '0%', tone: 'text-[var(--green)]' },
        { label: 'Active Sessions', value: '0', tone: 'text-[var(--accent)]' },
        { label: 'Pending Reviews', value: '0', tone: 'text-[var(--amber)]' },
      ];
    }

    return [
      { label: 'Total Submissions', value: String(summary.totalSubmissions), tone: 'text-[var(--ink)]' },
      { label: 'Approval Rate', value: `${summary.approvalRate}%`, tone: 'text-[var(--green)]' },
      { label: 'Active Sessions', value: String(summary.activeSessions), tone: 'text-[var(--accent)]' },
      { label: 'Pending Reviews', value: String(summary.pendingReviews), tone: 'text-[var(--amber)]' },
    ];
  }, [data]);

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
          <p className="text-[var(--ink3)]">Department-scoped analytics for groups, faculty, sessions, and approvals</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--ink)] heading">Generate Report</h2>
                  <p className="text-sm text-[var(--ink3)] mt-1">Only data from your department is included.</p>
                </div>
                <button
                  onClick={handleGenerateReport}
                  disabled={loading || refreshing}
                  className="px-4 py-2 rounded-lg border border-[var(--paper3)] text-sm text-[var(--ink)] hover:border-[var(--accent)] transition disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'submissions' | 'faculty' | 'students' | 'groups')}
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
                    onChange={(e) => setDateRange(e.target.value as ReportRange)}
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
                  disabled={loading || refreshing}
                  className="w-full px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : refreshing ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-4">
              {metrics.map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <div className="text-sm text-[var(--ink3)] mb-1">{item.label}</div>
                  <div className={`text-3xl font-bold heading ${item.tone}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div>
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <h3 className="text-lg font-bold text-[var(--ink)] heading mb-4">Department Snapshot</h3>
              <div className="space-y-3">
                <div className="rounded-lg border border-[var(--paper3)] bg-[var(--paper)] p-4 text-sm text-[var(--ink3)] space-y-2">
                  <p><span className="text-[var(--ink)] font-medium">Range:</span> {data?.range || dateRange}</p>
                  <p><span className="text-[var(--ink)] font-medium">Generated:</span> {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'Pending'}</p>
                  <p><span className="text-[var(--ink)] font-medium">Groups with faculty:</span> {data?.summary?.groupsWithFaculty ?? 0}</p>
                  <p><span className="text-[var(--ink)] font-medium">Groups without faculty:</span> {data?.summary?.groupsWithoutFaculty ?? 0}</p>
                </div>
                <div className="rounded-lg border border-[var(--paper3)] bg-white p-4">
                  <p className="text-sm font-medium text-[var(--ink)] mb-2">Status Breakdown</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-[var(--paper)] p-3">
                      <div className="text-[var(--ink3)]">Submitted</div>
                      <div className="font-bold text-[var(--amber)]">{data?.statusBreakdown?.submitted ?? 0}</div>
                    </div>
                    <div className="rounded-lg bg-[var(--paper)] p-3">
                      <div className="text-[var(--ink3)]">Approved</div>
                      <div className="font-bold text-[var(--green)]">{data?.statusBreakdown?.approved ?? 0}</div>
                    </div>
                    <div className="rounded-lg bg-[var(--paper)] p-3">
                      <div className="text-[var(--ink3)]">Rejected</div>
                      <div className="font-bold text-red-600">{data?.statusBreakdown?.rejected ?? 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--paper3)] flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--ink)] heading">Active Lab Sessions</h3>
                <p className="text-sm text-[var(--ink3)]">Clear view of class, group, faculty lab section, and session title.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent3)] text-[var(--accent)] font-medium">
                {data?.activeSessions?.length || 0} active
              </span>
            </div>

            {data?.activeSessions?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {data.activeSessions.map((session) => (
                  <div key={session._id} className="rounded-xl border border-[var(--paper3)] bg-[var(--paper)] p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">Active Lab Session</p>
                        <h4 className="text-lg font-bold text-[var(--ink)] heading mt-1">{session.title}</h4>
                      </div>
                      <span className="rounded-full bg-green-100 text-green-700 px-2 py-1 text-xs font-medium">Active</span>
                    </div>

                    <div className="space-y-2 text-sm text-[var(--ink3)]">
                      <p><span className="text-[var(--ink)] font-medium">Group:</span> {session.groupName}</p>
                      <p><span className="text-[var(--ink)] font-medium">Class:</span> {session.className || 'Not specified'}</p>
                      <p><span className="text-[var(--ink)] font-medium">Semester:</span> {session.semester || 'Not specified'}</p>
                      <p><span className="text-[var(--ink)] font-medium">Faculty Lab Section:</span> {session.location || 'Faculty lab section'}</p>
                      <p><span className="text-[var(--ink)] font-medium">Faculty:</span> {session.facultyName}</p>
                      <p><span className="text-[var(--ink)] font-medium">Duration:</span> {session.duration} minutes</p>
                      <p><span className="text-[var(--ink)] font-medium">Started:</span> {session.startedAt ? new Date(session.startedAt).toLocaleString() : 'Not specified'}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--paper3)] text-xs text-[var(--ink3)] flex items-center justify-between gap-3">
                      <span>Department scoped</span>
                      <Link href="/coordinator/groups" className="text-[var(--accent)] hover:underline">Open groups</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--ink3)]">No active lab sessions found for this department.</div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--paper3)]">
              <h3 className="text-lg font-bold text-[var(--ink)] heading">Faculty Workload</h3>
              <p className="text-sm text-[var(--ink3)]">Pending and accepted counts are calculated from live submissions.</p>
            </div>

            {data?.facultyPerformance?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-[var(--paper)] border-b border-[var(--paper3)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Faculty</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Groups</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Sessions</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Submissions</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--paper3)]">
                    {data.facultyPerformance.map((member) => (
                      <tr key={member._id} className="hover:bg-[var(--paper)]">
                        <td className="px-6 py-3 text-sm text-[var(--ink)]">
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-[var(--ink3)]">{member.email}</div>
                        </td>
                        <td className="px-6 py-3 text-sm text-[var(--ink3)]">{member.assignedGroups}</td>
                        <td className="px-6 py-3 text-sm text-[var(--ink3)]">{member.sessionsInRange}</td>
                        <td className="px-6 py-3 text-sm text-[var(--ink3)]">{member.submissionsInRange}</td>
                        <td className="px-6 py-3 text-sm text-[var(--amber)]">{member.pendingReviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--ink3)]">No faculty data available.</div>
            )}
          </section>
        </div>

        <section className="mt-8 bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--paper3)]">
            <h3 className="text-lg font-bold text-[var(--ink)] heading">Lab Group Activity</h3>
            <p className="text-sm text-[var(--ink3)]">Shows how each group is operating in the selected range.</p>
          </div>
          {data?.groupActivity?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-[var(--paper)] border-b border-[var(--paper3)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Group</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Faculty</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Submissions</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[var(--ink)] uppercase">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--paper3)]">
                  {data.groupActivity.map((group) => (
                    <tr key={group._id} className="hover:bg-[var(--paper)]">
                      <td className="px-6 py-3 text-sm text-[var(--ink)] font-medium">{group.name}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.className || '-'}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.semester || '-'}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.facultyName}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.studentCount}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.sessionsInRange}</td>
                      <td className="px-6 py-3 text-sm text-[var(--ink3)]">{group.submissionsInRange}</td>
                      <td className="px-6 py-3 text-sm text-[var(--amber)]">{group.pendingReviews}</td>
                      <td className="px-6 py-3 text-sm text-[var(--green)]">{group.approvalRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--ink3)]">No group activity available.</div>
          )}
        </section>
      </main>
    </div>
  );
}
