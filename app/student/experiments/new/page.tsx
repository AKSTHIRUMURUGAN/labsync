'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StudentObservationTable from '@/app/components/TemplateEditor/StudentObservationTable';
import StudentCodeCompiler from '@/app/components/TemplateEditor/StudentCodeCompiler';

function NewExperimentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const sessionId = searchParams.get('session');

  const [template, setTemplate] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [formData, setFormData] = useState({
    aim: '',
    theory: '',
    procedure: '',
    observations: '',
    calculations: '',
    result: '',
    conclusion: '',
  });
  const [sectionData, setSectionData] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if this is from an active session (read-only template fields)
  const isFromSession = !!sessionId;

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    } else if (templateId) {
      fetchTemplate();
    }
  }, [templateId, sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setSession(data.data);
        // Fetch the template from the session
        if (data.data.experimentTemplateId) {
          fetchTemplate(data.data.experimentTemplateId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch session', error);
    }
  };

  const fetchTemplate = async (id?: string) => {
    const tid = id || templateId;
    if (!tid) return;

    try {
      const response = await fetch(`/api/templates/${tid}`);
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
    // Don't allow editing read-only fields when from session
    const fieldName = e.target.name;
    if (isFromSession && (fieldName === 'aim' || fieldName === 'theory' || fieldName === 'procedure')) {
      return;
    }

    setFormData({
      ...formData,
      [fieldName]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'submitted') => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📤 Current sectionData state:', JSON.stringify(sectionData, null, 2));
      console.log('📊 Number of sections with data:', Object.keys(sectionData).length);
      
      // Prepare submission data according to the Submission model
      const submissionData: any = {
        experimentTemplateId: template?._id || templateId,
        experimentTitle: template?.title || 'Lab Experiment',
        labSessionId: sessionId || undefined,
        status: status === 'draft' ? 'in_progress' : 'submitted',
        observationData: formData.observations ? [{
          tableId: 'default',
          tableName: 'Observations',
          rows: [{
            rowId: '1',
            cells: { observation: formData.observations }
          }]
        }] : [],
        calculations: formData.calculations ? [{
          columnId: 'calc1',
          formula: formData.calculations,
          result: 0,
          dependencies: {}
        }] : [],
        results: formData.result || '',
        conclusion: formData.conclusion || '',
        // Store template fields in a custom field for reference
        templateData: {
          aim: formData.aim,
          theory: formData.theory,
          procedure: formData.procedure,
        },
        // Store section data (code and tables)
        sectionData: sectionData
      };

      console.log('📤 Submitting full data:', JSON.stringify(submissionData, null, 2));

      // If no session, we need to create one or handle differently
      if (!sessionId) {
        setError('No active session found. Please start from an active lab session.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();
      console.log('✅ Submission response:', data);

      if (data.success) {
        alert(`✓ Submission saved successfully! Section data: ${Object.keys(sectionData).length} sections`);
        router.push('/student/submissions');
      } else {
        setError(data.error?.message || 'Failed to save submission');
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
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
          {isFromSession && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Active Session:</strong> You are submitting for an active lab session. Template fields (Aim, Theory, Procedure) are read-only. Fill in your observations, calculations, results, and conclusion.
              </p>
            </div>
          )}
          {template && !isFromSession && (
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

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Render Template Sections */}
          {template?.sections && template.sections.length > 0 ? (
            <div className="space-y-6">
              {template.sections.map((section: any) => (
                <div key={section.id}>
                  {section.type === 'heading' && section.content && (
                    <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                      {section.editable ? (
                        <input
                          type="text"
                          defaultValue={section.content}
                          className="w-full text-2xl font-bold text-[var(--ink)] border border-[var(--paper3)] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--accent)] outline-none"
                          placeholder="Enter heading..."
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-[var(--ink)] heading">{section.content}</h2>
                      )}
                    </div>
                  )}
                  {section.type === 'text' && section.content && (
                    <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                      {section.editable ? (
                        <textarea
                          defaultValue={section.content.replace(/<[^>]*>/g, '')}
                          rows={5}
                          className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none resize-none"
                          placeholder="Enter your text..."
                        />
                      ) : (
                        <div 
                          className="prose max-w-none text-[var(--ink2)]" 
                          dangerouslySetInnerHTML={{ __html: section.content }} 
                        />
                      )}
                    </div>
                  )}
                  {section.type === 'image' && section.content && (
                    <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                      <div className={`text-${section.settings?.alignment || 'left'}`}>
                        <img 
                          src={section.content} 
                          alt="Template content" 
                          className="max-w-full h-auto rounded-lg shadow-md inline-block" 
                        />
                      </div>
                    </div>
                  )}
                  {section.type === 'divider' && (
                    <hr className="my-6 border-t-2 border-[var(--paper3)]" />
                  )}
                  {section.type === 'table' && section.content && (
                    <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                      <h3 className="text-xl font-bold text-[var(--ink)] mb-4">{section.content.name || 'Observation Table'}</h3>
                      <StudentObservationTable 
                        tableData={sectionData[section.id]?.data || section.content}
                        readOnly={!section.editable}
                        onChange={(data) => {
                          setSectionData(prev => ({
                            ...prev,
                            [section.id]: { type: 'table', data }
                          }));
                        }}
                      />
                      {section.editable && (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Data is already in sectionData, just show confirmation
                              alert('✓ Table data saved! Click "Save as Draft" or "Submit for Review" at the bottom to save your work.');
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            Save Table Data
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {section.type === 'code' && section.content && (
                    <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                      <h3 className="text-xl font-bold text-[var(--ink)] mb-4">{section.content.problemTitle || 'Code Problem'}</h3>
                      <StudentCodeCompiler 
                        codeData={{
                          ...section.content,
                          code: sectionData[section.id]?.data?.code || section.content.code,
                          language: sectionData[section.id]?.data?.language || section.content.selectedLanguage
                        }}
                        readOnly={!section.editable}
                        onChange={(data) => {
                          setSectionData(prev => ({
                            ...prev,
                            [section.id]: { type: 'code', data }
                          }));
                        }}
                      />
                      {section.editable && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Your code is automatically saved as you type. Click "Save as Draft" or "Submit for Review" at the bottom to save your complete submission.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Fallback to traditional form if no sections
            <>
              {/* Aim */}
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                  Aim {isFromSession && <span className="text-sm font-normal text-[var(--ink3)]">(Read-only)</span>}
                </label>
                <textarea
                  name="aim"
                  value={formData.aim}
                  onChange={handleChange}
                  readOnly={isFromSession}
                  rows={3}
                  className={`w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none ${
                    isFromSession ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="State the objective of the experiment..."
                />
              </div>

              {/* Theory */}
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                  Theory / Formula {isFromSession && <span className="text-sm font-normal text-[var(--ink3)]">(Read-only)</span>}
                </label>
                <textarea
                  name="theory"
                  value={formData.theory}
                  onChange={handleChange}
                  readOnly={isFromSession}
                  rows={5}
                  className={`w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none ${
                    isFromSession ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="Explain the theoretical background and formulas..."
                />
              </div>

              {/* Procedure */}
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                  Procedure {isFromSession && <span className="text-sm font-normal text-[var(--ink3)]">(Read-only)</span>}
                </label>
                <textarea
                  name="procedure"
                  value={formData.procedure}
                  onChange={handleChange}
                  readOnly={isFromSession}
                  rows={6}
                  className={`w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none ${
                    isFromSession ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="List the steps you followed..."
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
            </>
          )}

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
