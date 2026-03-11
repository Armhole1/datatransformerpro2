import React from 'react';
import { DynamicInvoice } from '../../services/GeminiService';
import { X } from 'lucide-react';

interface Props {
  data: DynamicInvoice;
  onClose: () => void;
}

export default function InvoicePreviewModal({ data, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data.templateName || 'Invoice Preview'}</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-auto space-y-10 pr-4">
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {data.fields.map((f, i) => (
              <div key={f.id || i} className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{f.label}</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white mt-1">{f.value || '-'}</span>
              </div>
            ))}
          </div>
          {data.tables.map((t, i) => (
            <div key={t.id || i} className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-bold text-xl mb-4 dark:text-white">{t.label}</h4>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      {t.columns.map((col, j) => <th key={j} className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {t.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        {row.cells.map((cell, cIdx) => <td key={cIdx} className="py-3 px-4 text-gray-800 dark:text-gray-300">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
