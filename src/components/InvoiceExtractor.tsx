import React, { useState, useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { FileText, UploadCloud, CheckCircle, AlertCircle, Loader2, X, Download } from 'lucide-react';
import { extractDocumentData } from '../lib/gemini';
import { INVOICE_PROMPT, INVOICE_SCHEMA } from '../lib/schemas';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type FileStatus = 'pending' | 'processing' | 'success' | 'error';

interface ProcessedFile {
  id: string;
  file: File;
  status: FileStatus;
  data?: any;
  error?: string;
}

export default function InvoiceExtractor() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending' as FileStatus,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    
    newFiles.forEach((f) => processFile(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  } as any);

  const processFile = async (fileObj: ProcessedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing' } : f))
    );

    try {
      const base64 = await fileToBase64(fileObj.file);
      const data = await extractDocumentData(
        base64,
        fileObj.file.type,
        INVOICE_PROMPT,
        INVOICE_SCHEMA
      );

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: 'success', data } : f
        )
      );
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? { ...f, status: 'error', error: error.message || 'Failed to process' }
            : f
        )
      );
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, part
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const exportData = (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      const successfulFiles = files.filter((f) => f.status === 'success' && f.data);
      if (successfulFiles.length === 0) return;

      // Flatten data for export
      const exportData = successfulFiles.flatMap((f) => {
        const { lineItems, ...invoiceData } = f.data;
        if (lineItems && lineItems.length > 0) {
          return lineItems.map((item: any) => ({
            fileName: f.file.name,
            ...invoiceData,
            ...item,
          }));
        } else {
          return [{ fileName: f.file.name, ...invoiceData }];
        }
      });

      if (format === 'csv') {
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'invoices.csv';
        link.click();
      } else {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
        XLSX.writeFile(workbook, 'invoices.xlsx');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Extractor</h2>
        <p className="text-gray-600">
          Upload PDF invoices or images to extract structured data for your accountant.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900">
          Click to upload or drag and drop
        </p>
        <p className="text-sm text-gray-500 mt-1">PDF or Images up to 10MB</p>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Processed Files ({files.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => exportData('csv')}
                disabled={isExporting || !files.some((f) => f.status === 'success')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => exportData('xlsx')}
                disabled={isExporting || !files.some((f) => f.status === 'success')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      {file.status === 'success' && file.data && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600 truncate">
                            {file.data.vendorName || 'Unknown Vendor'} •{' '}
                            {file.data.invoiceNumber || 'No Inv #'} • $
                            {file.data.totalAmount || '0.00'}
                          </span>
                        </>
                      )}
                      {file.status === 'error' && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-red-600 truncate">
                            {file.error}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4 shrink-0">
                  {file.status === 'pending' && (
                    <span className="text-sm text-gray-500">Pending</span>
                  )}
                  {file.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
