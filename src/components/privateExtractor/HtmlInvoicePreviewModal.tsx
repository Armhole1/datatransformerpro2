import React from 'react';
import { DynamicInvoice } from '../../services/GeminiService';
import { X, Printer } from 'lucide-react';

interface Props {
  data: DynamicInvoice;
  htmlTemplate: string;
  onClose: () => void;
}

export default function HtmlInvoicePreviewModal({ data, htmlTemplate, onClose }: Props) {
  const generateHtml = () => {
    let finalHtml = htmlTemplate;
    
    // Replace fields
    data.fields.forEach(f => {
      finalHtml = finalHtml.replace(new RegExp(`{{${f.id}}}`, 'g'), f.value || '');
    });

    // Replace tables
    data.tables.forEach(t => {
      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              ${t.columns.map(c => `<th style="border: 1px solid #ccc; padding: 8px; text-align: left; background-color: #f9f9f9;">${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${t.rows.map(r => `
              <tr>
                ${r.cells.map(c => `<td style="border: 1px solid #ccc; padding: 8px;">${c}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      finalHtml = finalHtml.replace(new RegExp(`{{${t.id}}}`, 'g'), tableHtml);
    });

    return finalHtml;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${data.templateName || 'Invoice'}</title>
            <style>
              body { font-family: sans-serif; margin: 0; padding: 20px; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>${generateHtml()}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-4 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Exact Match Preview</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 rounded-lg p-8 flex justify-center">
          <div 
            className="bg-white shadow-sm p-8 max-w-[800px] w-full"
            dangerouslySetInnerHTML={{ __html: generateHtml() }}
          />
        </div>
      </div>
    </div>
  );
}
