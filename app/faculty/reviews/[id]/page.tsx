'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import StudentObservationTable from '@/app/components/TemplateEditor/StudentObservationTable';
import StudentCodeCompiler from '@/app/components/TemplateEditor/StudentCodeCompiler';

interface ObservationRow {
  rowId: string;
  cells: { [columnId: string]: any };
}

interface ObservationData {
  tableId: string;
  tableName: string;
  rows: ObservationRow[];
}

interface CalculationResult {
  columnId: string;
  formula: string;
  result: number;
  dependencies: { [columnId: string]: any };
}

interface Submission {
  _id: string;
  experimentTitle: string;
  experimentTemplateId?: string;
  observationData: ObservationData[];
  calculations: CalculationResult[];
  results: string;
  conclusion: string;
  status: string;
  submittedAt: string;
  studentName: string;
  templateData?: any;
  sectionData?: { [key: string]: any };
}

export default function FacultyReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        console.log('📥 Received submission data:', data.data);
        console.log('📊 sectionData:', data.data.sectionData);
        console.log('📋 Number of sections:', data.data.sectionData ? Object.keys(data.data.sectionData).length : 0);
        setSubmission(data.data);
        
        // Fetch template to get section structure
        if (data.data.experimentTemplateId) {
          const templateResponse = await fetch(`/api/templates/${data.data.experimentTemplateId}`);
          const templateData = await templateResponse.json();
          if (templateData.success) {
            console.log('📄 Template sections:', templateData.data.sections);
            setTemplate(templateData.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch submission', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: 'approve' | 'reject' | 'redo') => {
    if (!reviewComments.trim()) {
      alert(action === 'redo'
        ? 'Please provide guidance on what the student needs to redo'
        : 'Please provide review comments');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/submissions/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          comments: reviewComments,
          reason: reviewComments // For reject API compatibility
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/faculty/reviews');
      } else {
        alert(data.error?.message || 'Failed to submit review');
      }
    } catch (error) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
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
          <Link href="/faculty/reviews" className="text-[var(--accent)] hover:underline">
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/faculty/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
              LabSync
            </Link>
            <Link href="/faculty/reviews" className="text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Back to Reviews
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">
            {submission.experimentTitle}
          </h1>
          <div className="flex gap-4 text-sm text-[var(--ink3)]">
            <span>Student: {submission.studentName || 'Unknown'}</span>
            <span>•</span>
            <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 mb-8">
          {/* Template Data Sections - Only show if no template sections */}
          {submission.templateData && Object.keys(submission.templateData).length > 0 && !template?.sections && (
            <>
              {Object.entries(submission.templateData).map(([key, value]) => (
                <div key={key} className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="text-[var(--ink2)] whitespace-pre-wrap">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Legacy fields - Only show if template doesn't have sections */}
          {!template?.sections && (
            <>
              {/* Observations */}
              {submission.observationData && submission.observationData.length > 0 && (
                <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Observations</h3>
                  {submission.observationData.map((table) => (
                    <div key={table.tableId} className="mb-4">
                      <h4 className="font-medium text-[var(--ink)] mb-2">{table.tableName}</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-[var(--paper3)]">
                          <tbody>
                            {table.rows.map((row) => (
                              <tr key={row.rowId} className="border-b border-[var(--paper3)]">
                                {Object.entries(row.cells).map(([colId, value]) => (
                                  <td key={colId} className="px-4 py-2 border-r border-[var(--paper3)]">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Calculations */}
              {submission.calculations && submission.calculations.length > 0 && (
                <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Calculations</h3>
                  <div className="space-y-3">
                    {submission.calculations.map((calc, idx) => (
                      <div key={idx} className="p-3 bg-[var(--paper)] rounded-lg">
                        <div className="text-sm text-[var(--ink3)] mb-1">Formula: {calc.formula}</div>
                        <div className="text-[var(--ink)] font-medium">Result: {calc.result}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Result / Output</h3>
                <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.results || 'Not provided'}</p>
              </div>

              {/* Conclusion */}
              <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
                <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">Conclusion</h3>
                <p className="text-[var(--ink2)] whitespace-pre-wrap">{submission.conclusion || 'Not provided'}</p>
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
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">
                    {title}
                    <span className="text-sm font-normal text-[var(--ink3)] ml-2">(Student Submission)</span>
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
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">
                    {section.title || 'Uploaded Image'}
                    <span className="text-sm font-normal text-[var(--ink3)] ml-2">(Student Submission)</span>
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
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">
                    {section.title || 'Uploaded File'}
                    <span className="text-sm font-normal text-[var(--ink3)] ml-2">(Student Submission)</span>
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
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">
                    {section.content.name || 'Observation Table'}
                    <span className="text-sm font-normal text-[var(--ink3)] ml-2">(Student Submission)</span>
                  </h3>
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
                  <h3 className="text-lg font-bold text-[var(--ink)] heading mb-3">
                    {section.content.problemTitle || 'Code Problem'}
                    <span className="text-sm font-normal text-[var(--ink3)] ml-2">(Student Submission)</span>
                  </h3>
                  <StudentCodeCompiler 
                    codeData={codeData}
                    readOnly={false}
                  />
                  {studentData?.data?.testResults && studentData.data.testResults.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-[var(--ink)] mb-2">Student's Test Results:</h4>
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

        {/* Review Section */}
        {submission.status === 'submitted' && (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h3 className="text-lg font-bold text-[var(--ink)] heading mb-4">Review Submission</h3>
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                Comments / Guidance
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none"
                placeholder="Provide feedback, approval notes, or redo guidance for the student..."
              />
            </div>

            {/* Three action buttons */}
            <div className="flex gap-3">
              {/* Reject */}
              <button
                onClick={() => handleReview('reject')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {submitting ? 'Processing...' : 'Reject'}
              </button>

              {/* Request Redo — between Reject and Approve */}
              <button
                onClick={() => handleReview('redo')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 font-medium"
                title="Student keeps their work and can edit & resubmit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {submitting ? 'Processing...' : 'Request Redo'}
              </button>

              {/* Approve */}
              <button
                onClick={() => handleReview('approve')}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {submitting ? 'Processing...' : 'Approve'}
              </button>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[var(--ink3)]">
              <p className="text-center">Reject — work is wrong, student must start fresh</p>
              <p className="text-center text-amber-700">Request Redo — student edits existing work and resubmits</p>
              <p className="text-center">Approve — work is complete and correct</p>
            </div>
          </div>
        )}

        {submission.status === 'approved' && (
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-green-600 mb-2">✓ Submission Approved</h3>
                <p className="text-[var(--ink3)] text-sm">This submission has been approved</p>
              </div>
              <button
                onClick={() => window.open(`/faculty/reviews/${id}/print`, '_blank')}
                className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Lab Manual
              </button>
            </div>
          </div>
        )}

        {submission.status === 'rejected' && (
          <div className="bg-[var(--paper)] rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">This submission has been rejected</p>
          </div>
        )}
      </main>
    </div>
  );
}
