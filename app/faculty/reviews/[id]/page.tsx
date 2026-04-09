'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Submission {
  _id: string;
  experimentTitle: string;
  aim: string;
  theory: string;
  procedure: string;
  observations: string;
  calculations: string;
  result: string;
  conclusion: string;
  status: string;
  submittedAt: string;
  studentName: string;
}

export default function FacultyReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${id}`);
      const data = await response.json();
      if (data.success) {
        setSubmission(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch submission', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!reviewComments.trim()) {
      alert('Please provide review comments');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/submissions/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: reviewComments }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/faculty/reviews');
      } else {
        alert(data.error.message);
      }
    } catch (error) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-center">
          <p className="text-[var(--ink3)] mb-4">Submission not found</p>
          <Link href="/faculty/reviews" className="text-[var(--accent)] hover:underline">
            Back to Reviews
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
            <Link href="/faculty/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
              LabSync
            </Link>
            <Link href="/faculty/reviews" className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Back to Reviews
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">
            {submission.experimentTitle}
          </h1>
          <div className="flex gap-4 text-sm text-[var(--ink3)]">
            <span>Student: {submission.studentName || 'Unknown'}</span>
            <span>•</span>
            <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 mb-8">
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Aim</h3>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.aim || 'Not provided'}</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Theory</h3>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.theory || 'Not provided'}</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Procedure</h3>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.procedure || 'Not provided'}</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Observations</h3>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.observations || 'Not provided'}</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Calculations</h3>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.calculations || 'Not provided'}</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Result</h3>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.result || 'Not provided'}</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Conclusion</h3>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.conclusion || 'Not provided'}</p>
          </div>
        </div>

        {/* Review Section */}
        {submission.status === 'submitted' && (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-4">Review Submission</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                Review Comments
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
                placeholder="Provide feedback for the student..."
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleReview('reject')}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleReview('approve')}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        )}

        {submission.status !== 'submitted' && (
          <div className="bg-[var(--paper)] rounded-xl p-6 text-center">
            <p className="text-[var(--ink3)]">
              This submission has already been {submission.status}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
