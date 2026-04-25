'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DragDropBuilder, { TemplateSection } from '@/app/components/TemplateEditor/DragDropBuilder';
import PDFExtractor from '@/app/components/TemplateEditor/PDFExtractor';
import AITemplateBuilder from '@/app/components/TemplateEditor/AITemplateBuilder';

// Language templates for code preview
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

// Interactive Code Preview Component
function InteractiveCodePreview({ codeData }: { codeData: any }) {
  const [selectedLang, setSelectedLang] = useState(
    codeData.languageMode === 'single' 
      ? codeData.selectedLanguage 
      : codeData.allowedLanguages?.[0] || 'python'
  );
  const [code, setCode] = useState(CODE_TEMPLATES[selectedLang] || '');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    setCode(CODE_TEMPLATES[selectedLang] || '');
  }, [selectedLang]);

  const runCode = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          code,
          testCases: codeData.testCases?.filter((tc: any) => !tc.isHidden) || [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTestResults(data.results);
      }
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          code,
          testCases: codeData.testCases || [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTestResults(data.results);
      }
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[var(--paper3)] overflow-hidden">
      <div className="bg-[var(--paper)] px-4 py-3 border-b border-[var(--paper3)]">
        <h3 className="text-xl font-bold text-[var(--ink)]">{codeData.problemTitle || 'Code Problem'}</h3>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm text-[var(--ink3)]">
            {codeData.languageMode === 'single' 
              ? `Language: ${codeData.selectedLanguage?.toUpperCase()} (Required)`
              : `Languages: ${codeData.allowedLanguages?.map((l: string) => l.toUpperCase()).join(', ') || 'Multiple'} (Student Choice)`
            }
          </p>
        </div>
      </div>
      <div className="p-4">
        {codeData.problemDescription && (
          <div className="mb-4">
            <h4 className="font-semibold text-[var(--ink)] mb-2">Problem Description:</h4>
            <p className="text-[var(--ink2)] whitespace-pre-wrap">{codeData.problemDescription}</p>
          </div>
        )}
        
        {/* Interactive Code Editor */}
        <div className="mb-4">
          <h4 className="font-semibold text-[var(--ink)] mb-2">Code Editor:</h4>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {codeData.languageMode === 'multiple' && codeData.allowedLanguages && codeData.allowedLanguages.length > 1 ? (
                  <select 
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="bg-gray-700 text-white text-sm font-mono px-3 py-1.5 rounded border border-gray-600 cursor-pointer hover:bg-gray-600"
                  >
                    {codeData.allowedLanguages.map((lang: string) => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-300 font-mono px-3 py-1.5">{selectedLang.toUpperCase()}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={runCode}
                  disabled={isRunning}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {isRunning ? '⏳ Running...' : '▶ Run'}
                </button>
                <button 
                  onClick={submitCode}
                  disabled={isRunning}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isRunning ? '⏳ Submitting...' : '✓ Submit'}
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-4 bg-gray-900 text-green-400 font-mono text-sm outline-none resize-none"
              rows={15}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-4">
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
        {codeData.testCases && codeData.testCases.filter((tc: any) => !tc.isHidden).length > 0 && (
          <div>
            <h4 className="font-semibold text-[var(--ink)] mb-2">Sample Test Cases:</h4>
            <div className="space-y-2">
              {codeData.testCases.filter((tc: any) => !tc.isHidden).map((tc: any, idx: number) => (
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
            {codeData.testCases.filter((tc: any) => tc.isHidden).length > 0 && (
              <p className="text-xs text-purple-600 mt-2">
                + {codeData.testCases.filter((tc: any) => tc.isHidden).length} hidden test case(s) for evaluation
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Interactive Table Preview Component
function InteractiveTablePreview({ tableData }: { tableData: any }) {
  const [rowValues, setRowValues] = useState<{ [key: string]: any }>({});

  const evaluateFormula = (formula: string, values: any, cols: any[]): number | string => {
    if (!formula || formula.trim() === '') return '';
    
    try {
      let expression = formula;
      
      // Sort columns by name length (longest first) to avoid partial matches
      const sortedCols = [...cols].sort((a, b) => b.name.length - a.name.length);
      
      // Replace input columns
      sortedCols.forEach(col => {
        if (col.type === 'input') {
          const value = values[col.id];
          if (value !== undefined && value !== null && value !== '') {
            const escapedName = col.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
            expression = expression.replace(regex, `(${value})`);
          }
        }
      });
      
      // Replace output columns
      sortedCols.forEach(col => {
        if (col.type === 'output' && col.formula) {
          const value = values[col.id];
          if (value !== undefined && value !== null && value !== '') {
            const escapedName = col.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
            expression = expression.replace(regex, `(${value})`);
          }
        }
      });
      
      // Replace mathematical functions
      expression = expression
        .replace(/\bPI\b/gi, 'Math.PI')
        .replace(/\bE\b/gi, 'Math.E')
        .replace(/sin\s*\(\s*([^)]+)\s*\)/gi, (match, angle) => `Math.sin((${angle}) * Math.PI / 180)`)
        .replace(/cos\s*\(\s*([^)]+)\s*\)/gi, (match, angle) => `Math.cos((${angle}) * Math.PI / 180)`)
        .replace(/tan\s*\(\s*([^)]+)\s*\)/gi, (match, angle) => `Math.tan((${angle}) * Math.PI / 180)`)
        .replace(/asin\s*\(\s*([^)]+)\s*\)/gi, (match, value) => `(Math.asin(${value}) * 180 / Math.PI)`)
        .replace(/acos\s*\(\s*([^)]+)\s*\)/gi, (match, value) => `(Math.acos(${value}) * 180 / Math.PI)`)
        .replace(/atan\s*\(\s*([^)]+)\s*\)/gi, (match, value) => `(Math.atan(${value}) * 180 / Math.PI)`)
        .replace(/log\s*\(\s*([^)]+)\s*\)/gi, 'Math.log10($1)')
        .replace(/ln\s*\(\s*([^)]+)\s*\)/gi, 'Math.log($1)')
        .replace(/sqrt\s*\(\s*([^)]+)\s*\)/gi, 'Math.sqrt($1)')
        .replace(/pow\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'Math.pow($1, $2)')
        .replace(/\^/g, '**')
        .replace(/abs\s*\(\s*([^)]+)\s*\)/gi, 'Math.abs($1)')
        .replace(/round\s*\(\s*([^)]+)\s*\)/gi, 'Math.round($1)')
        .replace(/floor\s*\(\s*([^)]+)\s*\)/gi, 'Math.floor($1)')
        .replace(/ceil\s*\(\s*([^)]+)\s*\)/gi, 'Math.ceil($1)');
      
      const testExpression = expression.replace(/Math\.[a-zA-Z]+/g, '');
      if (/[a-zA-Z_][a-zA-Z0-9_]*/g.test(testExpression)) {
        return '';
      }
      
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      
      if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
        return '';
      }
      
      return typeof result === 'number' ? Math.round(result * 10000) / 10000 : result;
    } catch (error) {
      return '';
    }
  };

  const getCellValue = (row: any, column: any, rowIndex: number): any => {
    const rowKey = `row-${rowIndex}`;
    
    if (column.type === 'sno') {
      return rowIndex + 1;
    }
    
    if (column.type === 'output' && column.formula) {
      const result = evaluateFormula(column.formula, rowValues[rowKey] || {}, tableData.columns);
      return result === '' ? '-' : result;
    }
    
    return rowValues[rowKey]?.[column.id] || '';
  };

  const handleInputChange = (rowIndex: number, columnId: string, value: string) => {
    const rowKey = `row-${rowIndex}`;
    const newRowValues = {
      ...rowValues,
      [rowKey]: {
        ...(rowValues[rowKey] || {}),
        [columnId]: value
      }
    };
    
    // Calculate output columns
    tableData.columns.forEach((col: any) => {
      if (col.type === 'output' && col.formula) {
        const calculatedValue = evaluateFormula(col.formula, newRowValues[rowKey], tableData.columns);
        if (calculatedValue !== '') {
          newRowValues[rowKey][col.id] = calculatedValue;
        }
      }
    });
    
    setRowValues(newRowValues);
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium text-blue-800">Interactive Preview - Try entering values to see formulas calculate!</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-blue-300 bg-white">
          <thead>
            <tr className="bg-blue-100">
              {tableData.columns?.map((col: any) => (
                <th key={col.id} className="px-4 py-2 text-left text-sm font-medium border border-blue-300">
                  {col.name}
                  {col.unit && <span className="text-xs text-blue-600 ml-1">({col.unit})</span>}
                  {col.formula && <div className="text-xs text-purple-600 font-mono mt-1">= {col.formula}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows?.map((row: any, rowIndex: number) => (
              <tr key={row.id} className="hover:bg-blue-50">
                {tableData.columns?.map((col: any) => (
                  <td key={col.id} className="px-4 py-2 border border-blue-300">
                    {col.type === 'sno' || (col.type === 'output' && col.formula) ? (
                      <span className={col.type === 'output' ? 'text-green-700 font-semibold' : 'text-gray-600'}>
                        {getCellValue(row, col, rowIndex) || '-'}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={rowValues[`row-${rowIndex}`]?.[col.id] || ''}
                        onChange={(e) => handleInputChange(rowIndex, col.id, e.target.value)}
                        className="w-full px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter value"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [availableDepartments, setAvailableDepartments] = useState<Array<{ id?: string; _id?: string; name: string; isCurrentUserDepartment?: boolean }>>([]);
  const [visibleToDepartmentIds, setVisibleToDepartmentIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'import' | 'basic' | 'content' | 'preview'>('import');
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [procedures, setProcedures] = useState<string[]>(['']);
  const [sections, setSections] = useState<TemplateSection[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchDepartments();
    initializeDefaultSections();
  }, []);

  const initializeDefaultSections = () => {
    const defaultSections: TemplateSection[] = [
      {
        id: 'section-aim',
        type: 'heading',
        content: 'Aim',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-aim-content',
        type: 'text',
        content: '<p>Enter the aim of this experiment...</p>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-apparatus',
        type: 'heading',
        content: 'Apparatus Required',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-apparatus-content',
        type: 'text',
        content: '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-software',
        type: 'heading',
        content: 'Software/Hardware Requirements',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-software-content',
        type: 'text',
        content: '<p>List software or hardware requirements...</p>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-theory',
        type: 'heading',
        content: 'Theory/Formula',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-theory-content',
        type: 'text',
        content: '<p>Enter relevant formulas and theoretical concepts...</p>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-divider-1',
        type: 'divider',
        content: '',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-observations',
        type: 'heading',
        content: 'Observations',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-observations-content',
        type: 'text',
        content: '<p><em>Students will record their observations here during the experiment.</em></p>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-output',
        type: 'heading',
        content: 'Output/Results',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-output-content',
        type: 'text',
        content: '<p><em>Students will document their results and output here.</em></p>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-conclusion',
        type: 'heading',
        content: 'Conclusion',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-conclusion-content',
        type: 'text',
        content: '<p><em>Students will write their conclusion based on the experiment results.</em></p>',
        settings: { alignment: 'left' }
      }
    ];
    setSections(defaultSections);
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success && data.data.departmentId) {
        setDepartmentId(data.data.departmentId);
      }
    } catch (error) {
      console.error('Failed to fetch user data', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const normalizedDepartments = data.data
          .map((dept: any) => ({
            id: dept.id || dept._id?.toString(),
            _id: dept._id?.toString(),
            name: dept.name || 'Unnamed Department',
            isCurrentUserDepartment: dept.isCurrentUserDepartment,
          }))
          .filter((dept: any) => Boolean(dept.id || dept._id || dept.name));

        setAvailableDepartments(normalizedDepartments);
      }
    } catch (error) {
      console.error('Failed to fetch departments', error);
    }
  };

  const toggleVisibleDepartment = (selectedDepartmentId: string) => {
    setVisibleToDepartmentIds((prev) =>
      prev.includes(selectedDepartmentId)
        ? prev.filter((id) => id !== selectedDepartmentId)
        : [...prev, selectedDepartmentId]
    );
  };

  const handleAIGenerate = (generatedSections: TemplateSection[], generatedObjectives: string[], generatedProcedures: string[]) => {
    // Update sections
    setSections(generatedSections);
    
    // Update objectives
    if (generatedObjectives && generatedObjectives.length > 0) {
      setObjectives(generatedObjectives);
    }
    
    // Update procedures
    if (generatedProcedures && generatedProcedures.length > 0) {
      setProcedures(generatedProcedures);
    }
    
    // Switch to preview tab
    setActiveTab('preview');
    alert('✨ Template generated successfully! Review the content in the Preview tab and make any adjustments needed.');
  };

  const handlePDFExtract = (extractedData: any) => {
    // Fill form with extracted data
    setFormData({
      title: extractedData.title || '',
      description: extractedData.description || '',
    });

    // Set objectives
    if (extractedData.objectives && extractedData.objectives.length > 0) {
      setObjectives(extractedData.objectives);
    }

    // Set procedures
    if (extractedData.procedure && extractedData.procedure.length > 0) {
      setProcedures(extractedData.procedure);
    }

    // Build sections from extracted data
    const newSections: TemplateSection[] = [];
    let sectionId = 0;

    // Add Aim section
    if (extractedData.aim) {
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'heading',
        content: 'Aim',
        settings: { alignment: 'left' }
      });
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'text',
        content: `<p>${extractedData.aim}</p>`,
        settings: { alignment: 'left' }
      });
    }

    // Add Apparatus section
    if (extractedData.apparatus && extractedData.apparatus.length > 0) {
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'heading',
        content: 'Apparatus Required',
        settings: { alignment: 'left' }
      });
      const apparatusList = extractedData.apparatus.map((item: string) => `<li>${item}</li>`).join('');
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'text',
        content: `<ul>${apparatusList}</ul>`,
        settings: { alignment: 'left' }
      });
    }

    // Add Theory section
    if (extractedData.theory) {
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'heading',
        content: 'Theory/Formula',
        settings: { alignment: 'left' }
      });
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'text',
        content: `<p>${extractedData.theory}</p>`,
        settings: { alignment: 'left' }
      });
    }

    // Add Safety Precautions (if provided by AI)
    if (extractedData.safetyPrecautions) {
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'heading',
        content: 'Safety Precautions',
        settings: { alignment: 'left' }
      });
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'text',
        content: `<p>${extractedData.safetyPrecautions}</p>`,
        settings: { alignment: 'left' }
      });
    }

    // Add divider
    newSections.push({
      id: `section-${sectionId++}`,
      type: 'divider',
      content: '',
      settings: { alignment: 'left' }
    });

    // Add student work sections
    newSections.push({
      id: `section-${sectionId++}`,
      type: 'heading',
      content: 'Observations',
      settings: { alignment: 'left' }
    });
    newSections.push({
      id: `section-${sectionId++}`,
      type: 'text',
      content: '<p><em>Students will record their observations here during the experiment.</em></p>',
      settings: { alignment: 'left' }
    });

    newSections.push({
      id: `section-${sectionId++}`,
      type: 'heading',
      content: 'Output/Results',
      settings: { alignment: 'left' }
    });
    newSections.push({
      id: `section-${sectionId++}`,
      type: 'text',
      content: '<p><em>Students will document their results and output here.</em></p>',
      settings: { alignment: 'left' }
    });

    newSections.push({
      id: `section-${sectionId++}`,
      type: 'heading',
      content: 'Conclusion',
      settings: { alignment: 'left' }
    });
    newSections.push({
      id: `section-${sectionId++}`,
      type: 'text',
      content: '<p><em>Students will write their conclusion based on the experiment results.</em></p>',
      settings: { alignment: 'left' }
    });

    // Add Learning Outcomes (if provided by AI)
    if (extractedData.learningOutcomes) {
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'divider',
        content: '',
        settings: { alignment: 'left' }
      });
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'heading',
        content: 'Learning Outcomes',
        settings: { alignment: 'left' }
      });
      newSections.push({
        id: `section-${sectionId++}`,
        type: 'text',
        content: `<p>${extractedData.learningOutcomes}</p>`,
        settings: { alignment: 'left' }
      });
    }

    setSections(newSections);

    // Show success message and switch to preview
    alert('✨ PDF content extracted and enhanced with AI successfully! Review the improved content in the Preview tab.');
    setActiveTab('preview');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addObjective = () => setObjectives([...objectives, '']);
  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };
  const removeObjective = (index: number) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((_, i) => i !== index));
    }
  };

  const addProcedure = () => setProcedures([...procedures, '']);
  const updateProcedure = (index: number, value: string) => {
    const newProcedures = [...procedures];
    newProcedures[index] = value;
    setProcedures(newProcedures);
  };
  const removeProcedure = (index: number) => {
    if (procedures.length > 1) {
      setProcedures(procedures.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a template title');
      return;
    }

    let resolvedDepartmentId = departmentId;
    if (!resolvedDepartmentId) {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success && data.data.departmentId) {
          resolvedDepartmentId = data.data.departmentId;
          setDepartmentId(data.data.departmentId);
        }
      } catch (error) {
        console.error('Failed to refetch department information', error);
      }
    }

    const validObjectives = objectives.filter(obj => obj.trim() !== '');
    const validProcedures = procedures.filter(proc => proc.trim() !== '');

    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || 'No description provided',
          objectives: validObjectives,
          steps: validProcedures,
          sections: sections, // Include sections
          observationTables: [
            {
              name: 'Observations',
              columns: ['S.No', 'Parameter', 'Value', 'Remarks'],
              rows: 5
            }
          ],
          requiredFields: ['aim', 'apparatus', 'procedure', 'observations', 'output', 'conclusion'],
          calculationRules: [],
          departmentId: resolvedDepartmentId || undefined,
          visibleToDepartmentIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/faculty/templates');
      } else {
        alert(data.error?.message || 'Failed to save template');
      }
    } catch (error) {
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const renderPreview = () => {
    return (
      <div className="bg-white rounded-xl border border-[var(--paper3)] p-8 max-w-4xl mx-auto">
        <div className="mb-8 border-b border-[var(--paper3)] pb-6">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">
            {formData.title || 'Untitled Experiment'}
          </h1>
          {formData.description && (
            <p className="text-[var(--ink3)]">{formData.description}</p>
          )}
        </div>

        {/* Objectives */}
        {objectives.some(obj => obj.trim()) && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-3">Objectives</h2>
            <ul className="list-disc list-inside space-y-2">
              {objectives.filter(obj => obj.trim()).map((objective, index) => (
                <li key={index} className="text-[var(--ink2)]">{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Procedure */}
        {procedures.some(proc => proc.trim()) && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-3">Procedure</h2>
            <ol className="list-decimal list-inside space-y-2">
              {procedures.filter(proc => proc.trim()).map((procedure, index) => (
                <li key={index} className="text-[var(--ink2)]">{procedure}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Content Sections */}
        {sections.length > 0 && (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id}>
                {section.type === 'heading' && section.content && (
                  <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-3">{section.content}</h2>
                )}
                {section.type === 'text' && section.content && (
                  <div 
                    className="prose max-w-none text-[var(--ink2)]" 
                    dangerouslySetInnerHTML={{ __html: section.content }} 
                  />
                )}
                {section.type === 'image' && section.content && (
                  <div className={`my-4 text-${section.settings?.alignment || 'left'}`}>
                    <img 
                      src={section.content} 
                      alt="Template content" 
                      className="max-w-full h-auto rounded-lg shadow-md inline-block" 
                    />
                  </div>
                )}
                {section.type === 'divider' && (
                  <hr className="my-6 border-t-2 border-[var(--paper3)]" />
                )}
                {section.type === 'table' && section.content && (
                  <div className="my-6">
                    <h3 className="text-xl font-bold text-[var(--ink)] mb-3">{section.content.name || 'Observation Table'}</h3>
                    <InteractiveTablePreview tableData={section.content} />
                  </div>
                )}
                {section.type === 'code' && section.content && (
                  <div className="my-6">
                    <InteractiveCodePreview codeData={section.content} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {sections.length === 0 && !objectives.some(obj => obj.trim()) && !procedures.some(proc => proc.trim()) && (
          <div className="text-center py-12 text-[var(--ink3)]">
            <p>No content to preview yet. Add content in the Basic Information and Content Builder tabs.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/faculty/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/faculty/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/faculty/templates" className="text-[var(--accent)] font-medium">Templates</Link>
              </nav>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/faculty/templates" className="text-[var(--accent)] hover:text-[var(--accent2)] mb-4 inline-block">
            ← Back to Templates
          </Link>
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Create Experiment Template</h1>
          <p className="text-[var(--ink3)]">Create a structured template with rich content</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[var(--paper3)]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
                activeTab === 'import'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--ink3)] hover:text-[var(--ink)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import PDF
            </button>
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'basic'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--ink3)] hover:text-[var(--ink)]'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'content'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--ink3)] hover:text-[var(--ink)]'
              }`}
            >
              Content Builder
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--ink3)] hover:text-[var(--ink)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'import' ? (
          <div>
            <PDFExtractor onExtract={handlePDFExtract} />
            
            <div className="mt-6 text-center">
              <p className="text-[var(--ink3)] mb-4">Or create a template manually</p>
              <button
                onClick={() => setActiveTab('basic')}
                className="px-6 py-3 bg-white border border-[var(--paper3)] text-[var(--ink)] rounded-lg hover:border-[var(--accent)] transition"
              >
                Create Manually
              </button>
            </div>
          </div>
        ) : activeTab === 'basic' ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <h2 className="text-xl font-bold text-[var(--ink)] heading mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Experiment Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Verification of Ohm's Law"
                    className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief overview of the experiment..."
                    className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Visible To Departments
                  </label>
                  <p className="text-xs text-[var(--ink3)] mb-3">
                    Your department always has access. Select additional departments that can view and use this template.
                  </p>
                  <div className="max-h-56 overflow-auto rounded-lg border border-[var(--paper3)] p-3 space-y-2">
                    {availableDepartments.length === 0 ? (
                      <p className="text-sm text-[var(--ink3)]">No department list available yet.</p>
                    ) : (
                      availableDepartments.map((dept, index) => {
                        const deptId = dept.id || dept._id || '';
                        const deptKey = dept.id || dept._id || `${dept.name}-${index}`;
                        const isOwnerDepartment = !!departmentId && deptId === departmentId;
                        const checked = isOwnerDepartment || (deptId ? visibleToDepartmentIds.includes(deptId) : false);

                        return (
                          <label key={deptKey} className={`flex items-center gap-3 text-sm ${isOwnerDepartment ? 'opacity-70' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isOwnerDepartment || !deptId}
                              onChange={() => {
                                if (deptId) {
                                  toggleVisibleDepartment(deptId);
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-[var(--ink)]">{dept.name}</span>
                            {isOwnerDepartment && (
                              <span className="text-xs px-2 py-0.5 rounded bg-[var(--paper)] text-[var(--ink3)]">Owner</span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Objectives */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--ink)] heading">Objectives *</h2>
                <button
                  type="button"
                  onClick={addObjective}
                  className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-3">
                {objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      placeholder={`Objective ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Procedure */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--ink)] heading">Procedure Steps</h2>
                <button
                  type="button"
                  onClick={addProcedure}
                  className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
                >
                  + Add Step
                </button>
              </div>
              <div className="space-y-3">
                {procedures.map((procedure, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="px-3 py-2 bg-[var(--paper)] text-[var(--ink3)] rounded font-medium min-w-[40px] text-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={procedure}
                      onChange={(e) => updateProcedure(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                    />
                    {procedures.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProcedure(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Use the "Content Builder" tab to customize the default sections (Aim, Apparatus, Theory, etc.) or add additional content like images and diagrams.
              </p>
            </div>
          </div>
        ) : activeTab === 'content' ? (
          <div>
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-green-800">
                    <strong>Default Sections Loaded:</strong> We've pre-populated common sections (Aim, Apparatus, Software/Hardware, Theory, Observations, Output, Conclusion). Edit or add more sections as needed!
                  </p>
                </div>
                <AITemplateBuilder 
                  title={formData.title}
                  onGenerate={handleAIGenerate}
                />
              </div>
            </div>
            <DragDropBuilder 
              sections={sections} 
              onChange={setSections}
              experimentTitle={formData.title}
              experimentDescription={formData.description}
            />
          </div>
        ) : (
          <div>
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Preview Mode:</strong> This is how your template will appear to students. Switch to other tabs to make changes.
              </p>
            </div>
            {renderPreview()}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="mt-8 flex gap-4 sticky bottom-4 bg-white border border-[var(--paper3)] rounded-lg p-4 shadow-lg">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating...' : 'Create Template'}
          </button>
          <Link
            href="/faculty/templates"
            className="px-6 py-3 bg-white border border-[var(--paper3)] text-[var(--ink)] rounded-lg hover:border-[var(--accent)] transition text-center"
          >
            Cancel
          </Link>
        </div>
      </main>
    </div>
  );
}
