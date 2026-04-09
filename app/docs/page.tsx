import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--ink)] heading mb-6">
            Documentation
          </h1>
          <p className="text-xl text-[var(--ink3)] max-w-2xl mx-auto">
            Everything you need to know about using LabSync
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Getting Started */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">Getting Started</h3>
              <p className="text-[var(--ink3)] mb-4">Learn the basics of LabSync and set up your account</p>
              <ul className="space-y-2 text-sm text-[var(--ink3)]">
                <li>• Creating an account</li>
                <li>• Navigating the dashboard</li>
                <li>• Understanding roles</li>
                <li>• First submission</li>
              </ul>
            </div>

            {/* For Students */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">For Students</h3>
              <p className="text-[var(--ink3)] mb-4">Complete guide for students using LabSync</p>
              <ul className="space-y-2 text-sm text-[var(--ink3)]">
                <li>• Creating submissions</li>
                <li>• Experiment templates</li>
                <li>• Tracking progress</li>
                <li>• Viewing feedback</li>
              </ul>
            </div>

            {/* For Faculty */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">For Faculty</h3>
              <p className="text-[var(--ink3)] mb-4">Tools and features for faculty members</p>
              <ul className="space-y-2 text-sm text-[var(--ink3)]">
                <li>• Reviewing submissions</li>
                <li>• Managing lab sessions</li>
                <li>• Creating templates</li>
                <li>• Providing feedback</li>
              </ul>
            </div>

            {/* For Coordinators */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">For Coordinators</h3>
              <p className="text-[var(--ink3)] mb-4">Department management and coordination</p>
              <ul className="space-y-2 text-sm text-[var(--ink3)]">
                <li>• Managing lab groups</li>
                <li>• Assigning faculty</li>
                <li>• Generating reports</li>
                <li>• Monitoring progress</li>
              </ul>
            </div>

            {/* For Administrators */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">For Administrators</h3>
              <p className="text-[var(--ink3)] mb-4">Institution-wide management and settings</p>
              <ul className="space-y-2 text-sm text-[var(--ink3)]">
                <li>• Institution setup</li>
                <li>• User management</li>
                <li>• Analytics dashboard</li>
                <li>• System configuration</li>
              </ul>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
              <div className="w-12 h-12 bg-[var(--accent3)] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">FAQ</h3>
              <p className="text-[var(--ink3)] mb-4">Frequently asked questions and answers</p>
              <ul className="space-y-2 text-sm text-[var(--ink3)]">
                <li>• Account issues</li>
                <li>• Submission problems</li>
                <li>• Technical support</li>
                <li>• Best practices</li>
              </ul>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mt-12 bg-[var(--accent3)] rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">Need More Help?</h2>
            <p className="text-[var(--ink3)] mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/contact"
                className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
              >
                Contact Support
              </Link>
              <a
                href="mailto:support@labsync.edu"
                className="px-6 py-3 bg-white text-[var(--ink)] rounded-lg hover:bg-[var(--paper)] transition border border-[var(--paper3)]"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
