'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Template {
  _id: string;
  title: string;
  description: string;
  objectives?: string[];
  departmentId?: string;
}

export default function StudentExperimentsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

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
                <Link href="/student/experiments" className="text-[var(--accent)] font-medium">Experiments</Link>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Experiment Templates</h1>
          <p className="text-[var(--ink3)]">Choose an experiment to start your submission</p>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-12 text-center">
            <p className="text-[var(--ink3)] mb-4">No experiments available yet</p>
            <p className="text-sm text-[var(--ink3)]">Your faculty will create experiment templates soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template._id} className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
                <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">{template.title}</h3>
                <p className="text-[var(--ink3)] mb-4 line-clamp-3">{template.description}</p>
                {template.objectives && template.objectives.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-[var(--ink3)] mb-1">Objectives:</p>
                    <ul className="text-xs text-[var(--ink3)] list-disc list-inside">
                      {template.objectives.slice(0, 2).map((obj, idx) => (
                        <li key={idx} className="line-clamp-1">{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end">
                  <Link
                    href={`/student/experiments/new?template=${template._id}`}
                    className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm"
                  >
                    Start Experiment
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
