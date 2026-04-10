'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ExtractedData {
  title: string;
  description: string;
  aim: string;
  apparatus: string[];
  theory: string;
  procedure: string[];
  objectives: string[];
  safetyPrecautions?: string;
  learningOutcomes?: string;
}

interface PDFExtractorProps {
  onExtract: (data: ExtractedData) => void;
}

export default function PDFExtractor({ onExtract }: PDFExtractorProps) {
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [enhancing, setEnhancing] = useState(false);

  const extractTextFromPDF = async (file: File): Promise<any> => {
    setProgress(10);
    
    const formData = new FormData();
    formData.append('file', file);

    setProgress(30);

    const response = await fetch('/api/ai/extract-pdf', {
      method: 'POST',
      body: formData
    });

    setProgress(60);

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to extract PDF content');
    }

    setProgress(70);
    return data.data;
  };

  const parseExtractedText = (text: string): ExtractedData => {
    // This function is no longer needed as parsing is done server-side
    // Keeping it for backward compatibility
    return text as any;
  };

  const enhanceWithAI = async (extractedData: ExtractedData): Promise<ExtractedData> => {
    setEnhancing(true);
    setProgress(92);
    
    try {
      const response = await fetch('/api/ai/enhance-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: extractedData.title,
          aim: extractedData.aim,
          apparatus: extractedData.apparatus,
          theory: extractedData.theory,
          procedure: extractedData.procedure,
          objectives: extractedData.objectives
        })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setProgress(98);
        return {
          ...extractedData,
          description: data.data.description || extractedData.description,
          aim: data.data.aim || extractedData.aim,
          theory: data.data.theory || extractedData.theory,
          objectives: data.data.objectives || extractedData.objectives,
          safetyPrecautions: data.data.safetyPrecautions,
          learningOutcomes: data.data.learningOutcomes
        };
      }
      
      return extractedData;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      // Return original data if AI enhancement fails
      return extractedData;
    } finally {
      setEnhancing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setExtracting(true);
    setError('');
    setProgress(0);

    try {
      // Extract text from PDF (server-side)
      const extractedData = await extractTextFromPDF(file);
      
      if (!extractedData || !extractedData.title) {
        throw new Error('Could not extract sufficient content from PDF. Please ensure the PDF contains standard lab manual sections.');
      }

      // Enhance with AI
      const enhancedData = await enhanceWithAI(extractedData);

      onExtract(enhancedData);
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      setError(err.message || 'Failed to extract data from PDF. Please try again or enter manually.');
    } finally {
      setExtracting(false);
      setProgress(0);
    }
  }, [onExtract]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: extracting
  });

  return (
    <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[var(--ink)] mb-2">
          AI-Powered PDF Import
        </h3>
        <p className="text-sm text-[var(--ink3)]">
          Upload a lab manual PDF and we'll automatically extract the aim, apparatus, procedure, and other sections using AI.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-[var(--accent)] bg-blue-50'
            : extracting
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-[var(--paper3)] hover:border-[var(--accent)] hover:bg-[var(--paper)]'
        }`}
      >
        <input {...getInputProps()} />
        
        {extracting ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto"></div>
            <div>
              <p className="text-[var(--ink)] font-medium mb-2">
                {enhancing ? 'Enhancing content with AI...' : 'Extracting content from PDF...'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                <div
                  className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-[var(--ink3)] mt-2">{Math.round(progress)}%</p>
              {enhancing && (
                <p className="text-xs text-[var(--accent)] mt-2 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  AI is improving the content quality...
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-[var(--ink3)] mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isDragActive ? (
              <p className="text-[var(--accent)] font-medium">Drop the PDF here...</p>
            ) : (
              <div>
                <p className="text-[var(--ink)] font-medium mb-1">
                  Drop a PDF lab manual here, or click to browse
                </p>
                <p className="text-sm text-[var(--ink3)]">
                  Supports standard lab manual formats with sections like Aim, Apparatus, Procedure, etc.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Error extracting PDF</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Tips for best results:</p>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
              <li>Use text-based PDFs (not scanned images)</li>
              <li>Ensure sections are clearly labeled (Aim, Apparatus, Procedure, etc.)</li>
              <li>Review and edit extracted content before saving</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
