'use client';

import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface CodeCompilerProps {
  onSave: (compilerData: any) => void;
  initialData?: any;
}

const LANGUAGES = [
  { id: 'c', name: 'C', version: 'GCC 9.2.0', extension: '.c' },
  { id: 'cpp', name: 'C++', version: 'G++ 9.2.0', extension: '.cpp' },
  { id: 'java', name: 'Java', version: 'JDK 11.0.4', extension: '.java' },
  { id: 'python', name: 'Python', version: '3.8.1', extension: '.py' },
  { id: 'javascript', name: 'JavaScript', version: 'Node.js 12.14.0', extension: '.js' },
];

const DEFAULT_CODE_TEMPLATES: { [key: string]: string } = {
  c: `#include <stdio.h>

int main() {
    // Write your code here
    printf("Hello, World!\\n");
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << "Hello, World!" << endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello, World!");
    }
}`,
  python: `# Write your code here
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
  javascript: `// Write your code here
function main() {
    console.log("Hello, World!");
}

main();`,
};

export default function CodeCompiler({ onSave, initialData }: CodeCompilerProps) {
  const [problemTitle, setProblemTitle] = useState(initialData?.problemTitle || 'Code Problem');
  const [problemDescription, setProblemDescription] = useState(initialData?.problemDescription || '');
  const [selectedLanguage, setSelectedLanguage] = useState(initialData?.selectedLanguage || 'python');
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(
    initialData?.allowedLanguages || ['python']
  );
  const [languageMode, setLanguageMode] = useState<'single' | 'multiple'>(
    initialData?.languageMode || 'single'
  );
  const [code, setCode] = useState(initialData?.code || DEFAULT_CODE_TEMPLATES.python);
  const [testCases, setTestCases] = useState<TestCase[]>(
    initialData?.testCases || [
      { id: 'tc-1', input: '', expectedOutput: '', isHidden: false },
    ]
  );
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    // Always update code template when language changes
    setCode(DEFAULT_CODE_TEMPLATES[langId] || '');
  };

  const toggleLanguage = (langId: string) => {
    if (languageMode === 'single') {
      setAllowedLanguages([langId]);
      setSelectedLanguage(langId);
    } else {
      if (allowedLanguages.includes(langId)) {
        if (allowedLanguages.length > 1) {
          setAllowedLanguages(allowedLanguages.filter(l => l !== langId));
        }
      } else {
        setAllowedLanguages([...allowedLanguages, langId]);
      }
    }
  };

  const addTestCase = (isHidden: boolean = false) => {
    setTestCases([
      ...testCases,
      {
        id: `tc-${Date.now()}`,
        input: '',
        expectedOutput: '',
        isHidden,
      },
    ]);
  };

  const updateTestCase = (id: string, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases(
      testCases.map((tc) =>
        tc.id === id ? { ...tc, [field]: value } : tc
      )
    );
  };

  const deleteTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((tc) => tc.id !== id));
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    const loadingToast = toast.loading('🔄 Running your code...');

    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          testCases: testCases.filter(tc => !tc.isHidden), // Only run visible test cases
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults(data.results);
        const allPassed = data.results.every((r: any) => r.passed);
        
        toast.dismiss(loadingToast);
        if (allPassed) {
          toast.success('✅ All test cases passed!', { icon: '🎉' });
        } else {
          toast.error('❌ Some test cases failed', { duration: 4000 });
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Execution failed');
        setOutput(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Code execution error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    setIsRunning(true);
    const loadingToast = toast.loading('🔄 Running all test cases...');

    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          testCases, // Run all test cases including hidden ones
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults(data.results);
        const allPassed = data.results.every((r: any) => r.passed);
        const visiblePassed = data.results.filter((r: any, idx: number) => !testCases[idx].isHidden && r.passed).length;
        const hiddenPassed = data.results.filter((r: any, idx: number) => testCases[idx].isHidden && r.passed).length;
        
        toast.dismiss(loadingToast);
        if (allPassed) {
          toast.success(`✅ All test cases passed! (${visiblePassed} visible + ${hiddenPassed} hidden)`, { 
            icon: '🎉',
            duration: 5000 
          });
        } else {
          toast.error(`❌ Some test cases failed (${visiblePassed}/${testCases.filter(tc => !tc.isHidden).length} visible, ${hiddenPassed}/${testCases.filter(tc => tc.isHidden).length} hidden)`, { 
            duration: 5000 
          });
        }
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Execution failed');
      }
    } catch (error) {
      console.error('Code execution error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    const compilerData = {
      problemTitle,
      problemDescription,
      selectedLanguage,
      allowedLanguages,
      languageMode,
      code,
      testCases,
    };
    onSave(compilerData);
    toast.success('Code compiler saved!');
  };

  const visibleTestCases = testCases.filter(tc => !tc.isHidden);
  const hiddenTestCases = testCases.filter(tc => tc.isHidden);

  return (
    <div className="space-y-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      />

      {/* Problem Details */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] p-4">
        <h3 className="font-bold text-[var(--ink)] mb-4">Problem Details</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Problem Title
            </label>
            <input
              type="text"
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
              placeholder="e.g., Sum of Two Numbers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              Problem Description
            </label>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none resize-none"
              placeholder="Describe the problem, input format, output format, constraints, etc."
            />
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--ink)] mb-2">
            Language Options for Students
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={languageMode === 'single'}
                onChange={() => {
                  setLanguageMode('single');
                  setAllowedLanguages([selectedLanguage]);
                }}
                className="w-4 h-4 text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--ink2)]">Single Language (Students must use this language)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={languageMode === 'multiple'}
                onChange={() => setLanguageMode('multiple')}
                className="w-4 h-4 text-[var(--accent)]"
              />
              <span className="text-sm text-[var(--ink2)]">Multiple Languages (Students can choose)</span>
            </label>
          </div>
        </div>

        <label className="block text-sm font-medium text-[var(--ink)] mb-2">
          {languageMode === 'single' ? 'Select Language' : 'Select Allowed Languages'}
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                if (languageMode === 'single') {
                  handleLanguageChange(lang.id);
                  setAllowedLanguages([lang.id]);
                } else {
                  toggleLanguage(lang.id);
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                languageMode === 'single'
                  ? selectedLanguage === lang.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--paper)] text-[var(--ink3)] hover:bg-[var(--accent3)]'
                  : allowedLanguages.includes(lang.id)
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--paper)] text-[var(--ink3)] hover:bg-[var(--accent3)]'
              }`}
            >
              {lang.name}
              {languageMode === 'multiple' && allowedLanguages.includes(lang.id) && ' ✓'}
            </button>
          ))}
        </div>
        {languageMode === 'single' ? (
          <p className="text-xs text-[var(--ink3)] mt-2">
            {LANGUAGES.find(l => l.id === selectedLanguage)?.version} - Students will only see this language
          </p>
        ) : (
          <p className="text-xs text-[var(--ink3)] mt-2">
            Selected {allowedLanguages.length} language(s) - Students can choose from these options
          </p>
        )}
      </div>

      {/* Code Editor */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] overflow-hidden">
        <div className="bg-[var(--paper)] px-4 py-2 border-b border-[var(--paper3)] flex justify-between items-center">
          <span className="text-sm font-medium text-[var(--ink)]">Code Editor</span>
          <div className="flex gap-2">
            <button
              onClick={runCode}
              disabled={isRunning}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running...' : '▶ Run'}
            </button>
            <button
              onClick={submitCode}
              disabled={isRunning}
              className="px-4 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Submitting...' : '✓ Submit'}
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-4 font-mono text-sm bg-gray-50 outline-none resize-none"
          rows={20}
          spellCheck={false}
        />
      </div>

      {/* Test Cases */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[var(--ink)]">Test Cases</h3>
          <div className="flex gap-2">
            <button
              onClick={() => addTestCase(false)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              + Visible Test
            </button>
            <button
              onClick={() => addTestCase(true)}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              + Hidden Test
            </button>
          </div>
        </div>

        {/* Visible Test Cases */}
        {visibleTestCases.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">Visible Test Cases</h4>
            <div className="space-y-3">
              {visibleTestCases.map((tc, idx) => (
                <div key={tc.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-900">Test Case {idx + 1}</span>
                    <button
                      onClick={() => deleteTestCase(tc.id)}
                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono resize-none"
                        rows={3}
                        placeholder="Input data..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Expected Output</label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono resize-none"
                        rows={3}
                        placeholder="Expected output..."
                      />
                    </div>
                  </div>
                  {testResults[testCases.indexOf(tc)] && (
                    <div className={`mt-2 p-2 rounded text-xs ${
                      testResults[testCases.indexOf(tc)].passed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <strong>{testResults[testCases.indexOf(tc)].passed ? '✓ Passed' : '✗ Failed'}</strong>
                      {!testResults[testCases.indexOf(tc)].passed && (
                        <div className="mt-1">
                          <div>Output: {testResults[testCases.indexOf(tc)].output}</div>
                          <div>Expected: {tc.expectedOutput}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden Test Cases */}
        {hiddenTestCases.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-purple-700 mb-2">Hidden Test Cases (Students can't see)</h4>
            <div className="space-y-3">
              {hiddenTestCases.map((tc, idx) => (
                <div key={tc.id} className="border border-purple-200 rounded-lg p-3 bg-purple-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-purple-900">Hidden Test {idx + 1}</span>
                    <button
                      onClick={() => deleteTestCase(tc.id)}
                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-purple-800 mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 outline-none font-mono resize-none"
                        rows={3}
                        placeholder="Input data..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-800 mb-1">Expected Output</label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 outline-none font-mono resize-none"
                        rows={3}
                        placeholder="Expected output..."
                      />
                    </div>
                  </div>
                  {testResults[testCases.indexOf(tc)] && (
                    <div className={`mt-2 p-2 rounded text-xs ${
                      testResults[testCases.indexOf(tc)].passed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <strong>{testResults[testCases.indexOf(tc)].passed ? '✓ Passed' : '✗ Failed'}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          Save Code Compiler
        </button>
      </div>
    </div>
  );
}
