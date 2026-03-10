import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Lock, UploadCloud, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { extractTextLocally, parseTextToStructuredData } from '../lib/localParser';

type FileStatus = 'pending' | 'processing' | 'success' | 'error';

interface ProcessedFile {
  id: string;
  file: File;
  status: FileStatus;
  data?: any;
  error?: string;
}

export default function PrivateExtractor() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);

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
  });

  const processFile = async (fileObj: ProcessedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing' } : f))
    );

    try {
      const text = await extractTextLocally(fileObj.file);
      const data = parseTextToStructuredData(text);

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

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Lock className="w-6 h-6 text-emerald-600" />
          Private Local Extractor
        </h2>
        <p className="text-gray-600">
          Process documents entirely in your browser. No data is sent to any server.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processed Files ({files.length})
          </h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                    <Lock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    {file.status === 'success' && file.data && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        Total: ${file.data.extractedFields.totalAmount} • Date: {file.data.extractedFields.date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4 shrink-0">
                  {file.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
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
