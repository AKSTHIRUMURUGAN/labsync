'use client';

import { useState } from 'react';

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

interface StudentObservationTableProps {
  tableData: any;
  onChange?: (data: any) => void;
  readOnly?: boolean;
}

export default function StudentObservationTable({ tableData, onChange, readOnly = false }: StudentObservationTableProps) {
  const [rows, setRows] = useState<Row[]>(tableData.rows || []);
  const columns: Column[] = tableData.columns || [];

  const evaluateFormula = (formula: string, values: any, cols: Column[]): number | string => {
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

  const updateCellValue = (rowId: string, columnId: string, value: any) => {
    const newRows = rows.map(row => {
      if (row.id === rowId) {
        const newValues = { ...row.values, [columnId]: value };
        
        // Calculate output columns with formulas (multiple passes for dependencies)
        let maxIterations = 5;
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
    });
    
    setRows(newRows);
    if (onChange) {
      onChange({ ...tableData, rows: newRows });
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

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-[var(--paper3)]">
          <thead>
            <tr className="bg-[var(--paper)]">
              {columns.map((col) => (
                <th key={col.id} className="px-4 py-2 text-left text-sm font-medium border border-[var(--paper3)]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      col.type === 'sno' ? 'bg-gray-200 text-gray-700' :
                      col.type === 'input' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {col.type.toUpperCase()}
                    </span>
                    <span>{col.name}</span>
                    {col.unit && <span className="text-xs text-[var(--ink3)]">({col.unit})</span>}
                  </div>
                  {col.formula && (
                    <div className="text-xs text-purple-600 font-mono mt-1">= {col.formula}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-[var(--paper)]">
                {columns.map((column) => (
                  <td key={column.id} className="px-4 py-2 border border-[var(--paper3)]">
                    {column.type === 'sno' || (column.type === 'output' && column.formula) ? (
                      <span className={`${column.type === 'output' ? 'text-green-700 font-semibold' : 'text-[var(--ink3)]'}`}>
                        {getCellValue(row, column, rowIndex) || '-'}
                      </span>
                    ) : readOnly ? (
                      <span className="text-[var(--ink2)]">
                        {getCellValue(row, column, rowIndex) || '-'}
                      </span>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={getCellValue(row, column, rowIndex)}
                        onChange={(e) => updateCellValue(row.id, column.id, e.target.value)}
                        className="w-full px-2 py-1 border border-[var(--paper3)] rounded focus:ring-2 focus:ring-[var(--accent)] outline-none"
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
      
      <div className="text-sm text-[var(--ink3)] bg-blue-50 border border-blue-200 rounded p-3">
        <strong>Instructions:</strong> {readOnly 
          ? 'This observation table is read-only. You cannot modify the values.' 
          : 'Fill in the input columns (blue). Output columns (green) will calculate automatically based on formulas.'}
      </div>
    </div>
  );
}
