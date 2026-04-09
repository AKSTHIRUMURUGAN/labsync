import Link from 'next/link';

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-[var(--ink)] heading mb-4">Privacy Policy</h1>
        <p className="text-[var(--ink3)] mb-8">Last updated: April 5, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">1. Information We Collect</h2>
            <p className="text-[var(--ink2)] mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-[var(--ink2)] space-y-2">
              <li>Name, email address, and contact information</li>
              <li>Student enrollment number or employee ID</li>
              <li>Lab experiment submissions and related data</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">2. How We Use Your Information</h2>
            <p className="text-[var(--ink2)] mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-[var(--ink2)] space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and manage lab experiment submissions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">3. Information Sharing</h2>
            <p className="text-[var(--ink2)] mb-4">
              We do not share your personal information with third parties except:
            </p>
            <ul className="list-disc pl-6 text-[var(--ink2)] space-y-2">
              <li>With your consent</li>
              <li>With faculty and administrators within your institution</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">4. Data Security</h2>
            <p className="text-[var(--ink2)] mb-4">
              We take reasonable measures to help protect your personal information from loss, theft, misuse,
              unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">5. Data Retention</h2>
            <p className="text-[var(--ink2)] mb-4">
              We retain your information for as long as your account is active or as needed to provide you services.
              Academic records may be retained according to institutional policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">6. Your Rights</h2>
            <p className="text-[var(--ink2)] mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-[var(--ink2)] space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">7. Cookies</h2>
            <p className="text-[var(--ink2)] mb-4">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information.
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">8. Changes to This Policy</h2>
            <p className="text-[var(--ink2)] mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-4">9. Contact Us</h2>
            <p className="text-[var(--ink2)] mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <p className="text-[var(--ink2)]">
              Email: privacy@labsync.edu<br />
              Address: 123 Education Street, Academic City, AC 12345
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
