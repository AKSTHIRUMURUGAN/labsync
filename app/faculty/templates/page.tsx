'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Template {
  _id: string;
  title: string;
  subject: string;
  difficulty: string;
  description: string;
  status: 'draft' | 'published';
  createdAt: string;
  usageCount: number;
}

export default function FacultyTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.status === filter);

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
                <Link href="/faculty/sessions" className="text-[var(--ink3)] hover:text-[var(--ink)]">Sessions</Link>
                <Link href="/faculty/templates" className="text-[var(--accent)] font-medium">Templates</Link>
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
            <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Experiment Templates</h1>
            <p className="text-[var(--ink3)]">Create and manage experiment templates</p>
          </div>
          <Link
            href="/faculty/templates/create"
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-white text-[var(--ink3)] border border-[var(--paper3)] hover:border-[var(--accent)]'
            }`}
          >
            All ({templates.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'published' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-white text-[var(--ink3)] border border-[var(--paper3)] hover:border-[var(--accent)]'
            }`}
          >
            Published ({templates.filter(t => t.status === 'published').length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'draft' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-white text-[var(--ink3)] border border-[var(--paper3)] hover:border-[var(--accent)]'
            }`}
          >
            Drafts ({templates.filter(t => t.status === 'draft').length})
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[var(--ink3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[var(--ink3)] mb-4">No templates found</p>
            <Link
              href="/faculty/templates/create"
              className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
            >
              Create Your First Template
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template._id} className="bg-white rounded-xl border border-[var(--paper3)] p-6 hover:border-[var(--accent)] transition">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs font-medium text-[var(--accent)] bg-[var(--accent3)] px-2 py-1 rounded">
                      {template.subject}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      template.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.status}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[var(--ink)] heading mb-2">{template.title}</h3>
                <p className="text-[var(--ink3)] text-sm mb-4 line-clamp-2">{template.description}</p>
                
                <div className="flex items-center justify-between text-sm text-[var(--ink3)] mb-4">
                  <span>{template.difficulty}</span>
                  <span>{template.usageCount || 0} uses</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/faculty/templates/${template._id}/edit`}
                    className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(template._id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
