'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface TemplateSection {
  id: string;
  type: 'heading' | 'text' | 'image' | 'divider' | 'table' | 'code';
  content: any;
  editable?: boolean;
  settings?: {
    alignment?: string;
  };
}

interface ExperimentTemplate {
  _id: string;
  title: string;
  description: string;
  objectives: string[];
  steps: string[];
  sections?: TemplateSection[];
}

interface Submission {
  _id: string;
  experimentTitle: string;
  experimentTemplateId: string;
  observationData: ObservationData[];
  calculations: CalculationResult[];
  results: string;
  conclusion: string;
  status: string;
  submittedAt: string;
  studentName: string;
  templateData?: any;
  sectionData?: { [key: string]: any };
  reviewComments?: string;
  reviewedAt?: string;
}

export default function PrintSubmissionPage() {
  const params = useParams();
  const id = params.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [template, setTemplate] = useState<ExperimentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch submission
      const submissionResponse = await fetch(`/api/submissions/${id}`);
      const submissionData = await submissionResponse.json();
      
      if (submissionData.success) {
        console.log('📥 Print page - Received submission:', submissionData.data);
        console.log('📊 Print page - sectionData:', submissionData.data.sectionData);
        setSubmission(submissionData.data);
        
        // Fetch template
        const templateResponse = await fetch(`/api/templates/${submissionData.data.experimentTemplateId}`);
        const templateData = await templateResponse.json();
        
        if (templateData.success) {
          console.log('📄 Print page - Template sections:', templateData.data.sections);
          setTemplate(templateData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !submission) return;
    
    setGenerating(true);
    try {
      const element = contentRef.current;
      
      // Temporarily replace CSS variables with actual colors for html2canvas
      const originalStyles = element.style.cssText;
      element.style.cssText = `
        background: #ffffff;
        color: #000000;
      `;
      
      // Create canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.print-container');
          if (clonedElement) {
            // Remove any CSS variables that might cause issues
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el: any) => {
              if (el.style) {
                el.style.color = el.style.color || '#000000';
                el.style.backgroundColor = el.style.backgroundColor || 'transparent';
              }
            });
          }
        }
      });
      
      // Restore original styles
      element.style.cssText = originalStyles;
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      // Calculate how many pages needed
      const pageHeight = imgHeight * ratio;
      let heightLeft = pageHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }
      
      // Generate filename
      const filename = `Lab_Manual_${submission.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Submission not found</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          h1, h2, h3 {
            page-break-after: avoid;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
        }
        
        .print-container {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.6;
          color: #000000;
          background: #ffffff;
        }
        
        .print-container h1 {
          font-size: 24pt;
          font-weight: bold;
          margin-bottom: 8pt;
          color: #000000;
        }
        
        .print-container h2 {
          font-size: 16pt;
          font-weight: bold;
          margin-top: 12pt;
          margin-bottom: 8pt;
          border-bottom: 1px solid #000000;
          padding-bottom: 4pt;
          color: #000000;
        }
        
        .print-container h3 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 10pt;
          margin-bottom: 6pt;
          color: #000000;
        }
        
        .print-container p {
          margin-bottom: 8pt;
          text-align: justify;
          color: #000000;
        }
        
        .print-container ul, .print-container ol {
          margin-left: 20pt;
          margin-bottom: 8pt;
          color: #000000;
        }
        
        .print-container li {
          margin-bottom: 4pt;
          color: #000000;
        }
        
        .print-container table {
          width: 100%;
          border-collapse: collapse;
          margin: 10pt 0;
        }
        
        .print-container table td, .print-container table th {
          border: 1px solid #000000;
          padding: 6pt;
          color: #000000;
        }
        
        .print-container table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .print-container img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10pt auto;
        }
        
        .print-container .text-gray-600 {
          color: #4b5563;
        }
        
        .print-container .text-gray-500 {
          color: #6b7280;
        }
        
        .print-container .bg-gray-100 {
          background-color: #f3f4f6;
        }
        
        .print-container .bg-gray-50 {
          background-color: #f9fafb;
        }
        
        .print-container .border-gray-300 {
          border-color: #d1d5db;
        }
        
        .print-container .border-gray-400 {
          border-color: #9ca3af;
        }
        
        .print-container .border-gray-800 {
          border-color: #1f2937;
        }
      `}</style>

      {/* Action Buttons - Only visible on screen */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-3">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={generating}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      <div ref={contentRef} className="print-container">
        {/* Header */}
        <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
          <h1 className="text-3xl font-bold mb-2">Laboratory Manual</h1>
          <p className="text-lg text-gray-600">Experiment Report</p>
        </div>

        {/* Submission Info */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100 w-1/3">
                  Student Name
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {submission.studentName}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Experiment Title
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {submission.experimentTitle || template?.title}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Submission Date
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                  Status
                </td>
                <td className="border border-gray-300 px-4 py-2 capitalize">
                  {submission.status}
                </td>
              </tr>
              {submission.reviewedAt && (
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-100">
                    Review Date
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(submission.reviewedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Template Description */}
        {template?.description && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-400">
              Description
            </h2>
            <p className="text-justify">{template.description}</p>
          </div>
        )}

        {/* Objectives */}
        {template?.objectives && template.objectives.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-400">
              Objectives
            </h2>
            <ul className="list-disc list-inside space-y-2">
              {template.objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Template Sections (Aim, Apparatus, Theory, etc.) - Only show non-editable sections */}
        {template?.sections && template.sections.length > 0 && (
          <div className="mb-6">
            {template.sections
              .filter(section => !section.editable && (section.type === 'heading' || section.type === 'text' || section.type === 'image' || section.type === 'divider'))
              .map((section) => (
                <div key={section.id} className="mb-4">
                  {section.type === 'heading' && section.content && (
                    <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-400">
                      {section.content}
                    </h2>
                  )}
                  {section.type === 'text' && section.content && (
                    <div 
                      className="mb-4" 
                      dangerouslySetInnerHTML={{ __html: section.content }} 
                    />
                  )}
                  {section.type === 'image' && section.content && (
                    <div className={`my-4 text-${section.settings?.alignment || 'center'}`}>
                      <img 
                        src={section.content} 
                        alt="Template content" 
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}
                  {section.type === 'divider' && (
                    <hr className="my-6 border-t border-gray-400" />
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Procedure */}
        {template?.steps && template.steps.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-400">
              Procedure
            </h2>
            <ol className="list-decimal list-inside space-y-2">
              {template.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Student Work Section */}
        <div className="page-break"></div>
        <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-800">
          Student Work
        </h2>

        {/* Editable Template Sections - Show student's input for editable text sections */}
        {/* These are now rendered from sectionData below, so this section is removed to avoid duplicates */}

        {/* Legacy Template Data Sections from Student (for backward compatibility) */}
        {/* Only show if template doesn't have sections structure */}
        {submission.templateData && Object.keys(submission.templateData).length > 0 && 
         !template?.sections && (
          <>
            {Object.entries(submission.templateData).map(([key, value]) => (
              <div key={key} className="mb-6">
                <h3 className="text-lg font-bold mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="whitespace-pre-wrap text-justify">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Legacy fields - Only show if template doesn't have sections */}
        {!template?.sections && (
          <>
            {/* Results - Always show if has data */}
            {(submission.results || submission.conclusion) && (
              <>
                {submission.results && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Result / Output</h3>
                    <div className="whitespace-pre-wrap text-justify p-3 bg-gray-50 border border-gray-300">
                      {submission.results}
                    </div>
                  </div>
                )}

                {submission.conclusion && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Conclusion</h3>
                    <div className="whitespace-pre-wrap text-justify p-3 bg-gray-50 border border-gray-300">
                      {submission.conclusion}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Observations - Show if has data */}
            {submission.observationData && submission.observationData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Observations</h3>
                {submission.observationData.map((table) => (
                  <div key={table.tableId} className="mb-4">
                    <h4 className="font-semibold mb-2">{table.tableName}</h4>
                    <table className="w-full border-collapse border border-gray-300">
                      <tbody>
                        {table.rows.map((row, rowIdx) => (
                          <tr key={row.rowId}>
                            {Object.entries(row.cells).map(([colId, value], colIdx) => (
                              <td
                                key={colId}
                                className="border border-gray-300 px-3 py-2 text-center"
                              >
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations - Show if has data */}
            {submission.calculations && submission.calculations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Calculations</h3>
                <div className="space-y-3">
                  {submission.calculations.map((calc, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-300">
                      <div className="text-sm mb-1">
                        <strong>Formula:</strong> {calc.formula}
                      </div>
                      <div>
                        <strong>Result:</strong> {calc.result}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Code and Table Sections from sectionData */}
        {template?.sections && submission?.sectionData && Object.keys(submission.sectionData).length > 0 ? (
          template.sections.map((section: any, index: number) => {
            const studentData = submission.sectionData?.[section.id];
            
            // Render editable text sections - use previous heading as title
            if (section.type === 'text' && section.editable && studentData?.data) {
              // Find the previous heading section to use as title
              let title = 'Student Input';
              if (template.sections) {
                for (let i = index - 1; i >= 0; i--) {
                  if (template.sections[i].type === 'heading') {
                    title = template.sections[i].content;
                    break;
                  }
                }
              }
              
              return (
                <div key={section.id} className="mb-6">
                  <h3 className="text-lg font-bold mb-3">
                    {title} (Student Submission)
                  </h3>
                  <div className="whitespace-pre-wrap text-justify p-3 bg-gray-50 border border-gray-300">
                    {studentData.data || '(Not provided)'}
                  </div>
                </div>
              );
            }
            
            // Render image upload sections
            if (section.type === 'imageUpload' && studentData?.data) {
              return (
                <div key={section.id} className="mb-6">
                  <h3 className="text-lg font-bold mb-3">
                    {section.title || 'Uploaded Image'} (Student Submission)
                  </h3>
                  <div className="space-y-3">
                    <img 
                      src={studentData.data} 
                      alt={studentData.fileName || 'Uploaded image'} 
                      className="max-w-full h-auto rounded border border-gray-300"
                    />
                    {studentData.fileName && (
                      <p className="text-sm text-gray-600">
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
                <div key={section.id} className="mb-6">
                  <h3 className="text-lg font-bold mb-3">
                    {section.title || 'Uploaded File'} (Student Submission)
                  </h3>
                  <div className="p-4 bg-gray-50 border border-gray-300 rounded">
                    <p className="font-medium">{studentData.fileName || 'Uploaded file'}</p>
                    {studentData.fileSize && (
                      <p className="text-sm text-gray-600 mt-1">
                        Size: {(studentData.fileSize / 1024).toFixed(2)} KB
                      </p>
                    )}
                    {studentData.fileType && (
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {studentData.fileType}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            
            if (section.type === 'table' && section.content && studentData?.data) {
              const tableData = studentData.data;
              
              return (
                <div key={section.id} className="mb-6">
                  <h3 className="text-lg font-bold mb-3">
                    {section.content.name || 'Observation Table'} (Student Data)
                  </h3>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        {tableData.columns?.map((col: any) => (
                          <th key={col.id} className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">
                            {col.name}
                            {col.unit && <span className="text-xs text-gray-600 ml-1">({col.unit})</span>}
                            {col.formula && <div className="text-xs text-gray-600 font-mono mt-1">= {col.formula}</div>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows?.map((row: any, rowIndex: number) => (
                        <tr key={row.id}>
                          {tableData.columns?.map((col: any) => {
                            let value = '';
                            if (col.type === 'sno') {
                              value = String(rowIndex + 1);
                            } else {
                              value = row.values[col.id] || '-';
                            }
                            
                            return (
                              <td key={col.id} className="border border-gray-300 px-3 py-2 text-center">
                                {String(value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            
            if (section.type === 'code' && section.content && studentData?.data) {
              const codeData = studentData.data;
              
              return (
                <div key={section.id} className="mb-6 page-break">
                  <h3 className="text-lg font-bold mb-3">
                    {section.content.problemTitle || 'Code Problem'} (Student Submission)
                  </h3>
                  
                  {section.content.problemDescription && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Problem Description:</h4>
                      <p className="text-justify whitespace-pre-wrap">{section.content.problemDescription}</p>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Language: {codeData.language?.toUpperCase() || 'PYTHON'}</h4>
                    <div className="bg-gray-50 border border-gray-300 p-4 rounded">
                      <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                        {codeData.code || '// No code submitted'}
                      </pre>
                    </div>
                  </div>
                  
                  {section.content.testCases && section.content.testCases.filter((tc: any) => !tc.isHidden).length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Test Cases:</h4>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left">Test Case</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Input</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Expected Output</th>
                            {codeData.testResults && <th className="border border-gray-300 px-3 py-2 text-left">Result</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {section.content.testCases.filter((tc: any) => !tc.isHidden).map((tc: any, idx: number) => (
                            <tr key={tc.id}>
                              <td className="border border-gray-300 px-3 py-2">Test {idx + 1}</td>
                              <td className="border border-gray-300 px-3 py-2 font-mono text-sm">{tc.input || '(empty)'}</td>
                              <td className="border border-gray-300 px-3 py-2 font-mono text-sm">{tc.expectedOutput || '(empty)'}</td>
                              {codeData.testResults && codeData.testResults[idx] && (
                                <td className={`border border-gray-300 px-3 py-2 font-semibold ${
                                  codeData.testResults[idx].passed ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {codeData.testResults[idx].passed ? '✓ Passed' : '✗ Failed'}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            }
            
            return null;
          })
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> No code or observation table data found in this submission. 
              {!submission?.sectionData && ' (sectionData is missing from submission)'}
              {submission?.sectionData && Object.keys(submission.sectionData).length === 0 && ' (sectionData is empty)'}
            </p>
            {submission?.sectionData && (
              <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto">
                {JSON.stringify(submission.sectionData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Review Comments */}
        {submission.reviewComments && (
          <div className="mb-6 page-break">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-400">
              Faculty Review Comments
            </h2>
            <div className="whitespace-pre-wrap text-justify p-4 bg-gray-50 border border-gray-300">
              {submission.reviewComments}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 pt-8 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="border-t border-gray-400 pt-2 mt-16">
                <p className="text-center font-semibold">Student Signature</p>
                <p className="text-center text-sm text-gray-600 mt-1">Date: __________</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 mt-16">
                <p className="text-center font-semibold">Faculty Signature</p>
                <p className="text-center text-sm text-gray-600 mt-1">Date: __________</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Generated on {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p className="mt-1">LabSync - Laboratory Management System</p>
        </div>
      </div>
    </>
  );
}
