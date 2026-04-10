'use client';

import { useState } from 'react';
import { TemplateSection } from './DragDropBuilder';

interface AITemplateBuilderProps {
  title: string;
  onGenerate: (sections: TemplateSection[], objectives: string[], procedures: string[]) => void;
}

export default function AITemplateBuilder({ title, onGenerate }: AITemplateBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenerate = async (additionalInstructions?: string) => {
    const experimentTitle = title.trim();
    
    if (!experimentTitle) {
      setError('Please enter an experiment title in the Basic Information tab first');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: experimentTitle,
          instructions: additionalInstructions || customPrompt
        })
      });

      const data = await response.json();

      if (data.success) {
        // Convert AI response to template sections
        const sections: TemplateSection[] = [];
        let sectionId = 0;

        // Add Aim
        if (data.data.aim) {
          sections.push({
            id: `section-${sectionId++}`,
            type: 'heading',
            content: 'Aim',
            settings: { alignment: 'left' }
          });
          sections.push({
            id: `section-${sectionId++}`,
            type: 'text',
            content: `<p>${data.data.aim}</p>`,
            settings: { alignment: 'left' }
          });
        }

        // Add Apparatus
        if (data.data.apparatus && data.data.apparatus.length > 0) {
          sections.push({
            id: `section-${sectionId++}`,
            type: 'heading',
            content: 'Apparatus Required',
            settings: { alignment: 'left' }
          });
          const apparatusList = data.data.apparatus.map((item: string) => `<li>${item}</li>`).join('');
          sections.push({
            id: `section-${sectionId++}`,
            type: 'text',
            content: `<ul>${apparatusList}</ul>`,
            settings: { alignment: 'left' }
          });
        }

        // Add Software/Hardware
        if (data.data.softwareHardware) {
          sections.push({
            id: `section-${sectionId++}`,
            type: 'heading',
            content: 'Software/Hardware Requirements',
            settings: { alignment: 'left' }
          });
          sections.push({
            id: `section-${sectionId++}`,
            type: 'text',
            content: `<p>${data.data.softwareHardware}</p>`,
            settings: { alignment: 'left' }
          });
        }

        // Add Theory
        if (data.data.theory) {
          sections.push({
            id: `section-${sectionId++}`,
            type: 'heading',
            content: 'Theory/Formula',
            settings: { alignment: 'left' }
          });
          sections.push({
            id: `section-${sectionId++}`,
            type: 'text',
            content: `<p>${data.data.theory}</p>`,
            settings: { alignment: 'left' }
          });
        }

        // Add Safety Precautions
        if (data.data.safetyPrecautions) {
          sections.push({
            id: `section-${sectionId++}`,
            type: 'heading',
            content: 'Safety Precautions',
            settings: { alignment: 'left' }
          });
          sections.push({
            id: `section-${sectionId++}`,
            type: 'text',
            content: `<p>${data.data.safetyPrecautions}</p>`,
            settings: { alignment: 'left' }
          });
        }

        // Add Divider
        sections.push({
          id: `section-${sectionId++}`,
          type: 'divider',
          content: '',
          settings: { alignment: 'left' }
        });

        // Add Student Work Sections
        sections.push({
          id: `section-${sectionId++}`,
          type: 'heading',
          content: 'Observations',
          settings: { alignment: 'left' }
        });
        sections.push({
          id: `section-${sectionId++}`,
          type: 'text',
          content: '<p><em>Students will record their observations here during the experiment.</em></p>',
          settings: { alignment: 'left' }
        });

        sections.push({
          id: `section-${sectionId++}`,
          type: 'heading',
          content: 'Output/Results',
          settings: { alignment: 'left' }
        });
        sections.push({
          id: `section-${sectionId++}`,
          type: 'text',
          content: '<p><em>Students will document their results and output here.</em></p>',
          settings: { alignment: 'left' }
        });

        sections.push({
          id: `section-${sectionId++}`,
          type: 'heading',
          content: 'Conclusion',
          settings: { alignment: 'left' }
        });
        sections.push({
          id: `section-${sectionId++}`,
          type: 'text',
          content: '<p><em>Students will write their conclusion based on the experiment results.</em></p>',
          settings: { alignment: 'left' }
        });

        // Add Learning Outcomes
        if (data.data.learningOutcomes) {
          sections.push({
            id: `section-${sectionId++}`,
            type: 'divider',
            content: '',
            settings: { alignment: 'left' }
          });
          sections.push({
            id: `section-${sectionId++}`,
            type: 'heading',
            content: 'Learning Outcomes',
            settings: { alignment: 'left' }
          });
          sections.push({
            id: `section-${sectionId++}`,
            type: 'text',
            content: `<p>${data.data.learningOutcomes}</p>`,
            settings: { alignment: 'left' }
          });
        }

        onGenerate(
          sections,
          data.data.objectives || [],
          data.data.procedure || []
        );

        setIsOpen(false);
        setCustomPrompt('');
      } else {
        setError(data.error || 'Failed to generate template');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI');
    } finally {
      setGenerating(false);
    }
  };

  const quickTemplates = [
    { label: 'Physics Lab', prompt: 'Create a physics laboratory experiment template' },
    { label: 'Chemistry Lab', prompt: 'Create a chemistry laboratory experiment template' },
    { label: 'Computer Science', prompt: 'Create a computer science practical template' },
    { label: 'Electronics Lab', prompt: 'Create an electronics laboratory experiment template' },
    { label: 'Biology Lab', prompt: 'Create a biology laboratory experiment template' },
  ];

  return (
    <div className="relative">
      {/* AI Builder Button */}
      <button
        onClick={() => {
          if (!title.trim()) {
            alert('⚠️ Please enter an experiment title in the Basic Information tab first');
            return;
          }
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
        title={!title.trim() ? 'Enter experiment title first' : 'Build entire template with AI'}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
        </svg>
        <span className="font-medium">Build with AI</span>
      </button>

      {/* AI Builder Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">AI Template Builder</h2>
                    <p className="text-purple-100 text-sm">Generate a complete lab manual template instantly</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Experiment Title Display */}
                {title.trim() ? (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Experiment Title:</p>
                    <p className="text-lg font-bold text-gray-900">{title}</p>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">No title entered</p>
                        <p className="text-xs text-yellow-700 mt-1">Please enter an experiment title in the Basic Information tab first</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Templates */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Quick Templates:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {quickTemplates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => handleGenerate(template.prompt)}
                        disabled={generating}
                        className="p-3 text-left bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition disabled:opacity-50"
                      >
                        <p className="font-medium text-gray-900">{template.label}</p>
                        <p className="text-xs text-gray-500 mt-1">Auto-generate template</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Instructions (Optional):
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Focus on practical applications, include safety measures, add diagrams..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                    disabled={generating}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={() => handleGenerate()}
                  disabled={generating}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Template...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      Generate Complete Template
                    </span>
                  )}
                </button>

                {/* Info */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">AI will generate:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Aim and objectives</li>
                        <li>Required apparatus/equipment</li>
                        <li>Theory and formulas</li>
                        <li>Step-by-step procedure</li>
                        <li>Safety precautions</li>
                        <li>Student work sections</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
