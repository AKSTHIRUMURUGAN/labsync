'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function NewExperimentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    aim: '',
    theory: '',
    procedure: '',
    observations: '',
    calculations: '',
    result: '',
    conclusion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      const data = await response.json();
      if (data.success) {
        setTemplate(data.data);
        // Pre-fill form with template content
        prefillFormFromTemplate(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch template', error);
    }
  };

  const prefillFormFromTemplate = (templateData: any) => {
    if (!templateData) return;

    const newFormData: any = {
      aim: '',
      theory: '',
      procedure: '',
      observations: '',
      calculations: '',
      result: '',
      conclusion: '',
    };

    // Extract content from template sections
    if (templateData.sections && Array.isArray(templateData.sections)) {
      templateData.sections.forEach((section: any) => {
        const sectionTitle = section.title?.toLowerCase() || '';
        
        // Extract text content from section blocks
        const textContent = section.blocks
          ?.filter((block: any) => block.type === 'text' || block.type === 'heading')
          .map((block: any) => block.content)
          .join('\n\n') || '';

        // Map section titles to form fields
        if (sectionTitle.includes('aim') || sectionTitle.includes('objective')) {
          newFormData.aim = textContent;
        } else if (sectionTitle.includes('theory') || sectionTitle.includes('formula')) {
          newFormData.theory = textContent;
        } else if (sectionTitle.includes('procedure') || sectionTitle.includes('steps')) {
          newFormData.procedure = textContent;
        } else if (sectionTitle.includes('observation')) {
          newFormData.observations = textContent;
        } else if (sectionTitle.includes('calculation')) {
          newFormData.calculations = textContent;
        } else if (sectionTitle.includes('result') || sectionTitle.includes('output')) {
          newFormData.result = textContent;
        } else if (sectionTitle.includes('conclusion')) {
          newFormData.conclusion = textContent;
        }
      });
    }

    // Also use objectives and steps if available
    if (templateData.objectives && Array.isArray(templateData.objectives)) {
      if (!newFormData.aim) {
        newFormData.aim = templateData.objectives.join('\n');
      }
    }

    if (templateData.steps && Array.isArray(templateData.steps)) {
      if (!newFormData.procedure) {
        newFormData.procedure = templateData.steps
          .map((step: any, idx: number) => `${idx + 1}. ${step.instruction || step}`)
          .join('\n');
      }
    }

    setFormData(newFormData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'submitted') => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          experimentTitle: template?.title || 'New Experiment',
          ...formData,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/student/submissions');
      } else {
        setError(data.error.message);
      }
    } catch (error) {
      setError('Failed to save submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/student/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
              LabSync
            </Link>
            <Link href="/student/experiments" className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Back to Experiments
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">
            {template?.title || 'New Experiment'}
          </h1>
          <p className="text-[var(--ink3)]">{template?.description}</p>
          {template && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Template loaded:</strong> The form has been pre-filled with template content. You can edit any section as needed.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-6">
          {/* Aim */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
              Aim
            </label>
            <textarea
              name="aim"
              value={formData.aim}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
              placeholder="State the objective of the experiment (pre-filled from template if available)..."
            />
          </div>

          {/* Theory */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
              Theory / Formula
            </label>
            <textarea
              name="theory"
              value={formData.theory}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
              placeholder="Explain the theoretical background and formulas (pre-filled from template if available)..."
            />
          </div>

          {/* Procedure */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
              Procedure
            </label>
            <textarea
              name="procedure"
              value={formData.procedure}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
              placeholder="List the steps you followed (pre-filled from template if available)..."
            />
          </div>

          {/* Observations */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
              Observations
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
              placeholder="Record your observations and measurements..."
            />
          </div>

          {/* Calculations */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
              Calculations
            </label>
            <textarea
              name="calculations"
              value={formData.calculations}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
              placeholder="Show your calculations and working..."
            />
          </div>

          {/* Result */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
              Result / Output
            </label>
            <textarea
              name="result"
              value={formData.result}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
              placeholder="State the final result or output..."
            />
          </div>

          {/* Conclusion */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
              Conclusion
            </label>
            <textarea
              name="conclusion"
              value={formData.conclusion}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
              placeholder="Write your conclusion and learning outcomes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-white border border-[var(--paper3)] text-[var(--ink)] rounded-lg hover:border-[var(--accent)] transition disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'submitted')}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewExperimentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    }>
      <NewExperimentForm />
    </Suspense>
  );
}
