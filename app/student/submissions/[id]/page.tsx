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
          <div className="mb-6 p-4 bg-orange-50 border border-orange-300 rounded-lg">
            <h3 className="font-bold text-orange-900 mb-2">
              {submission.status === 'in_progress' ? '⚠️ Submission Needs Revision' : 'Rejection Reason'}
            </h3>
            <p className="text-orange-800 mb-3">{submission.rejectionReason}</p>
            {submission.status === 'in_progress' && (
              <p className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                <strong>Action Required:</strong> Please review the feedback above, make necessary changes, and resubmit your work for review.
              </p>
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
            const studentData = submission?.sectionData?.[section.id];
            
            // Render editable text sections - use previous heading as title
            if (section.type === 'text' && section.editable && studentData?.data) {
              // Find the previous heading section to use as title
              let title = 'Student Input';
              for (let i = index - 1; i >= 0; i--) {
                if (template.sections[i].type === 'heading') {
                  title = template.sections[i].content;
                  break;
                }
              }
              
              return (
                <div key={section.id} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4">
                    {title}
                  </h3>
                  <div className="text-[var(--ink2)] whitespace-pre-wrap p-3 bg-[var(--paper)] rounded-lg">
                    {studentData.data || 'Not provided'}
                  </div>
                </div>
              );
            }
            
            // Render image upload sections
            if (section.type === 'imageUpload' && studentData?.data) {
              return (
                <div key={section.id} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4">
                    {section.title || 'Uploaded Image'}
                  </h3>
                  <div className="space-y-3">
                    <img 
                      src={studentData.data} 
                      alt={studentData.fileName || 'Uploaded image'} 
                      className="max-w-full h-auto rounded-lg border border-[var(--paper3)] shadow-sm"
                    />
                    {studentData.fileName && (
                      <p className="text-sm text-[var(--ink3)]">
                        <strong>File:</strong> {studentData.fileName}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            
            // Render file upload sections
            if (section.type === 'fileUpload' && studentData?.data) {
              return (
                <div key={section.id} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4">
                    {section.title || 'Uploaded File'}
                  </h3>
                  <div className="p-4 bg-[var(--paper)] rounded-lg border border-[var(--paper3)]">
                    <div className="flex items-center gap-3">
                      <svg className="w-10 h-10 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--ink)]">{studentData.fileName || 'Uploaded file'}</p>
                        {studentData.fileSize && (
                          <p className="text-sm text-[var(--ink3)]">
                            Size: {(studentData.fileSize / 1024).toFixed(2)} KB
                          </p>
                        )}
                        {studentData.fileType && (
                          <p className="text-xs text-[var(--ink3)]">
                            Type: {studentData.fileType}
                          </p>
                        )}
                      </div>
                      <a
                        href={studentData.data}
                        download={studentData.fileName}
                        className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition text-sm"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              );
            }
            
            if (section.type === 'table' && section.content) {
              // Merge template structure with student data
              const tableData = studentData?.data || section.content;
              
              return (
                <div key={section.id} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4">{section.content.name || 'Observation Table'}</h3>
                  <StudentObservationTable 
                    tableData={tableData}
                    readOnly={true}
                  />
                </div>
              );
            }
            
            if (section.type === 'code' && section.content) {
              // Merge template structure with student code
              const codeData = {
                ...section.content,
                code: studentData?.data?.code || section.content.code,
                language: studentData?.data?.language || section.content.selectedLanguage
              };
              
              return (
                <div key={section.id} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-4">{section.content.problemTitle || 'Code Problem'}</h3>
                  <StudentCodeCompiler 
                    codeData={codeData}
                    readOnly={false}
                  />
                  {studentData?.data?.testResults && studentData.data.testResults.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-[var(--ink)] mb-2">Submission Test Results:</h4>
                      <div className="space-y-2">
                        {studentData.data.testResults.map((result: any, idx: number) => (
                          <div key={idx} className={`p-2 rounded text-sm ${
                            result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            Test Case {idx + 1}: {result.passed ? '✓ Passed' : '✗ Failed'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            return null;
          })}
        </div>
      </main>
    </div>
  );
}
