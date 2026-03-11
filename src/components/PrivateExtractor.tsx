import React from 'react';
import { Lock } from 'lucide-react';
import { Template } from '../lib/localParser';
import ViewDetailsModal from './privateExtractor/ViewDetailsModal';
import PreviewModal from './privateExtractor/PreviewModal';
import ExtractorTab from './privateExtractor/ExtractorTab';
import UnifiedWorkflow from './privateExtractor/UnifiedWorkflow';
import { saveToGithub } from '../services/GithubService';
import { useExtractorState, DEFAULT_TEMPLATE } from '../hooks/useExtractorState';
import { importCSV, handleDownloadAll } from '../utils/excelUtils';

export { DEFAULT_TEMPLATE };

export interface TableData {
  id: string;
  fields: Record<string, string>;
  lineItems: Record<string, string>[];
}

export type FileStatus = 'pending' | 'processing' | 'success' | 'error';

export interface ProcessedFile {
  id: string;
  file: File;
  status: FileStatus;
  templateId: string;
  data?: {
    rawText: string;
    extractedFields: Record<string, string>;
    tables?: TableData[];
  };
  error?: string;
}

export default function PrivateExtractor({ templates, setTemplates }: { templates: Template[], setTemplates: React.Dispatch<React.SetStateAction<Template[]>> }) {
  const state = useExtractorState(templates);

  const handleSaveToGithub = async (token: string, owner: string, repo: string, path: string, message: string) => {
    const successFiles = state.files.filter(f => f.status === 'success' && f.data);
    const content = JSON.stringify(successFiles);
    try {
      await saveToGithub(token, owner, repo, path, content, message);
      alert('Saved to GitHub successfully!');
    } catch (error) {
      console.error('GitHub save error:', error);
      alert('Failed to save to GitHub.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 dark:text-white">
              <Lock className="w-6 h-6 text-emerald-600" /> Private Local Extractor
            </h2>
            <p className="text-gray-500 dark:text-gray-400">Process documents entirely in your browser. No data is sent to any server.</p>
          </div>
        </div>

        <ExtractorTab 
          files={state.files}
          importCSV={(e: any) => importCSV(e, state.setFiles)}
          setFiles={state.setFiles}
          updateField={state.updateField}
          updateTableField={state.updateTableField}
          updateLineItem={state.updateLineItem}
          parseTable={state.parsePastedTable}
          addRow={state.addRow}
          deleteRow={state.deleteRow}
          addTable={state.addTable}
          deleteTable={state.deleteTable}
          deleteFile={state.deleteFile}
          viewFile={state.setViewingFile}
          downloadFile={() => {}}
          onDrop={state.onDrop}
          handleDownloadAll={() => handleDownloadAll(state.files)}
          setIsPreviewOpen={state.setIsPreviewOpen}
          onPasteData={state.onPasteData}
          handleSaveToGithub={handleSaveToGithub}
          reorderFiles={state.reorderFiles}
        />

        <UnifiedWorkflow files={state.files} />

        {state.viewingFile && <ViewDetailsModal file={state.viewingFile} onClose={() => state.setViewingFile(null)} />}
        {state.isPreviewOpen && <PreviewModal files={state.files} onClose={() => state.setIsPreviewOpen(false)} />}
      </div>
    </div>
  );
}
