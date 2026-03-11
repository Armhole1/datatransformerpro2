import React from 'react';
import { DynamicInvoice } from '../../services/GeminiService';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  data: DynamicInvoice;
  onChange: (data: DynamicInvoice) => void;
}

export default function InvoiceEditor({ data, onChange }: Props) {
  const updateField = (index: number, value: string) => {
    const newData = { ...data };
    newData.fields[index].value = value;
    onChange(newData);
  };

  const updateCell = (tIndex: number, rIndex: number, cIndex: number, value: string) => {
    const newData = { ...data };
    newData.tables[tIndex].rows[rIndex].cells[cIndex] = value;
    onChange(newData);
  };

  const addRow = (tIndex: number) => {
    const newData = { ...data };
    const colCount = newData.tables[tIndex].columns.length;
    newData.tables[tIndex].rows.push({ cells: Array(colCount).fill('') });
    onChange(newData);
  };

  const removeRow = (tIndex: number, rIndex: number) => {
    const newData = { ...data };
    newData.tables[tIndex].rows.splice(rIndex, 1);
    onChange(newData);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.fields.map((field, i) => (
          <div key={field.id || i}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
            <input
              type="text"
              value={field.value || ''}
              onChange={(e) => updateField(i, e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        ))}
      </div>

      {data.tables.map((table, tIndex) => (
        <div key={table.id || tIndex} className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">{table.label}</h4>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  {table.columns.map((col, i) => (
                    <th key={i} className="border-b border-gray-200 dark:border-gray-700 p-2 text-left text-gray-700 dark:text-gray-300 font-medium">{col}</th>
                  ))}
                  <th className="border-b border-gray-200 dark:border-gray-700 p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rIndex) => (
                  <tr key={rIndex} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                    {row.cells.map((cell, cIndex) => (
                      <td key={cIndex} className="p-1 border-r border-gray-200 dark:border-gray-700 last:border-0">
                        <input
                          type="text"
                          value={cell || ''}
                          onChange={(e) => updateCell(tIndex, rIndex, cIndex, e.target.value)}
                          className="w-full p-1.5 bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded text-gray-900 dark:text-white"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <button onClick={() => removeRow(tIndex, rIndex)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => addRow(tIndex)} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-2">
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>
      ))}
    </div>
  );
}
