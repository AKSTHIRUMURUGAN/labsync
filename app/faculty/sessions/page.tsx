'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Session {
  _id: string;
  labGroupId: string;
  experimentTemplateId: string;
  templateTitle?: string;
  groupName?: string;
  className?: string;
  semester?: string;
  academicYear?: string;
  status: 'created' | 'active' | 'ended';
  startTime: string;
  endTime?: string;
  duration: number;
  location?: string;
}

export default function FacultySessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionActionLoading, setSessionActionLoading] = useState<Record<string, 'start' | 'stop' | null>>({});

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleStartSession = async (sessionId: string) => {
    setSessionActionLoading((prev) => ({ ...prev, [sessionId]: 'start' }));
    try {
      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        await fetchSessions();
      }
    } catch (error) {
      console.error('Failed to start session');
    } finally {
      setSessionActionLoading((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleStopSession = async (sessionId: string) => {
    setSessionActionLoading((prev) => ({ ...prev, [sessionId]: 'stop' }));
    try {
      const response = await fetch(`/api/sessions/${sessionId}/stop`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        await fetchSessions();
      }
    } catch (error) {
      console.error('Failed to stop session');
    } finally {
      setSessionActionLoading((prev) => ({ ...prev, [sessionId]: null }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created': return 'Scheduled';
      case 'active': return 'Active';
      case 'ended': return 'Completed';
      default: return status;
    }
  };

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Lab Sessions</h1>
            <p className="text-[var(--ink3)]">Manage and track lab sessions</p>
          </div>
          <Link
            href="/faculty/sessions/new"
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
          >
            New Session
          </Link>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-12 text-center">
            <p className="text-[var(--ink3)] mb-4">No lab sessions scheduled</p>
            <Link
              href="/faculty/sessions/new"
              className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
            >
              Schedule Your First Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
                <div className="mb-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(session.status)}`}>
                    {getStatusLabel(session.status)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">{session.templateTitle || 'Lab Session'}</h3>
                <div className="text-sm text-[var(--ink3)] space-y-1 mb-4">
                  <p>Group: {session.groupName || 'Not specified'}</p>
                  <p>Class: {session.className || 'Not specified'}</p>
                  <p>Semester: {session.semester || 'Not specified'}</p>
                  <p>Date: {new Date(session.startTime).toLocaleDateString()}</p>
                  <p>Started: {new Date(session.startTime).toLocaleTimeString()}</p>
                  {session.endTime && <p>Ended: {new Date(session.endTime).toLocaleTimeString()}</p>}
                  <p>Faculty Lab Section: {session.location || 'Not specified'}</p>
                  <p>Duration: {session.duration} minutes</p>
                </div>
                <div className="flex gap-2">
                  {session.status === 'created' && (
                    <button
                      onClick={() => handleStartSession(session._id)}
                      disabled={sessionActionLoading[session._id] === 'start' || sessionActionLoading[session._id] === 'stop'}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sessionActionLoading[session._id] === 'start' ? 'Starting...' : 'Start'}
                    </button>
                  )}
                  {session.status === 'active' && (
                    <button
                      onClick={() => handleStopSession(session._id)}
                      disabled={sessionActionLoading[session._id] === 'start' || sessionActionLoading[session._id] === 'stop'}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sessionActionLoading[session._id] === 'stop' ? 'Stopping...' : 'Stop'}
                    </button>
                  )}
                  <Link
                    href={`/faculty/sessions/${session._id}`}
                    className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm text-center"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
