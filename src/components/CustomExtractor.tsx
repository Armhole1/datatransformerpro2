import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Download, Wrench, X, Loader2 } from 'lucide-react';
import { extractTextLocally, parseTextWithTemplate, Template } from '../lib/localParser';
import { DEFAULT_TEMPLATE } from './PrivateExtractor';

interface ProcessedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  data?: {
    extractedFields: Record<string, string>;
    lineItems?: Record<string, string>[];
  };
}

export default function CustomExtractor() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => processFile(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
  } as any);

  const processFile = async (fileObj: ProcessedFile) => {
    setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing' } : f)));
    try {
      const text = await extractTextLocally(fileObj.file);
      const data = parseTextWithTemplate(text, DEFAULT_TEMPLATE);
      setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'success', data } : f)));
    } catch (error) {
      setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'error' } : f)));
    }
  };

  const parsePastedTable = (id: string, pastedText: string) => {
    const lines = pastedText.trim().split('\n').filter(line => line.trim() !== '');
    let rows = lines.map(row => row.trim().split('\t'));
    if (rows.length > 0 && rows[0].length < 2) rows = lines.map(row => row.trim().split(/\s+/));
    
    const lineItems = rows.map(row => ({
      quantity: row[0] || '',
      description: row.slice(1, row.length - 2).join(' ') || '',
      unitPrice: row[row.length - 2] || '',
      total: row[row.length - 1] || ''
    }));

    setFiles((prev) => prev.map((f) => f.id === id && f.data ? { ...f, data: { ...f.data, lineItems } } : f));
  };

  const downloadFlattenedCSV = (file: ProcessedFile) => {
    if (!file.data) return;
    const { extractedFields, lineItems } = file.data;
    
    let csvContent = "fileName,date,invoiceNumber,taxAmount,totalAmount,vendorName,description,quantity,total,unitPrice\n";
    
    const baseFields = [
      file.file.name,
      extractedFields['Date'] || '',
      extractedFields['Invoice Number'] || '',
      '0', // taxAmount placeholder
      extractedFields['Total'] || '',
      extractedFields['Vendor Name'] || ''
    ].map(v => `"${v}"`).join(',');

    if (lineItems && lineItems.length > 0) {
      lineItems.forEach(item => {
        csvContent += `${baseFields},"${item.description}","${item.quantity}","${item.total}","${item.unitPrice}"\n`;
      });
    } else {
      csvContent += `${baseFields},,,,\n`;
    }

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${file.file.name.split('.')[0]}_flattened.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Wrench className="w-6 h-6 text-indigo-600" /> Custom Extractor (Flattened Output)
      </h2>
      <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer mb-8">
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>Click to upload or drag and drop</p>
      </div>
      {files.map(file => (
        <div key={file.id} className="bg-white p-4 border rounded-lg mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">{file.file.name}</span>
            {file.status === 'success' && <button onClick={() => downloadFlattenedCSV(file)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded"><Download className="w-4 h-4" /> Download Flattened CSV</button>}
          </div>
          <textarea className="w-full border rounded p-2 mb-2" rows={3} placeholder="Paste table rows here..." onChange={(e) => parsePastedTable(file.id, e.target.value)} />
        </div>
      ))}
    </div>
  );
}
