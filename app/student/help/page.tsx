'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentHelpPage() {
  const router = useRouter();

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
              <Link href="/student/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/student/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/student/experiments" className="text-[var(--ink3)] hover:text-[var(--ink)]">Experiments</Link>
                <Link href="/student/submissions" className="text-[var(--ink3)] hover:text-[var(--ink)]">Submissions</Link>
              </nav>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Help & Support</h1>
          <p className="text-[var(--ink3)]">Find answers to common questions</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/docs"
            className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--ink)] heading mb-1">Documentation</h3>
                <p className="text-sm text-[var(--ink3)]">Complete guides and tutorials</p>
              </div>
            </div>
          </Link>

          <Link
            href="/contact"
            className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--ink)] heading mb-1">Contact Support</h3>
                <p className="text-sm text-[var(--ink3)]">Get help from our team</p>
              </div>
            </div>
          </Link>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
          <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">How do I create a new submission?</h3>
              <p className="text-[var(--ink3)]">
                Navigate to the Experiments page, select a template, and click "Start". Fill in all required fields
                and either save as draft or submit for review.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Can I edit a submission after submitting?</h3>
              <p className="text-[var(--ink3)]">
                Once submitted, you cannot edit the submission. However, if it's rejected, you can create a new
                submission incorporating the feedback provided.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">How long does review take?</h3>
              <p className="text-[var(--ink3)]">
                Review times vary depending on your faculty's workload. Typically, submissions are reviewed within
                2-3 business days.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">What happens if my submission is rejected?</h3>
              <p className="text-[var(--ink3)]">
                You'll receive detailed feedback from your faculty. Review the comments, make necessary improvements,
                and create a new submission.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Can I save my work as a draft?</h3>
              <p className="text-[var(--ink3)]">
                Yes! Click "Save as Draft" to save your progress. You can return to edit and submit it later.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Card */}
        <div className="mt-8 bg-[var(--accent3)] rounded-xl p-6">
          <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Still need help?</h3>
          <p className="text-[var(--ink3)] mb-4">
            Contact our support team at support@labsync.edu or visit the contact page.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
          >
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}
