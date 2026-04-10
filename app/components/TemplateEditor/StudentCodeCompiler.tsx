'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface StudentCodeCompilerProps {
  codeData: any;
  onChange?: (data: any) => void;
  readOnly?: boolean;
}

const CODE_TEMPLATES: { [key: string]: string } = {
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

export default function StudentCodeCompiler({ codeData, onChange, readOnly = false }: StudentCodeCompilerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(
    codeData.languageMode === 'single' 
      ? codeData.selectedLanguage 
      : codeData.allowedLanguages?.[0] || 'python'
  );
  const [code, setCode] = useState(codeData.code || CODE_TEMPLATES[selectedLanguage] || '');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Update code when codeData.code changes (for loading saved data)
  useEffect(() => {
    if (codeData.code) {
      setCode(codeData.code);
    }
  }, [codeData.code]);

  useEffect(() => {
    // Only reset to template if no saved code
    if (!codeData.code) {
      setCode(CODE_TEMPLATES[selectedLanguage] || '');
    }
  }, [selectedLanguage]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      const timeoutId = setTimeout(() => {
        onChange({ language: selectedLanguage, code, testResults });
      }, 500); // Debounce to avoid too many updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [code, selectedLanguage, testResults]);

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
          testCases: codeData.testCases?.filter((tc: any) => !tc.isHidden) || [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults(data.results);
        const allPassed = data.results.every((r: any) => r.passed);
        
        toast.dismiss(loadingToast);
        if (allPassed) {
          toast.success('✅ All visible test cases passed!', { icon: '🎉' });
        } else {
          toast.error('❌ Some test cases failed', { duration: 4000 });
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
          testCases: codeData.testCases || [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResults(data.results);
        const allPassed = data.results.every((r: any) => r.passed);
        const visiblePassed = data.results.filter((r: any, idx: number) => 
          !codeData.testCases[idx]?.isHidden && r.passed
        ).length;
        const hiddenPassed = data.results.filter((r: any, idx: number) => 
          codeData.testCases[idx]?.isHidden && r.passed
        ).length;
        
        toast.dismiss(loadingToast);
        if (allPassed) {
          toast.success(`✅ All test cases passed! (${visiblePassed} visible + ${hiddenPassed} hidden)`, { 
            icon: '🎉',
            duration: 5000 
          });
        } else {
          const visibleTotal = codeData.testCases.filter((tc: any) => !tc.isHidden).length;
          const hiddenTotal = codeData.testCases.filter((tc: any) => tc.isHidden).length;
          toast.error(`❌ Some test cases failed (${visiblePassed}/${visibleTotal} visible, ${hiddenPassed}/${hiddenTotal} hidden)`, { 
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

  const visibleTestCases = codeData.testCases?.filter((tc: any) => !tc.isHidden) || [];

  return (
    <div className="space-y-4">
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

      {/* Problem Description */}
      {codeData.problemDescription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-[var(--ink)] mb-2">Problem Description:</h4>
          <p className="text-[var(--ink2)] whitespace-pre-wrap">{codeData.problemDescription}</p>
        </div>
      )}

      {/* Code Editor */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {codeData.languageMode === 'multiple' && codeData.allowedLanguages && codeData.allowedLanguages.length > 1 ? (
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-gray-700 text-white text-sm font-mono px-3 py-1.5 rounded border border-gray-600 cursor-pointer hover:bg-gray-600"
              >
                {codeData.allowedLanguages.map((lang: string) => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-gray-300 font-mono px-3 py-1.5">{selectedLanguage.toUpperCase()}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={runCode}
              disabled={isRunning || readOnly}
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {isRunning ? '⏳ Running...' : '▶ Run'}
            </button>
            <button 
              onClick={submitCode}
              disabled={isRunning || readOnly}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isRunning ? '⏳ Submitting...' : '✓ Submit'}
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          className={`w-full p-4 bg-gray-900 text-green-400 font-mono text-sm outline-none resize-none ${
            readOnly ? 'cursor-not-allowed opacity-75' : ''
          }`}
          rows={15}
          spellCheck={false}
          placeholder={readOnly ? 'Code is read-only' : 'Write your code here...'}
        />
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h4 className="font-semibold text-[var(--ink)] mb-2">Test Results:</h4>
          <div className="space-y-2">
            {testResults.map((result: any, idx: number) => {
              const testCase = codeData.testCases?.[idx];
              if (!testCase || testCase.isHidden) return null;
              
              return (
                <div key={idx} className={`p-3 rounded border ${
                  result.passed 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      result.passed ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.passed ? '✓' : '✗'} Test Case {idx + 1}
                    </span>
                  </div>
                  {!result.passed && (
                    <div className="text-xs text-red-700 mt-2 space-y-1">
                      <div><strong>Expected:</strong> {testCase.expectedOutput}</div>
                      <div><strong>Got:</strong> {result.output}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sample Test Cases */}
      {visibleTestCases.length > 0 && (
        <div>
          <h4 className="font-semibold text-[var(--ink)] mb-2">Sample Test Cases:</h4>
          <div className="space-y-2">
            {visibleTestCases.map((tc: any, idx: number) => (
              <div key={tc.id} className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm font-medium text-blue-900 mb-2">Test Case {idx + 1}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs font-medium text-blue-800 mb-1">Input:</div>
                    <pre className="bg-white p-2 rounded border border-blue-200 font-mono text-xs">{tc.input || '(empty)'}</pre>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-blue-800 mb-1">Expected Output:</div>
                    <pre className="bg-white p-2 rounded border border-blue-200 font-mono text-xs">{tc.expectedOutput || '(empty)'}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {codeData.testCases?.filter((tc: any) => tc.isHidden).length > 0 && (
            <p className="text-xs text-purple-600 mt-2">
              + {codeData.testCases.filter((tc: any) => tc.isHidden).length} hidden test case(s) for evaluation
            </p>
          )}
        </div>
      )}
    </div>
  );
}
