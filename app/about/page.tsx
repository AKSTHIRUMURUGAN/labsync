import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--ink)] heading mb-6">
            About LabSync
          </h1>
          <p className="text-xl text-[var(--ink3)] max-w-2xl mx-auto">
            Transforming laboratory education through digital innovation
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[var(--ink)] heading mb-6">Our Mission</h2>
              <p className="text-[var(--ink2)] mb-4">
                LabSync is dedicated to revolutionizing laboratory education by replacing outdated paper-based
                systems with a modern, efficient, and eco-friendly digital platform.
              </p>
              <p className="text-[var(--ink2)]">
                We believe that students and educators deserve tools that enhance learning, streamline workflows,
                and contribute to a sustainable future.
              </p>
            </div>
            <div className="bg-[var(--accent3)] rounded-2xl p-8">
              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-[var(--accent)] heading mb-2">10,000+</div>
                  <div className="text-[var(--ink3)]">Students using LabSync</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[var(--accent)] heading mb-2">500+</div>
                  <div className="text-[var(--ink3)]">Faculty members</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-[var(--accent)] heading mb-2">50+</div>
                  <div className="text-[var(--ink3)]">Institutions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--ink)] heading mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--accent3)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">Quality</h3>
              <p className="text-[var(--ink3)]">
                We maintain the highest standards in education technology
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--accent3)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">Innovation</h3>
              <p className="text-[var(--ink3)]">
                Continuously improving through technology and feedback
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--accent3)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">Sustainability</h3>
              <p className="text-[var(--ink3)]">
                Committed to reducing environmental impact
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--ink)] heading mb-12 text-center">Our Story</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-[var(--ink2)] mb-4">
              LabSync was born from the frustration of managing countless paper lab manuals, dealing with lost submissions,
              and the environmental impact of printing thousands of pages each semester.
            </p>
            <p className="text-[var(--ink2)] mb-4">
              Our founders, a group of educators and technologists, came together with a vision: to create a platform
              that would make laboratory education more efficient, accessible, and sustainable.
            </p>
            <p className="text-[var(--ink2)]">
              Today, LabSync serves institutions across the country, helping thousands of students and faculty members
              streamline their laboratory workflows while contributing to a greener future.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
