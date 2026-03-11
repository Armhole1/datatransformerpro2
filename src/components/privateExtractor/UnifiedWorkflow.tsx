import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Eye, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ProcessedFile } from '../components/PrivateExtractor';
import { generateDynamicWordInvoice } from '../../services/WordExportService';
import { analyzeInvoiceTemplate, DynamicInvoice } from '../../services/GeminiService';
import InvoiceEditor from './InvoiceEditor';
import InvoicePreviewModal from './InvoicePreviewModal';

interface UnifiedWorkflowProps {
  files: ProcessedFile[];
}

export default function UnifiedWorkflow({ files }: UnifiedWorkflowProps) {
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [invoiceData, setInvoiceData] = useState<DynamicInvoice | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('vehicle');

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSampleFile(file);
      setIsExtracting(true);
      setInvoiceData(null);
      
      try {
        const data = await analyzeInvoiceTemplate(file);
        setInvoiceData(data);
      } catch (error) {
        console.error("Error extracting template:", error);
        alert("Failed to analyze template. Please ensure your Gemini API key is set.");
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  } as any);

  const handleGenerateInvoice = async () => {
    if (!invoiceData) return;
    try {
      await generateDynamicWordInvoice(invoiceData, sampleFile?.name || 'Invoice', selectedTemplate);
    } catch (error) {
      console.error("Error generating Word document:", error);
      alert("Failed to generate Word document.");
    }
  };

  const loadDataFromExtractor = (fileId: string) => {
    setSelectedFileId(fileId);
    if (!fileId || !invoiceData) return;
    
    const sourceFile = files.find(f => f.id === fileId);
    if (!sourceFile || !sourceFile.data) return;

    const newData = { ...invoiceData };
    
    // Map fields
    newData.fields = newData.fields.map(f => {
      const matchKey = Object.keys(sourceFile.data!.extractedFields).find(
        k => k.toLowerCase().includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(k.toLowerCase())
      );
      if (matchKey) {
        return { ...f, value: sourceFile.data!.extractedFields[matchKey] };
      }
      return f;
    });

    // Map tables
    if (newData.tables.length > 0 && sourceFile.data.tables && sourceFile.data.tables.length > 0) {
      const sourceTable = sourceFile.data.tables[0];
      const targetTable = newData.tables[0];
      
      const colMapping = targetTable.columns.map(col => {
        const lowerCol = col.toLowerCase();
        if (lowerCol.includes('desc')) return 'description';
        if (lowerCol.includes('qty') || lowerCol.includes('quant')) return 'quantity';
        if (lowerCol.includes('price') || lowerCol.includes('unit')) return 'unitPrice';
        if (lowerCol.includes('total') || lowerCol.includes('amount')) return 'total';
        return null;
      });

      targetTable.rows = sourceTable.lineItems.map(item => {
        const cells = colMapping.map(key => key ? (item as any)[key] || '' : '');
        return { cells };
      });
    }

    setInvoiceData(newData);
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 dark:text-white">
          <FileText className="w-6 h-6 text-emerald-600" /> Interactive Invoice Generator
        </h2>
        <p className="text-gray-500 dark:text-gray-400">Upload a sample invoice to copy its template. Edit the fields manually or pre-fill them using data from your extracted files.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">1. Upload Sample Invoice</h3>
            <div {...getRootProps()} className={`border-2 border-dashed p-6 rounded-xl text-center cursor-pointer transition-colors ${invoiceData ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'}`}>
              <input {...getInputProps()} />
              {isExtracting ? (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-emerald-600 dark:text-emerald-400">Analyzing template via AI...</p>
                </div>
              ) : invoiceData ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium">Template Copied!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 truncate w-full px-4">{sampleFile?.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Drag & drop a sample invoice</p>
                </div>
              )}
            </div>
          </div>

          {invoiceData && (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold dark:text-white">2. Pre-fill Data (Optional)</h3>
              <select 
                value={selectedFileId}
                onChange={(e) => loadDataFromExtractor(e.target.value)}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">-- Select extracted file --</option>
                {files.filter(f => f.status === 'success').map(f => (
                  <option key={f.id} value={f.id}>{f.file.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Selecting a file will auto-fill the template fields on the right.</p>
            </div>
          )}

          {invoiceData && (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold dark:text-white">3. Select Word Template</h3>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="vehicle">Vehicle Sales (Sample Style)</option>
                <option value="modern">Modern Professional</option>
                <option value="minimal">Minimalist</option>
                <option value="corporate">Bold Corporate</option>
                <option value="classic">Classic Traditional</option>
              </select>
            </div>
          )}

          {invoiceData && (
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setIsPreviewOpen(true)} className="w-full py-2.5 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={handleGenerateInvoice} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export to Word
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {invoiceData ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-xl font-bold mb-6 dark:text-white border-b pb-4 dark:border-gray-700">Edit Invoice Data</h3>
              <InvoiceEditor data={invoiceData} onChange={setInvoiceData} />
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Upload a sample invoice to generate an interactive, editable template here.
              </p>
            </div>
          )}
        </div>
      </div>

      {isPreviewOpen && invoiceData && (
        <InvoicePreviewModal data={invoiceData} onClose={() => setIsPreviewOpen(false)} />
      )}
    </div>
  );
}
