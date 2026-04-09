'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Session {
  _id: string;
  labGroupId: string;
  experimentTemplateId: string;
  templateVersion: string;
  conductedBy: string;
  status: 'created' | 'active' | 'ended';
  startTime: string;
  endTime?: string;
  duration: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  _id: string;
  studentId: string;
  studentName: string;
  status: string;
  submittedAt?: string;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSession();
      fetchSubmissions();
    }
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      const data = await response.json();
      if (data.success) {
        setSession(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch session', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/submissions?labSessionId=${id}`);
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions', error);
    }
  };

  const handleStartSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${id}/start`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchSession();
      } else {
        alert(data.error?.message || 'Failed to start session');
      }
    } catch (error) {
      alert('Failed to start session');
    }
  };

  const handleStopSession = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;

    try {
      const response = await fetch(`/api/sessions/${id}/stop`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchSession();
      } else {
        alert(data.error?.message || 'Failed to stop session');
      }
    } catch (error) {
      alert('Failed to stop session');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'created': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getElapsedTime = () => {
    if (!session || !session.startTime) return '0m';
    const start = new Date(session.startTime).getTime();
    const now = new Date().getTime();
    const elapsed = Math.floor((now - start) / 1000 / 60);
    return formatDuration(elapsed);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-center">
          <p className="text-[var(--ink3)] mb-4">Session not found</p>
          <Link href="/faculty/sessions" className="text-[var(--accent)] hover:underline">
            Back to Sessions
          </Link>
        </div>
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
              <Link href="/faculty/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/faculty/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/faculty/reviews" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reviews</Link>
                <Link href="/faculty/sessions" className="text-[var(--accent)] font-medium">Sessions</Link>
                <Link href="/faculty/students" className="text-[var(--ink3)] hover:text-[var(--ink)]">Students</Link>
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
          <Link href="/faculty/sessions" className="text-[var(--accent)] hover:text-[var(--accent2)] mb-4 inline-block">
            ← Back to Sessions
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Lab Session Details</h1>
              <p className="text-[var(--ink3)]">Manage and monitor this lab session</p>
            </div>
            <div className="flex gap-3">
              {session.status === 'created' && (
                <button
                  onClick={handleStartSession}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Start Session
                </button>
              )}
              {session.status === 'active' && (
                <button
                  onClick={handleStopSession}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--ink)] heading">Session Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">Location</p>
                  <p className="text-[var(--ink)] font-medium">{session.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">Duration</p>
                  <p className="text-[var(--ink)] font-medium">{formatDuration(session.duration)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">Started At</p>
                  <p className="text-[var(--ink)] font-medium">
                    {session.startTime ? new Date(session.startTime).toLocaleString() : 'Not started'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">
                    {session.status === 'active' ? 'Elapsed Time' : 'Ended At'}
                  </p>
                  <p className="text-[var(--ink)] font-medium">
                    {session.status === 'active' 
                      ? getElapsedTime()
                      : session.endTime 
                        ? new Date(session.endTime).toLocaleString()
                        : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Submissions */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--paper3)]">
                <h2 className="text-xl font-bold text-[var(--ink)] heading">Student Submissions</h2>
              </div>
              <div className="divide-y divide-[var(--paper3)]">
                {submissions.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[var(--ink3)]">
                    No submissions yet
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission._id} className="px-6 py-4 hover:bg-[var(--paper)] transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[var(--ink)]">{submission.studentName || 'Unknown Student'}</p>
                          <p className="text-sm text-[var(--ink3)]">
                            {submission.submittedAt 
                              ? `Submitted ${new Date(submission.submittedAt).toLocaleString()}`
                              : 'In progress'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(submission.status)}`}>
                            {submission.status.replace('_', ' ').charAt(0).toUpperCase() + submission.status.slice(1)}
                          </span>
                          <Link
                            href={`/faculty/reviews/${submission._id}`}
                            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <h3 className="text-lg font-bold text-[var(--ink)] heading mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">Total Submissions</p>
                  <p className="text-2xl font-bold text-[var(--ink)] heading">{submissions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">Submitted</p>
                  <p className="text-2xl font-bold text-[var(--accent)] heading">
                    {submissions.filter(s => s.status === 'submitted').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-[var(--amber)] heading">
                    {submissions.filter(s => s.status === 'in_progress').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink3)] mb-1">Approved</p>
                  <p className="text-2xl font-bold text-[var(--green)] heading">
                    {submissions.filter(s => s.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Students can only submit during active sessions. End the session when the lab is complete.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
