import React, { useState } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { FileText, Download, UploadCloud } from 'lucide-react';

export default function InvoiceGenerator({ data }: { data: any }) {
  const [template, setTemplate] = useState<File | null>(null);

  const generateWord = async () => {
    if (!template) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as ArrayBuffer;
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      try {
        doc.render(data);
      } catch (error) {
        console.error("Word generation error:", error);
        return;
      }

      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(out, "invoice.docx");
    };
    reader.readAsArrayBuffer(template);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Invoice Generator</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Upload Word Template (.docx)</label>
        <input type="file" accept=".docx" onChange={(e) => setTemplate(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      </div>
      <button onClick={generateWord} disabled={!template} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
        <Download className="w-4 h-4" /> Generate Word Doc
      </button>
    </div>
  );
}
