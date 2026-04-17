'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LabGroup {
  _id: string;
  name: string;
  className: string;
  semester: string;
}

interface Template {
  _id: string;
  title: string;
  description: string;
}

const MIN_SESSION_DURATION_MINUTES = 30;
const MAX_SESSION_DURATION_MINUTES = 480;

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [labGroups, setLabGroups] = useState<LabGroup[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState({
    labGroupId: '',
    experimentTemplateId: '',
    location: '',
    duration: 120,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchLabGroups();
    fetchTemplates();
  }, []);

  const fetchLabGroups = async () => {
    try {
      const response = await fetch('/api/lab-groups');
      const data = await response.json();
      if (data.success) {
        setLabGroups(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch lab groups', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const numericDuration = Number(formData.duration);
    if (
      !Number.isFinite(numericDuration) ||
      numericDuration < MIN_SESSION_DURATION_MINUTES ||
      numericDuration > MAX_SESSION_DURATION_MINUTES
    ) {
      setErrors({
        duration: `Duration must be between ${MIN_SESSION_DURATION_MINUTES} and ${MAX_SESSION_DURATION_MINUTES} minutes`,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: numericDuration,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/faculty/sessions');
      } else {
        if (data.error?.fields) {
          setErrors(data.error.fields);
        } else {
          setErrors({ general: data.error?.message || 'Failed to create session' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Failed to create session' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
                <Link href="/faculty/reviews" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reviews</Link>
                <Link href="/faculty/sessions" className="text-[var(--accent)] font-medium">Sessions</Link>
                <Link href="/faculty/students" className="text-[var(--ink3)] hover:text-[var(--ink)]">Students</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/faculty/sessions" className="text-[var(--accent)] hover:text-[var(--accent2)] mb-4 inline-block">
            ← Back to Sessions
          </Link>
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Create New Lab Session</h1>
          <p className="text-[var(--ink3)]">Schedule a new lab session for your students</p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[var(--paper3)] p-6 space-y-6">
          {/* Lab Group Selection */}
          <div>
            <label htmlFor="labGroupId" className="block text-sm font-medium text-[var(--ink)] mb-2">
              Lab Group *
            </label>
            <select
              id="labGroupId"
              name="labGroupId"
              value={formData.labGroupId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                errors.labGroupId ? 'border-red-500' : 'border-[var(--paper3)]'
              }`}
              required
            >
              <option value="">Select a lab group</option>
              {labGroups.map(group => (
                <option key={group._id} value={group._id}>
                  {group.name} - {group.className} ({group.semester})
                </option>
              ))}
            </select>
            {errors.labGroupId && (
              <p className="mt-1 text-sm text-red-600">{errors.labGroupId}</p>
            )}
          </div>

          {/* Experiment Template Selection */}
          <div>
            <label htmlFor="experimentTemplateId" className="block text-sm font-medium text-[var(--ink)] mb-2">
              Experiment Template *
            </label>
            <select
              id="experimentTemplateId"
              name="experimentTemplateId"
              value={formData.experimentTemplateId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                errors.experimentTemplateId ? 'border-red-500' : 'border-[var(--paper3)]'
              }`}
              required
            >
              <option value="">Select an experiment</option>
              {templates.map(template => (
                <option key={template._id} value={template._id}>
                  {template.title}
                </option>
              ))}
            </select>
            {errors.experimentTemplateId && (
              <p className="mt-1 text-sm text-red-600">{errors.experimentTemplateId}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-[var(--ink)] mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Lab Room 101"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                errors.location ? 'border-red-500' : 'border-[var(--paper3)]'
              }`}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-[var(--ink)] mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min={MIN_SESSION_DURATION_MINUTES}
              max={MAX_SESSION_DURATION_MINUTES}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                errors.duration ? 'border-red-500' : 'border-[var(--paper3)]'
              }`}
              required
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
            )}
            <p className="mt-1 text-sm text-[var(--ink3)]">
              Allowed range: {MIN_SESSION_DURATION_MINUTES}-{MAX_SESSION_DURATION_MINUTES} minutes
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
            <Link
              href="/faculty/sessions"
              className="px-6 py-3 bg-white text-[var(--ink3)] border border-[var(--paper3)] rounded-lg hover:border-[var(--accent)] transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
