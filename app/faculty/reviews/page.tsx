'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Submission {
  _id: string;
  experimentTitle: string;
  status: string;
  submittedAt: string;
  studentName: string;
}

export default function FacultyReviewsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('submitted');

  useEffect(() => {
    fetchSubmissions();
  }, []);

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
                <Link href="/faculty/reviews" className="text-[var(--accent)] font-medium">Reviews</Link>
                <Link href="/faculty/sessions" className="text-[var(--ink3)] hover:text-[var(--ink)]">Sessions</Link>
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
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Review Submissions</h1>
          <p className="text-[var(--ink3)]">Approve or reject student experiment submissions</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'submitted' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-white text-[var(--ink3)] border border-[var(--paper3)] hover:border-[var(--accent)]'
            }`}
          >
            Pending ({submissions.filter(s => s.status === 'submitted').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'approved' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-white text-[var(--ink3)] border border-[var(--paper3)] hover:border-[var(--accent)]'
            }`}
          >
            Approved ({submissions.filter(s => s.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'rejected' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-white text-[var(--ink3)] border border-[var(--paper3)] hover:border-[var(--accent)]'
            }`}
          >
            Rejected ({submissions.filter(s => s.status === 'rejected').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-white text-[var(--ink3)] border border-[var(--paper3)] hover:border-[var(--accent)]'
            }`}
          >
            All ({submissions.length})
          </button>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-12 text-center">
            <p className="text-[var(--ink3)]">No submissions to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div key={submission._id} className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">
                      {submission.experimentTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-[var(--ink3)]">
                      <span>Student: {submission.studentName || 'Unknown'}</span>
                      <span>•</span>
                      <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                    <Link
                      href={`/faculty/reviews/${submission._id}`}
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
