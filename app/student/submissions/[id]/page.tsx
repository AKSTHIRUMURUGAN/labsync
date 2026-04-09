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
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewComments?: string;
}

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-center">
          <p className="text-[var(--ink3)] mb-4">Submission not found</p>
          <Link href="/student/submissions" className="text-[var(--accent)] hover:underline">
            Back to Submissions
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
            <Link href="/student/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
              LabSync
            </Link>
            <Link href="/student/submissions" className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Back to Submissions
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-[var(--ink)] heading">
              {submission.experimentTitle}
            </h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            </span>
          </div>
          <div className="flex gap-4 text-sm text-[var(--ink3)]">
            {submission.submittedAt && (
              <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
            )}
            {submission.reviewedAt && (
              <span>Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Review Comments */}
        {submission.reviewComments && (
          <div className={`mb-6 p-6 rounded-xl border ${
            submission.status === 'approved' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="font-bold text-[var(--ink)] mb-2">Review Comments</h3>
            <p className="text-[var(--ink2)]">{submission.reviewComments}</p>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-6">
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

        {/* Actions */}
        {submission.status === 'draft' && (
          <div className="mt-8 flex gap-4">
            <Link
              href={`/student/submissions/${id}/edit`}
              className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-center"
            >
              Edit Submission
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
