'use client';

import { useState } from 'react';

interface AIBlockAssistantProps {
  content: string;
  onApply: (newContent: string) => void;
  blockType: 'text' | 'heading';
}

export default function AIBlockAssistant({ content, onApply, blockType }: AIBlockAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const quickActions = [
    { label: 'Enhance Content', prompt: 'Enhance and improve this content to make it more clear, professional, and educational' },
    { label: 'Fix Grammar', prompt: 'Fix all grammatical errors and improve the writing quality' },
    { label: 'Make Concise', prompt: 'Make this content more concise while keeping the key information' },
    { label: 'Add Details', prompt: 'Add more details and explanations to make this content more comprehensive' },
    { label: 'Simplify', prompt: 'Simplify this content to make it easier to understand for students' },
  ];

  const handleQuickAction = (actionPrompt: string) => {
    setPrompt(actionPrompt);
    handleSubmit(actionPrompt);
  };

  const handleSubmit = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/ai/assist-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          prompt: finalPrompt,
          blockType
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data.content);
      } else {
        setError(data.error || 'Failed to process request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setIsOpen(false);
      setResult('');
      setPrompt('');
      setError('');
    }
  };

  const handleDiscard = () => {
    setResult('');
    setPrompt('');
    setError('');
  };

  return (
    <div className="relative">
      {/* AI Chat Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[var(--ink3)] hover:text-[var(--accent)] hover:bg-[var(--paper)] rounded-lg transition"
        title="AI Assistant"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-xl border border-[var(--paper3)] shadow-2xl">
          <div className="p-4 border-b border-[var(--paper3)] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <h3 className="font-bold text-[var(--ink)]">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--ink3)] hover:text-[var(--ink)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Quick Actions */}
            <div className="mb-4">
              <p className="text-sm text-[var(--ink3)] mb-2">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={loading}
                    className="px-3 py-1 text-xs bg-[var(--paper)] text-[var(--ink)] rounded-full hover:bg-[var(--accent)] hover:text-white transition disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                Or ask anything:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g., Create a procedure for this experiment..."
                  className="flex-1 px-3 py-2 text-sm border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                  disabled={loading}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || !prompt.trim()}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-[var(--ink)]">AI Suggestion:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDiscard}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleApply}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-[var(--paper)] rounded-lg text-sm text-[var(--ink)] max-h-48 overflow-y-auto border border-[var(--paper3)]">
                  {blockType === 'text' ? (
                    <div dangerouslySetInnerHTML={{ __html: result }} />
                  ) : (
                    <p className="font-semibold">{result}</p>
                  )}
                </div>
              </div>
            )}

            {/* Current Content Preview */}
            <div className="mt-4 pt-4 border-t border-[var(--paper3)]">
              <p className="text-xs text-[var(--ink3)] mb-2">Current content:</p>
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-24 overflow-y-auto">
                {blockType === 'text' ? (
                  <div dangerouslySetInnerHTML={{ __html: content.substring(0, 200) + (content.length > 200 ? '...' : '') }} />
                ) : (
                  <p>{content.substring(0, 100) + (content.length > 100 ? '...' : '')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
