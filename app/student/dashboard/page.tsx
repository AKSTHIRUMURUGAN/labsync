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

interface Submission {
  _id: string;
  experimentTitle: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
}

interface ActiveSession {
  _id: string;
  experimentTemplateId: string;
  startTime: string;
  duration: number;
  location?: string;
  status: 'active';
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchSubmissions();
    fetchActiveSessions();
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

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/sessions?status=active');
      const data = await response.json();
      if (data.success) {
        setActiveSessions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch active sessions');
      setActiveSessions([]);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                <Link href="/student/dashboard" className="text-[var(--accent)] font-medium">Dashboard</Link>
                <Link href="/student/experiments" className="text-[var(--ink3)] hover:text-[var(--ink)]">Experiments</Link>
                <Link href="/student/submissions" className="text-[var(--ink3)] hover:text-[var(--ink)]">Submissions</Link>
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
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-[var(--ink3)]">Track your lab experiments and submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Total Submissions</div>
            <div className="text-3xl font-bold text-[var(--ink)] heading">{submissions.length}</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Approved</div>
            <div className="text-3xl font-bold text-[var(--green)] heading">
              {submissions.filter(s => s.status === 'approved').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Pending</div>
            <div className="text-3xl font-bold text-[var(--accent)] heading">
              {submissions.filter(s => s.status === 'submitted').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[var(--paper3)]">
            <div className="text-sm text-[var(--ink3)] mb-1">Drafts</div>
            <div className="text-3xl font-bold text-[var(--ink3)] heading">
              {submissions.filter(s => s.status === 'draft').length}
            </div>
          </div>
        </div>

        {/* Active Lab Sessions */}
        {activeSessions.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading">Active Lab Session</h3>
            </div>
            {activeSessions.map((session) => (
              <div key={session._id} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--ink3)]">Started:</span>
                    <p className="font-medium text-[var(--ink)]">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--ink3)]">Duration:</span>
                    <p className="font-medium text-[var(--ink)]">{session.duration} minutes</p>
                  </div>
                  {session.location && (
                    <div>
                      <span className="text-[var(--ink3)]">Location:</span>
                      <p className="font-medium text-[var(--ink)]">{session.location}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/student/experiments/new?session=${session._id}&template=${session.experimentTemplateId}`}
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    Submit Experiment
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--paper3)]">
            <h3 className="text-xl font-bold text-[var(--ink)] heading">Recent Submissions</h3>
          </div>
          <div className="divide-y divide-[var(--paper3)]">
            {submissions.length === 0 ? (
              <div className="px-6 py-12 text-center text-[var(--ink3)]">
                No submissions yet. Start your first experiment!
              </div>
            ) : (
              submissions.slice(0, 5).map((submission) => (
                <div key={submission._id} className="px-6 py-4 hover:bg-[var(--paper)] transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[var(--ink)] mb-1">{submission.experimentTitle}</h4>
                      <p className="text-sm text-[var(--ink3)]">
                        {submission.submittedAt 
                          ? `Submitted ${new Date(submission.submittedAt).toLocaleDateString()}`
                          : 'Draft'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/student/experiments/new"
            className="bg-[var(--accent)] text-white rounded-xl p-6 hover:bg-[var(--accent2)] transition group"
          >
            <div className="text-lg font-bold mb-2 heading">New Experiment</div>
            <p className="text-sm text-white/80">Start a new lab experiment submission</p>
          </Link>
          <Link
            href="/student/templates"
            className="bg-white border border-[var(--paper3)] rounded-xl p-6 hover:border-[var(--accent)] transition group"
          >
            <div className="text-lg font-bold mb-2 text-[var(--ink)] heading">Browse Templates</div>
            <p className="text-sm text-[var(--ink3)]">View available experiment templates</p>
          </Link>
          <Link
            href="/student/help"
            className="bg-white border border-[var(--paper3)] rounded-xl p-6 hover:border-[var(--accent)] transition group"
          >
            <div className="text-lg font-bold mb-2 text-[var(--ink)] heading">Help & Support</div>
            <p className="text-sm text-[var(--ink3)]">Get help with your submissions</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
