'use client';

import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Column {
  id: string;
  name: string;
  type: 'sno' | 'input' | 'output';
  formula?: string;
  unit?: string;
}

interface Row {
  id: string;
  values: { [columnId: string]: any };
}

interface ObservationTableBuilderProps {
  onSave: (tableData: any) => void;
  experimentTitle?: string;
  experimentDescription?: string;
}

// Sortable Column Component
function SortableColumn({ column, onUpdate, onDelete }: { 
  column: Column; 
  onUpdate: (updates: Partial<Column>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center p-2 bg-[var(--paper)] rounded">
      {column.type !== 'sno' && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-white rounded cursor-move"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4 text-[var(--ink3)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 10-.001 4.001A2 2 0 007 2zm0 6a2 2 0 10-.001 4.001A2 2 0 007 8zm0 6a2 2 0 10-.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10-.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10-.001 4.001A2 2 0 0013 14z"/>
          </svg>
        </button>
      )}
      
      <span className={`px-2 py-1 text-xs rounded font-medium ${
        column.type === 'sno' ? 'bg-gray-200 text-gray-700' :
        column.type === 'input' ? 'bg-blue-100 text-blue-700' :
        'bg-green-100 text-green-700'
      }`}>
        {column.type.toUpperCase()}
      </span>
      
      <input
        type="text"
        value={column.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        disabled={column.type === 'sno'}
        className="flex-1 px-2 py-1 text-sm border border-[var(--paper3)] rounded focus:ring-1 focus:ring-[var(--accent)] outline-none disabled:bg-gray-100"
        placeholder="Column name"
      />
      
      {column.type !== 'sno' && (
        <input
          type="text"
          value={column.unit || ''}
          onChange={(e) => onUpdate({ unit: e.target.value })}
          className="w-20 px-2 py-1 text-sm border border-[var(--paper3)] rounded focus:ring-1 focus:ring-[var(--accent)] outline-none"
          placeholder="Unit"
        />
      )}
      
      {column.type === 'output' && (
        <div className="flex gap-1">
          <input
            type="text"
            value={column.formula || ''}
            onChange={(e) => onUpdate({ formula: e.target.value })}
            className="flex-1 px-2 py-1 text-sm border border-purple-300 bg-purple-50 rounded focus:ring-1 focus:ring-purple-500 outline-none font-mono"
            placeholder="Formula: e.g., Input 1 * 2 + Input 2"
          />
          <button
            onClick={() => {
              const templates = [
                'Input 1 * 2',
                'Input 1 + Input 2',
                'sqrt(Input 1)',
                'sin(Input 1)',
                'pow(Input 1, 2)',
                'abs(Input 1 - Input 2)',
              ];
              const formula = prompt('Enter formula or choose:\n\n' + templates.join('\n'));
              if (formula) onUpdate({ formula });
            }}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            title="Formula helper"
          >
            ƒx
          </button>
        </div>
      )}
      
      {column.type !== 'sno' && (
        <button
          onClick={onDelete}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function ObservationTableBuilder({ onSave, experimentTitle, experimentDescription }: ObservationTableBuilderProps) {
  const [tableName, setTableName] = useState('Observation Table');
  const [columns, setColumns] = useState<Column[]>([
    { id: 'col-sno', name: 'S.No', type: 'sno' },
    { id: 'col-1', name: 'Input 1', type: 'input', unit: '' },
    { id: 'col-2', name: 'Output 1', type: 'output', unit: '', formula: '' },
  ]);
  const [rows, setRows] = useState<Row[]>([
    { id: 'row-1', values: {} },
    { id: 'row-2', values: {} },
    { id: 'row-3', values: {} },
  ]);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('bar');
  const [selectedXColumn, setSelectedXColumn] = useState('');
  const [selectedYColumn, setSelectedYColumn] = useState('');
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Common formula templates
  const formulaTemplates = [
    { name: 'Percentage Error', formula: 'abs((Input 1 - Input 2) / Input 2) * 100' },
    { name: 'Average', formula: '(Input 1 + Input 2) / 2' },
    { name: 'Velocity', formula: 'Input 1 / Input 2' },
    { name: 'Acceleration', formula: '(Input 1 - Input 2) / Input 3' },
    { name: 'Area of Circle', formula: 'PI * pow(Input 1, 2)' },
    { name: 'Circumference', formula: '2 * PI * Input 1' },
    { name: 'Pythagorean', formula: 'sqrt(pow(Input 1, 2) + pow(Input 2, 2))' },
    { name: 'Sine Law', formula: 'Input 1 * sin(Input 2) / sin(Input 3)' },
    { name: 'Kinetic Energy', formula: '0.5 * Input 1 * pow(Input 2, 2)' },
    { name: 'Potential Energy', formula: 'Input 1 * 9.8 * Input 2' },
  ];

  const generateTableWithAI = async (retryCount = 0) => {
    const maxRetries = 2;
    setIsGeneratingAI(true);
    const loadingToast = toast.loading('🤖 AI is generating your observation table...');
    
    try {
      const context = experimentTitle || experimentDescription || aiPrompt;
      
      if (!context) {
        toast.dismiss(loadingToast);
        toast.error('Please provide experiment details or a description for the table');
        setShowAIDialog(true);
        setIsGeneratingAI(false);
        return;
      }

      const response = await fetch('/api/ai/generate-observation-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentTitle,
          experimentDescription,
          customPrompt: aiPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 503 with retry
        if ((data.error?.includes('high demand') || data.error?.includes('503')) && retryCount < maxRetries) {
          toast.dismiss(loadingToast);
          const waitTime = (retryCount + 1) * 2; // 2s, 4s
          toast.loading(`AI is busy. Retrying in ${waitTime} seconds...`, {
            id: loadingToast,
            icon: '⏳',
          });
          
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          setIsGeneratingAI(false);
          return generateTableWithAI(retryCount + 1);
        }
        
        // Handle specific error cases
        if (data.error?.includes('high demand') || data.error?.includes('503')) {
          toast.dismiss(loadingToast);
          toast.error('AI service is experiencing high demand. Please try again in a moment.', {
            duration: 5000,
            icon: '⏳',
          });
        } else if (data.error?.includes('API key')) {
          toast.dismiss(loadingToast);
          toast.error('AI service configuration error. Please contact support.', {
            duration: 5000,
          });
        } else {
          toast.dismiss(loadingToast);
          toast.error(data.error || 'Failed to generate table', {
            duration: 5000,
          });
        }
        setIsGeneratingAI(false);
        return;
      }
      
      if (data.success && data.data) {
        const aiTable = data.data;
        
        // Set table name
        if (aiTable.tableName) {
          setTableName(aiTable.tableName);
        }
        
        // Set columns
        if (aiTable.columns && aiTable.columns.length > 0) {
          const newColumns: Column[] = [
            { id: 'col-sno', name: 'S.No', type: 'sno' },
            ...aiTable.columns.map((col: any, idx: number) => ({
              id: `col-${Date.now()}-${idx}`,
              name: col.name,
              type: col.type,
              unit: col.unit || '',
              formula: col.formula || '',
            }))
          ];
          setColumns(newColumns);
        }
        
        // Set rows
        if (aiTable.rowCount) {
          const newRows: Row[] = Array.from({ length: aiTable.rowCount }, (_, idx) => ({
            id: `row-${Date.now()}-${idx}`,
            values: {},
          }));
          setRows(newRows);
        }
        
        setShowAIDialog(false);
        setAiPrompt('');
        
        toast.dismiss(loadingToast);
        toast.success('✨ Table generated successfully! Review and adjust as needed.', {
          duration: 4000,
          icon: '🎉',
        });
      } else {
        toast.dismiss(loadingToast);
        toast.error('Invalid response from AI. Please try again.', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('high demand') || errorMessage.includes('503')) {
        toast.error('AI service is busy right now. Please try again in a moment.', {
          duration: 5000,
          icon: '⏳',
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.', {
          duration: 5000,
          icon: '🌐',
        });
      } else {
        toast.error(`Failed to generate table: ${errorMessage}`, {
          duration: 5000,
        });
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
      
      // Don't allow moving S.No column
      if (columns[oldIndex].type === 'sno' || columns[newIndex].type === 'sno') {
        return;
      }
      
      setColumns(arrayMove(columns, oldIndex, newIndex));
    }
  };

  const addColumn = (type: 'input' | 'output') => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: type === 'input' ? 'New Input' : 'New Output',
      type,
      unit: '',
      formula: type === 'output' ? '' : undefined
    };
    setColumns([...columns, newColumn]);
  };

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(columns.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  const deleteColumn = (id: string) => {
    if (columns.length > 2) {
      setColumns(columns.filter(col => col.id !== id));
      // Clear values for this column in all rows
      setRows(rows.map(row => {
        const newValues = { ...row.values };
        delete newValues[id];
        return { ...row, values: newValues };
      }));
    }
  };

  const addRow = () => {
    setRows([...rows, { id: `row-${Date.now()}`, values: {} }]);
  };

  const deleteRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateCellValue = (rowId: string, columnId: string, value: any) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newValues = { ...row.values, [columnId]: value };
        
        // Calculate output columns with formulas (multiple passes for dependencies)
        let maxIterations = 5; // Prevent infinite loops
        let hasChanges = true;
        
        while (hasChanges && maxIterations > 0) {
          hasChanges = false;
          maxIterations--;
          
          columns.forEach(col => {
            if (col.type === 'output' && col.formula) {
              const oldValue = newValues[col.id];
              const calculatedValue = evaluateFormula(col.formula, newValues, columns);
              
              if (calculatedValue !== oldValue && calculatedValue !== '') {
                newValues[col.id] = calculatedValue;
                hasChanges = true;
              }
            }
          });
        }
        
        return { ...row, values: newValues };
      }
      return row;
    }));
  };

  const evaluateFormula = (formula: string, values: any, cols: Column[]): number | string => {
    if (!formula || formula.trim() === '') return '';
    
    try {
      // Step 1: Replace mathematical functions FIRST (before variable substitution)
      let expression = formula
        // Constants
        .replace(/\bPI\b/gi, 'Math.PI')
        .replace(/\bE\b/gi, 'Math.E')
        // Trigonometric functions (convert degrees to radians)
        .replace(/sin\s*\(\s*([^)]+)\s*\)/gi, (match, angle) => {
          return `Math.sin((${angle}) * Math.PI / 180)`;
        })
        .replace(/cos\s*\(\s*([^)]+)\s*\)/gi, (match, angle) => {
          return `Math.cos((${angle}) * Math.PI / 180)`;
        })
        .replace(/tan\s*\(\s*([^)]+)\s*\)/gi, (match, angle) => {
          return `Math.tan((${angle}) * Math.PI / 180)`;
        })
        // Inverse trigonometric functions (return in degrees)
        .replace(/asin\s*\(\s*([^)]+)\s*\)/gi, (match, value) => {
          return `(Math.asin(${value}) * 180 / Math.PI)`;
        })
        .replace(/acos\s*\(\s*([^)]+)\s*\)/gi, (match, value) => {
          return `(Math.acos(${value}) * 180 / Math.PI)`;
        })
        .replace(/atan\s*\(\s*([^)]+)\s*\)/gi, (match, value) => {
          return `(Math.atan(${value}) * 180 / Math.PI)`;
        })
        // Logarithmic functions
        .replace(/log\s*\(\s*([^)]+)\s*\)/gi, 'Math.log10($1)')
        .replace(/ln\s*\(\s*([^)]+)\s*\)/gi, 'Math.log($1)')
        // Power and roots
        .replace(/sqrt\s*\(\s*([^)]+)\s*\)/gi, 'Math.sqrt($1)')
        .replace(/pow\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'Math.pow($1, $2)')
        .replace(/\^/g, '**') // Power operator
        // Absolute value
        .replace(/abs\s*\(\s*([^)]+)\s*\)/gi, 'Math.abs($1)')
        // Rounding functions
        .replace(/round\s*\(\s*([^)]+)\s*\)/gi, 'Math.round($1)')
        .replace(/floor\s*\(\s*([^)]+)\s*\)/gi, 'Math.floor($1)')
        .replace(/ceil\s*\(\s*([^)]+)\s*\)/gi, 'Math.ceil($1)');
      
      // Step 2: Replace column references with actual values
      // Sort columns by name length (longest first) to avoid partial matches
      const sortedCols = [...cols].sort((a, b) => b.name.length - a.name.length);
      
      // Replace input columns
      sortedCols.forEach(col => {
        if (col.type === 'input') {
          const value = values[col.id];
          if (value !== undefined && value !== null && value !== '') {
            // Escape special regex characters in column name
            const escapedName = col.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
            expression = expression.replace(regex, `(${value})`);
          }
        }
      });
      
      // Replace output columns (for dependent calculations)
      sortedCols.forEach(col => {
        if (col.type === 'output' && col.formula) {
          const value = values[col.id];
          if (value !== undefined && value !== null && value !== '') {
            // Escape special regex characters in column name
            const escapedName = col.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
            expression = expression.replace(regex, `(${value})`);
          }
        }
      });
      
      // Step 3: Check if expression still has unresolved variables (excluding Math.)
      const testExpression = expression.replace(/Math\.[a-zA-Z]+/g, '');
      if (/[a-zA-Z_][a-zA-Z0-9_]*/g.test(testExpression)) {
        // Has unresolved variables, return empty
        return '';
      }
      
      // Step 4: Evaluate the expression
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      
      // Step 5: Check for invalid results
      if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
        return '';
      }
      
      // Round to 4 decimal places
      return typeof result === 'number' ? Math.round(result * 10000) / 10000 : result;
    } catch (error) {
      console.error('Formula evaluation error:', error, 'Formula:', formula);
      return '';
    }
  };

  const getCellValue = (row: Row, column: Column, rowIndex: number): any => {
    if (column.type === 'sno') {
      return rowIndex + 1;
    }
    
    if (column.type === 'output' && column.formula) {
      const result = evaluateFormula(column.formula, row.values, columns);
      return result === '' ? '' : result;
    }
    
    return row.values[column.id] || '';
  };

  const getChartData = () => {
    const xCol = columns.find(c => c.id === selectedXColumn);
    const yCol = columns.find(c => c.id === selectedYColumn);
    
    if (!xCol || !yCol) return null;

    const labels = rows.map((row, idx) => {
      const val = getCellValue(row, xCol, idx);
      return xCol.type === 'sno' ? `Row ${val}` : val.toString();
    });
    
    const data = rows.map((row, idx) => {
      const val = getCellValue(row, yCol, idx);
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });

    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
    ];

    return {
      labels,
      datasets: [{
        label: yCol.name,
        data,
        backgroundColor: chartType === 'pie' ? colors : 'rgba(54, 162, 235, 0.6)',
        borderColor: chartType === 'pie' ? colors.map(c => c.replace('0.6', '1')) : 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  };

  const handleSave = () => {
    const tableData = {
      name: tableName,
      columns: columns.map(col => ({
        id: col.id,
        name: col.name,
        type: col.type,
        formula: col.formula,
        unit: col.unit
      })),
      rows: rows.map((row, idx) => ({
        id: row.id,
        values: columns.reduce((acc, col) => {
          acc[col.id] = getCellValue(row, col, idx);
          return acc;
        }, {} as any)
      }))
    };
    
    onSave(tableData);
  };

  const chartData = getChartData();

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
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* AI Dialog */}
      {showAIDialog && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[var(--ink)]">Generate Table with AI</h3>
              <button
                onClick={() => setShowAIDialog(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {experimentTitle && (
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1">
                    Experiment Title
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm">
                    {experimentTitle}
                  </div>
                </div>
              )}
              
              {experimentDescription && (
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1">
                    Experiment Description
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm max-h-32 overflow-y-auto">
                    {experimentDescription}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                  rows={4}
                  placeholder="E.g., Include columns for voltage, current, and resistance with Ohm's law formula..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>AI will generate:</strong>
                  <br />• Appropriate column names and types (Input/Output)
                  <br />• Units for each column
                  <br />• Formulas for calculated columns
                  <br />• Suggested number of rows
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAIDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => generateTableWithAI()}
                  disabled={isGeneratingAI}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGeneratingAI ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 7H7v6h6V7z"/>
                        <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
                      </svg>
                      Generate Table
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Name with AI Button */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-[var(--ink)] mb-2">
            Table Name
          </label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
          />
        </div>
        <button
          onClick={() => setShowAIDialog(true)}
          disabled={isGeneratingAI}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          title="Generate table with AI"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
          </svg>
          Build with AI
        </button>
      </div>

      {/* Column Management */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[var(--ink)]">Columns (Drag to Reorder)</h3>
          <div className="flex gap-2">
            <button
              onClick={() => addColumn('input')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              + Input
            </button>
            <button
              onClick={() => addColumn('output')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              + Output
            </button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            <div className="space-y-2">
              {columns.map((column) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  onUpdate={(updates) => updateColumn(column.id, updates)}
                  onDelete={() => deleteColumn(column.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        <div className="mt-4 space-y-3">
          <button
            onClick={() => setShowFormulaHelp(!showFormulaHelp)}
            className="text-sm text-purple-700 hover:text-purple-900 font-medium flex items-center gap-2"
          >
            <svg className={`w-4 h-4 transition-transform ${showFormulaHelp ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {showFormulaHelp ? 'Hide' : 'Show'} Formula Guide & Examples
          </button>
          
          {showFormulaHelp && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-purple-800 font-semibold mb-2">
                  Available Functions:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
                  <div>
                    <strong>Basic Math:</strong> +, -, *, /, %, ^, pow(x,y)
                  </div>
                  <div>
                    <strong>Trigonometry:</strong> sin, cos, tan, asin, acos, atan
                  </div>
                  <div>
                    <strong>Logarithms:</strong> log (base 10), ln (natural)
                  </div>
                  <div>
                    <strong>Other:</strong> sqrt, abs, round, floor, ceil
                  </div>
                  <div>
                    <strong>Constants:</strong> PI (3.14159...), E (2.71828...)
                  </div>
                  <div>
                    <strong>Variables:</strong> Use any Input or Output column name
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-purple-800 font-semibold mb-2">
                  Common Formula Templates:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {formulaTemplates.map((template, idx) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded border border-purple-200">
                      <div className="font-medium text-purple-900">{template.name}</div>
                      <code className="text-purple-700 text-[10px]">{template.formula}</code>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-xs text-purple-600 bg-white p-3 rounded border border-purple-200">
                <strong>Note:</strong> Trigonometric functions use degrees (not radians). 
                Output columns can reference other output columns for dependent calculations.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--paper)]">
              {columns.map((column) => (
                <th key={column.id} className="px-4 py-2 text-left text-sm font-medium text-[var(--ink)] border-b border-[var(--paper3)]">
                  <div>
                    {column.name}
                    {column.unit && <span className="text-xs text-[var(--ink3)] ml-1">({column.unit})</span>}
                  </div>
                  {column.formula && (
                    <div className="text-xs text-purple-600 font-mono mt-1">= {column.formula}</div>
                  )}
                </th>
              ))}
              <th className="px-4 py-2 w-16 border-b border-[var(--paper3)]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-[var(--paper)]">
                {columns.map((column) => (
                  <td key={column.id} className="px-4 py-2 border-b border-[var(--paper3)]">
                    {column.type === 'sno' ? (
                      <span className="text-[var(--ink3)]">{getCellValue(row, column, rowIndex)}</span>
                    ) : column.type === 'output' && column.formula ? (
                      <span className="text-green-700 font-medium">
                        {getCellValue(row, column, rowIndex) || '-'}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={row.values[column.id] || ''}
                        onChange={(e) => updateCellValue(row.id, column.id, e.target.value)}
                        className="w-full px-2 py-1 border border-[var(--paper3)] rounded focus:ring-1 focus:ring-[var(--accent)] outline-none"
                        placeholder="0"
                      />
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 border-b border-[var(--paper3)]">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 border-t border-[var(--paper3)]">
          <button
            onClick={addRow}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
          >
            + Add Row
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[var(--ink)]">Data Visualization</h3>
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
          >
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>

        {showChart && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                  X-Axis
                </label>
                <select
                  value={selectedXColumn}
                  onChange={(e) => setSelectedXColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                >
                  <option value="">Select column</option>
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Y-Axis
                </label>
                <select
                  value={selectedYColumn}
                  onChange={(e) => setSelectedYColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                >
                  <option value="">Select column</option>
                  {columns.filter(c => c.type !== 'sno').map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {chartData && selectedXColumn && selectedYColumn && (
              <div className="mt-6 p-4 bg-[var(--paper)] rounded-lg">
                <div className="max-w-2xl mx-auto">
                  {chartType === 'pie' && <Pie data={chartData} />}
                  {chartType === 'bar' && <Bar data={chartData} />}
                  {chartType === 'line' && <Line data={chartData} />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          Save Table
        </button>
      </div>
    </div>
  );
}
