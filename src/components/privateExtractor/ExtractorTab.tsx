import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Clipboard, Download, Eye } from 'lucide-react';
import PasteDataModal from './PasteDataModal';
import FileList from './FileList';

export default function ExtractorTab({ 
  files, 
  importCSV, 
  setFiles, 
  updateField,
  updateTableField,
  updateLineItem,
  parseTable,
  addRow,
  deleteRow,
  addTable,
  deleteTable,
  deleteFile,
  viewFile,
  downloadFile,
  onDrop,
  onPasteData,
  handleSaveToGithub,
  handleDownloadAll,
  setIsPreviewOpen,
  reorderFiles
}: any) {
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
  } as any);

  const saveToGithubWithPrompt = () => {
    const token = prompt('GitHub Token:');
    const owner = prompt('GitHub Owner:');
    const repo = prompt('GitHub Repo:');
    const path = prompt('File Path:');
    const message = prompt('Commit Message:');
    if (token && owner && repo && path && message) {
      handleSaveToGithub(token, owner, repo, path, message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div {...getRootProps()} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-emerald-500 transition-colors">
          <input {...getInputProps()} />
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop files</p>
        </div>
        <button onClick={() => setIsPasteModalOpen(true)} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-emerald-500 transition-colors">
          <Clipboard className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Paste Data</p>
        </button>
        <button onClick={handleDownloadAll} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-emerald-500 transition-colors">
          <Download className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Download All</p>
        </button>
        <button onClick={() => setIsPreviewOpen(true)} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-emerald-500 transition-colors">
          <Eye className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Preview</p>
        </button>
        <button onClick={saveToGithubWithPrompt} className="col-span-2 md:col-span-4 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-emerald-500 transition-colors">
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Save to GitHub</p>
        </button>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import from Excel/CSV</label>
        <input type="file" onChange={importCSV} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      </div>
      
      <PasteDataModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onPaste={onPasteData} />

      <FileList 
        files={files}
        updateField={updateField}
        updateTableField={updateTableField}
        updateLineItem={updateLineItem}
        parseTable={parseTable}
        addRow={addRow}
        deleteRow={deleteRow}
        addTable={addTable}
        deleteTable={deleteTable}
        deleteFile={deleteFile}
        viewFile={viewFile}
        downloadFile={downloadFile}
        reorderFiles={reorderFiles}
      />
    </div>
  );
}
