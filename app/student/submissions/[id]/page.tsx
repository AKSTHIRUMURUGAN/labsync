'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import StudentObservationTable from '@/app/components/TemplateEditor/StudentObservationTable';
import StudentCodeCompiler from '@/app/components/TemplateEditor/StudentCodeCompiler';

interface Submission {
  _id: string;
  status: string;
  observationData: any[];
  calculations: any[];
  results: string;
  conclusion: string;
  templateData?: {
    aim?: string;
    theory?: string;
    procedure?: string;
  };
  sectionData?: { [key: string]: any };
  experimentTemplateId?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewComments?: string;
  rejectionReason?: string;
}

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    observations: '',
    calculations: '',
    results: '',
    conclusion: '',
  });
  // Track edits to template sections (text, table, code, image, file)
  const [editSectionData, setEditSectionData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${id}`);
      const data = await response.json();
      if (data.success) {
        setSubmission(data.data);
        
        // Fetch template to get section structure
        if (data.data.experimentTemplateId) {
          const templateResponse = await fetch(`/api/templates/${data.data.experimentTemplateId}`);
          const templateData = await templateResponse.json();
          if (templateData.success) {
            setTemplate(templateData.data);
          }
        }
        
        // Extract data for editing
        const obs = data.data.observationData?.[0]?.rows?.[0]?.cells?.observation || '';
        const calc = data.data.calculations?.[0]?.formula || '';
        setFormData({
          observations: obs,
          calculations: calc,
          results: data.data.results || '',
          conclusion: data.data.conclusion || '',
        });
        // Pre-populate section edit state from saved sectionData
        setEditSectionData(data.data.sectionData || {});
      }
    } catch (error) {
      console.error('Failed to fetch submission', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setError('');
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          results: formData.results,
          conclusion: formData.conclusion,
          // Save updated section data when template sections are used
          sectionData: Object.keys(editSectionData).length > 0 ? editSectionData : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmission(data.data);
        setIsEditing(false);
      } else {
        setError(data.error?.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Failed to update submission', error);
      setError('Failed to save changes. Please try again.');
    }
  };

  const handleSubmitForReview = async () => {
    if (!confirm('Are you sure you want to submit this for review? You will not be able to edit it after submission.')) {
      return;
    }

    setError('');
    try {
      const response = await fetch(`/api/submissions/${id}/submit`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        router.push('/student/submissions');
      } else {
        setError(data.error?.message || 'Failed to submit for review');
      }
    } catch (error) {
      console.error('Failed to submit for review', error);
      setError('Failed to submit for review. Please try again.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    // If status is in_progress but has rejection reason, show orange
    if (status === 'in_progress' && submission?.rejectionReason) {
      return 'bg-orange-100 text-orange-800';
    }
    
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    // If status is in_progress but has rejection reason, show "Needs Revision"
    if (status === 'in_progress' && submission?.rejectionReason) {
      return 'Needs Revision';
    }
    
    switch (status) {
      case 'in_progress': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-center">
          <p className="text-[var(--ink3)] mb-4">Submission not found</p>
          <Link href="/student/submissions" className="text-[var(--accent)] hover:underline">
            Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = submission.status === 'in_progress';
  const canSubmit = submission.status === 'in_progress';

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/student/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
              LabSync
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/student/submissions" className="text-[var(--accent)] hover:text-[var(--accent2)] mb-4 inline-block">
            ← Back to Submissions
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Submission Details</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                {getStatusLabel(submission.status)}
              </span>
            </div>
            <div className="flex gap-3">
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white border border-[var(--paper3)] text-[var(--ink)] rounded-lg hover:border-[var(--accent)] transition"
                >
                  Edit
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white border border-[var(--paper3)] text-[var(--ink)] rounded-lg hover:border-[var(--accent)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition"
                  >
                    Save Changes
                  </button>
                </>
              )}
              {canSubmit && !isEditing && (
                <button
                  onClick={handleSubmitForReview}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Submit for Review
                </button>
              )}
              {submission.status === 'approved' && (
                <button
                  onClick={() => window.open(`/student/submissions/${id}/print`, '_blank')}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Manual
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Review Comments */}
        {submission.reviewComments && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">Faculty Comments</h3>
            <p className="text-blue-800">{submission.reviewComments}</p>
          </div>
        )}

        {/* Rejection Reason - Show helpful message for resubmission */}
        {submission.rejectionReason && (
          <div className={`mb-6 p-4 rounded-lg border ${
            submission.rejectionReason.startsWith('REDO_REQUESTED:')
              ? 'bg-amber-50 border-amber-300'
              : 'bg-orange-50 border-orange-300'
          }`}>
            {submission.rejectionReason.startsWith('REDO_REQUESTED:') ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <h3 className="font-bold text-amber-900">Redo Requested by Faculty</h3>
                </div>
                <p className="text-amber-800 mb-3">
                  {submission.rejectionReason.replace('REDO_REQUESTED:', '').trim()}
                </p>
                <p className="text-sm text-amber-700 bg-amber-100 p-2 rounded">
                  <strong>Your existing work is preserved.</strong> Review the guidance above, make the necessary changes, and resubmit.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-orange-900 mb-2">
                  {submission.status === 'in_progress' ? '⚠️ Submission Needs Revision' : 'Rejection Reason'}
                </h3>
                <p className="text-orange-800 mb-3">{submission.rejectionReason}</p>
                {submission.status === 'in_progress' && (
                  <p className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                    <strong>Action Required:</strong> Please review the feedback above, make necessary changes, and resubmit your work for review.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Template Fields (Read-only) */}
          {submission.templateData?.aim && (
            <div className="bg-gray-50 rounded-xl border border-[var(--paper3)] p-6">
              <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                Aim <span className="text-sm font-normal text-[var(--ink3)]">(From Template)</span>
              </label>
              <div className="text-[var(--ink3)] whitespace-pre-wrap">{submission.templateData.aim}</div>
            </div>
          )}

          {submission.templateData?.theory && (
            <div className="bg-gray-50 rounded-xl border border-[var(--paper3)] p-6">
              <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                Theory / Formula <span className="text-sm font-normal text-[var(--ink3)]">(From Template)</span>
              </label>
              <div className="text-[var(--ink3)] whitespace-pre-wrap">{submission.templateData.theory}</div>
            </div>
          )}

          {submission.templateData?.procedure && (
            <div className="bg-gray-50 rounded-xl border border-[var(--paper3)] p-6">
              <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                Procedure <span className="text-sm font-normal text-[var(--ink3)]">(From Template)</span>
              </label>
              <div className="text-[var(--ink3)] whitespace-pre-wrap">{submission.templateData.procedure}</div>
            </div>
          )}

          {/* Editable Fields - Only show if no template sections */}
          {!template?.sections && (
            <>
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                  Observations
                </label>
                {isEditing ? (
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
                  />
                ) : (
                  <div className="text-[var(--ink)] whitespace-pre-wrap">{formData.observations || 'Not provided'}</div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                  Calculations
                </label>
                {isEditing ? (
                  <textarea
                    name="calculations"
                    value={formData.calculations}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
                  />
                ) : (
                  <div className="text-[var(--ink)] whitespace-pre-wrap">{formData.calculations || 'Not provided'}</div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                  Result / Output
                </label>
                {isEditing ? (
                  <textarea
                    name="results"
                    value={formData.results}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
                  />
                ) : (
                  <div className="text-[var(--ink)] whitespace-pre-wrap">{formData.results || 'Not provided'}</div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <label className="block text-lg font-bold text-[var(--ink)] heading mb-2">
                  Conclusion
                </label>
                {isEditing ? (
                  <textarea
                    name="conclusion"
                    value={formData.conclusion}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
                  />
                ) : (
                  <div className="text-[var(--ink)] whitespace-pre-wrap">{formData.conclusion || 'Not provided'}</div>
                )}
              </div>
            </>
          )}

          {/* Render Code and Table Sections from Template */}
          {template?.sections && template.sections.map((section: any, index: number) => {
            // Use editSectionData when editing, otherwise fall back to saved sectionData
            const savedData = submission?.sectionData?.[section.id];
            const currentData = isEditing
              ? (editSectionData[section.id] ?? savedData)
              : savedData;

            // Non-editable heading — always read-only
            if (section.type === 'heading' && !section.editable) {
              return (
                <div key={section.id} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h2 className="text-2xl font-bold text-[var(--ink)] heading">{section.content}</h2>
                </div>
              );
            }

            // Non-editable text — always read-only
            if (section.type === 'text' && !section.editable) {
              return (
                <div key={section.id} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <div className="prose max-w-none text-[var(--ink2)]" dangerouslySetInnerHTML={{ __html: section.content }} />
                </div>
              );
            }

            // Editable text section
            if (section.type === 'text' && section.editable) {
              let title = section.title || 'Text Section';
              for (let i = index - 1; i >= 0; i--) {
                if (template.sections[i].type === 'heading') {
                  title = template.sections[i].content;
                  break;
                }
              }
              return (
                <div key={section.id} className={`bg-white rounded-xl border-2 p-6 ${isEditing ? 'border-[var(--accent)]' : 'border-[var(--paper3)]'}`}>
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                    {title}
                    {isEditing && <span className="text-xs font-normal text-[var(--accent)] bg-blue-50 px-2 py-1 rounded">Editing</span>}
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editSectionData[section.id]?.data ?? (savedData?.data || '')}
                      onChange={(e) => setEditSectionData(prev => ({
                        ...prev,
                        [section.id]: { type: 'text', data: e.target.value, title }
                      }))}
                      rows={6}
                      className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none resize-none"
                      placeholder="Enter your text..."
                    />
                  ) : (
                    <div className="text-[var(--ink2)] whitespace-pre-wrap p-3 bg-[var(--paper)] rounded-lg">
                      {currentData?.data || 'Not provided'}
                    </div>
                  )}
                </div>
              );
            }

            // Editable table section
            if (section.type === 'table' && section.content) {
              const tableData = currentData?.data || section.content;
              return (
                <div key={section.id} className={`bg-white rounded-xl border-2 p-6 ${isEditing && section.editable ? 'border-[var(--accent)]' : 'border-[var(--paper3)]'}`}>
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                    {section.content.name || 'Observation Table'}
                    {isEditing && section.editable && <span className="text-xs font-normal text-[var(--accent)] bg-blue-50 px-2 py-1 rounded">Editing</span>}
                  </h3>
                  <StudentObservationTable
                    tableData={tableData}
                    readOnly={!isEditing || !section.editable}
                    onChange={(data) => {
                      if (isEditing && section.editable) {
                        setEditSectionData(prev => ({ ...prev, [section.id]: { type: 'table', data } }));
                      }
                    }}
                  />
                </div>
              );
            }

            // Editable code section
            if (section.type === 'code' && section.content) {
              const codeData = {
                ...section.content,
                code: (isEditing ? editSectionData[section.id]?.data?.code : savedData?.data?.code) ?? section.content.code,
                language: (isEditing ? editSectionData[section.id]?.data?.language : savedData?.data?.language) ?? section.content.selectedLanguage,
              };
              return (
                <div key={section.id} className={`bg-white rounded-xl border-2 p-6 ${isEditing && section.editable ? 'border-[var(--accent)]' : 'border-[var(--paper3)]'}`}>
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                    {section.content.problemTitle || 'Code Problem'}
                    {isEditing && section.editable && <span className="text-xs font-normal text-[var(--accent)] bg-blue-50 px-2 py-1 rounded">Editing</span>}
                  </h3>
                  <StudentCodeCompiler
                    codeData={codeData}
                    readOnly={!isEditing || !section.editable}
                    onChange={(data) => {
                      if (isEditing && section.editable) {
                        setEditSectionData(prev => ({ ...prev, [section.id]: { type: 'code', data } }));
                      }
                    }}
                  />
                </div>
              );
            }

            // Image upload section
            if (section.type === 'imageUpload') {
              return (
                <div key={section.id} className={`bg-white rounded-xl border-2 p-6 ${isEditing ? 'border-[var(--accent)]' : 'border-[var(--paper3)]'}`}>
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                    {section.title || 'Upload Image'}
                    {isEditing && <span className="text-xs font-normal text-[var(--accent)] bg-blue-50 px-2 py-1 rounded">Editing</span>}
                  </h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-[var(--paper3)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditSectionData(prev => ({
                                  ...prev,
                                  [section.id]: { type: 'imageUpload', data: reader.result as string, fileName: file.name }
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id={`edit-image-${section.id}`}
                        />
                        <label htmlFor={`edit-image-${section.id}`} className="cursor-pointer">
                          <svg className="w-10 h-10 mx-auto mb-2 text-[var(--ink3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium text-[var(--ink)]">Click to replace image</p>
                        </label>
                      </div>
                      {(editSectionData[section.id]?.data || savedData?.data) && (
                        <img
                          src={editSectionData[section.id]?.data || savedData?.data}
                          alt="Uploaded"
                          className="max-w-full h-auto rounded-lg border border-[var(--paper3)]"
                        />
                      )}
                    </div>
                  ) : (
                    currentData?.data ? (
                      <div className="space-y-3">
                        <img src={currentData.data} alt={currentData.fileName || 'Uploaded image'} className="max-w-full h-auto rounded-lg border border-[var(--paper3)] shadow-sm" />
                        {currentData.fileName && <p className="text-sm text-[var(--ink3)]"><strong>File:</strong> {currentData.fileName}</p>}
                      </div>
                    ) : <p className="text-[var(--ink3)]">No image uploaded</p>
                  )}
                </div>
              );
            }

            // File upload section
            if (section.type === 'fileUpload') {
              return (
                <div key={section.id} className={`bg-white rounded-xl border-2 p-6 ${isEditing ? 'border-[var(--accent)]' : 'border-[var(--paper3)]'}`}>
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                    {section.title || 'Upload File'}
                    {isEditing && <span className="text-xs font-normal text-[var(--accent)] bg-blue-50 px-2 py-1 rounded">Editing</span>}
                  </h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-[var(--paper3)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition">
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditSectionData(prev => ({
                                  ...prev,
                                  [section.id]: { type: 'fileUpload', data: reader.result as string, fileName: file.name, fileType: file.type, fileSize: file.size }
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id={`edit-file-${section.id}`}
                        />
                        <label htmlFor={`edit-file-${section.id}`} className="cursor-pointer">
                          <svg className="w-10 h-10 mx-auto mb-2 text-[var(--ink3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm font-medium text-[var(--ink)]">Click to replace file</p>
                        </label>
                      </div>
                      {(editSectionData[section.id] || savedData) && (
                        <p className="text-sm text-[var(--ink3)]">Current: {(editSectionData[section.id] || savedData)?.fileName}</p>
                      )}
                    </div>
                  ) : (
                    currentData?.data ? (
                      <div className="p-4 bg-[var(--paper)] rounded-lg border border-[var(--paper3)]">
                        <div className="flex items-center gap-3">
                          <svg className="w-10 h-10 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                          </svg>
                          <div className="flex-1">
                            <p className="font-medium text-[var(--ink)]">{currentData.fileName || 'Uploaded file'}</p>
                            {currentData.fileSize && <p className="text-sm text-[var(--ink3)]">Size: {(currentData.fileSize / 1024).toFixed(2)} KB</p>}
                          </div>
                          <a href={currentData.data} download={currentData.fileName} className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm">Download</a>
                        </div>
                      </div>
                    ) : <p className="text-[var(--ink3)]">No file uploaded</p>
                  )}
                </div>
              );
            }

            // Divider
            if (section.type === 'divider') {
              return <hr key={section.id} className="my-2 border-t-2 border-[var(--paper3)]" />;
            }

            return null;
          })}
        </div>
      </main>
    </div>
  );
}
