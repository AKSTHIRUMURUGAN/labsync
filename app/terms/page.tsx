import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-[var(--ink)] heading">
              LabSync
            </Link>
            <Link href="/" className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-[var(--ink)] heading mb-4">Terms of Service</h1>
        <p className="text-[var(--ink3)] mb-8">Last updated: April 5, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">1. Acceptance of Terms</h2>
            <p className="text-[var(--ink2)] mb-4">
              By accessing and using LabSync, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">2. Use License</h2>
            <p className="text-[var(--ink2)] mb-4">
              Permission is granted to temporarily access LabSync for personal, non-commercial transitory viewing only.
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-[var(--ink2)] space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or other proprietary notations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">3. User Accounts</h2>
            <p className="text-[var(--ink2)] mb-4">
              When you create an account with us, you must provide accurate, complete, and current information.
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">4. Intellectual Property</h2>
            <p className="text-[var(--ink2)] mb-4">
              The service and its original content, features, and functionality are and will remain the exclusive property
              of LabSync and its licensors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">5. Termination</h2>
            <p className="text-[var(--ink2)] mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
              including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">6. Limitation of Liability</h2>
            <p className="text-[var(--ink2)] mb-4">
              In no event shall LabSync, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable
              for any indirect, incidental, special, consequential or punitive damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">7. Contact Us</h2>
            <p className="text-[var(--ink2)] mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-[var(--ink2)]">
              Email: legal@labsync.edu<br />
              Address: 123 Education Street, Academic City, AC 12345
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
