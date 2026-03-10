import React, { useState, useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Lock, UploadCloud, CheckCircle, AlertCircle, Loader2, X, Eye, FileText, Download, Settings, Plus, Trash2, Edit2 } from 'lucide-react';
import { extractTextLocally, parseTextWithTemplate, Template } from '../lib/localParser';

type FileStatus = 'pending' | 'processing' | 'success' | 'error';

interface ProcessedFile {
  id: string;
  file: File;
  status: FileStatus;
  templateId: string;
  data?: {
    rawText: string;
    extractedFields: Record<string, string>;
    lineItems?: Record<string, string>[];
  };
  error?: string;
}

export const DEFAULT_TEMPLATE: Template = {
  id: 'default',
  name: 'Standard Invoice',
  fields: [
    { name: 'Invoice Number', pattern: '(?:invoice number|invoice|inv)[:\\s]*([A-Za-z0-9-]+)' },
    { name: 'Date', pattern: '(?:date|invoice date|issued)[:\\s]*(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})' },
    { name: 'Vendor Name', pattern: '([A-Za-z\\s]+ LTD)' },
    { name: 'Total Amount', pattern: '(?:total due|total)[:\\s]*([\\d,]+)' },
    { name: 'Tax Amount', pattern: '(?:tax|vat)[:\\s]*([\\d,]+)' }
  ]
};

export default function PrivateExtractor({ templates, setTemplates }: { templates: Template[], setTemplates: React.Dispatch<React.SetStateAction<Template[]>> }) {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'default');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewingFile, setViewingFile] = useState<ProcessedFile | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending' as FileStatus,
      templateId: selectedTemplateId
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    
    newFiles.forEach((f) => processFile(f));
  }, [selectedTemplateId, templates]);

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
    const template = templates.find(t => t.id === fileObj.templateId) || DEFAULT_TEMPLATE;
    setFiles((prev) =>
      prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing' } : f))
    );

    try {
      const text = await extractTextLocally(fileObj.file);
      const data = parseTextWithTemplate(text, template);

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

  const updateField = (id: string, field: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id && f.data
          ? { ...f, data: { ...f.data, extractedFields: { ...f.data.extractedFields, [field]: value } } }
          : f
      )
    );
  };

  const updateLineItem = (id: string, rowIndex: number, field: string, value: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id && f.data?.lineItems
          ? {
              ...f,
              data: {
                ...f.data,
                lineItems: f.data.lineItems.map((row, idx) =>
                  idx === rowIndex ? { ...row, [field]: value } : row
                ),
              },
            }
          : f
      )
    );
  };

  const parsePastedTable = (id: string, pastedText: string) => {
    console.log("Parsing pasted text:", pastedText);
    // Split by newline and filter out empty lines
    const lines = pastedText.trim().split('\n').filter(line => line.trim() !== '');
    
    // Try splitting by tabs first (common for Excel/Word)
    let rows = lines.map(row => row.trim().split('\t'));
    
    // If tabs didn't create multiple columns, try splitting by one or more spaces
    if (rows.length > 0 && rows[0].length < 2) {
        rows = lines.map(row => row.trim().split(/\s+/));
    }
    
    console.log("Parsed rows:", rows);
    
    // Map all rows, letting the user delete the ones they don't want
    const lineItems = rows.map(row => {
        // If it has at least 3 columns, try to be smart
        if (row.length >= 3) {
            const quantity = row[0];
            const total = row[row.length - 1];
            const unitPrice = row[row.length - 2];
            const description = row.slice(1, row.length - 2).join(' ');
            return { quantity, description, unitPrice, total };
        }
        // Otherwise, just fill in what we have
        return {
            quantity: row[0] || '',
            description: row.slice(1).join(' ') || '',
            unitPrice: '',
            total: ''
        };
    });
    console.log("Final line items:", lineItems);

    setFiles((prev) =>
      prev.map((f) =>
        f.id === id && f.data
          ? { ...f, data: { ...f.data, lineItems } }
          : f
      )
    );
  };

  const downloadCSV = (file: ProcessedFile) => {
    if (!file.data) return;
    const { extractedFields, lineItems } = file.data;
    
    // Header row
    let csvContent = "fileName,date,invoiceNumber,taxAmount,totalAmount,vendorName,description,quantity,total,unitPrice\n";
    
    // Base data from invoice header
    const baseFields = [
      file.file.name,
      extractedFields['Date'] || '',
      extractedFields['Invoice Number'] || '',
      extractedFields['Tax Amount'] || '0',
      extractedFields['Total Amount'] || '',
      extractedFields['Vendor Name'] || ''
    ].map(v => `"${v}"`).join(',');

    // Flattened rows
    if (lineItems && lineItems.length > 0) {
      lineItems.forEach(item => {
        csvContent += `${baseFields},"${item.description}","${item.quantity}","${item.total}","${item.unitPrice}"\n`;
      });
    } else {
      // If no line items, just one row with header info
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

  const downloadAllCSV = () => {
    let csvContent = "fileName,date,invoiceNumber,taxAmount,totalAmount,vendorName,description,quantity,total,unitPrice\n";
    
    files.filter(f => f.status === 'success' && f.data).forEach(file => {
      const { extractedFields, lineItems } = file.data!;
      const baseFields = [
        file.file.name,
        extractedFields['Date'] || '',
        extractedFields['Invoice Number'] || '',
        extractedFields['Tax Amount'] || '0',
        extractedFields['Total Amount'] || '',
        extractedFields['Vendor Name'] || ''
      ].map(v => `"${v}"`).join(',');

      if (lineItems && lineItems.length > 0) {
        lineItems.forEach(item => {
          csvContent += `${baseFields},"${item.description}","${item.quantity}","${item.total}","${item.unitPrice}"\n`;
        });
      } else {
        csvContent += `${baseFields},,,,\n`;
      }
    });

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_invoices_flattened.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveTemplate = (template: Template) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    setEditingTemplate(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Lock className="w-6 h-6 text-emerald-600" />
          Private Local Extractor
        </h2>
        <p className="text-gray-600 mb-4">
          Process documents entirely in your browser. No data is sent to any server.
        </p>
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
          <label className="text-sm font-medium text-gray-700">Active Template:</label>
          <select 
            value={selectedTemplateId} 
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm"
          >
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={() => setEditingTemplate(templates.find(t => t.id === selectedTemplateId) || null)} className="p-2 text-gray-500 hover:text-emerald-600"><Edit2 className="w-5 h-5" /></button>
          <button onClick={() => {
            const newT: Template = { id: Math.random().toString(), name: 'New Template', fields: [] };
            setTemplates(prev => [...prev, newT]);
            setEditingTemplate(newT);
          }} className="p-2 text-gray-500 hover:text-emerald-600"><Plus className="w-5 h-5" /></button>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900">Click to upload or drag and drop</p>
        <p className="text-sm text-gray-500 mt-1">PDF or Images up to 10MB</p>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Processed Files ({files.length})</h3>
            {files.filter(f => f.status === 'success').length > 0 && (
              <button onClick={downloadAllCSV} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                <Download className="w-4 h-4" /> Download All Flattened CSV
              </button>
            )}
          </div>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-medium text-gray-900">{file.file.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'processing' && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
                    {file.status === 'success' && (
                      <>
                        <button onClick={() => setViewingFile(file)} className="p-1 text-gray-400 hover:text-emerald-600"><Eye className="w-5 h-5" /></button>
                        <button onClick={() => downloadCSV(file)} className="p-1 text-gray-400 hover:text-indigo-600"><Download className="w-5 h-5" /></button>
                      </>
                    )}
                    <button onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))} className="p-1 text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                  </div>
                </div>
                
                {file.status === 'success' && file.data && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(file.data.extractedFields).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-[10px] uppercase font-bold text-gray-500">{key}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateField(file.id, key, e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Paste Table Data (Copy rows from PDF/Excel and paste here):
                      </label>
                      <textarea
                        className="w-full text-sm border border-gray-300 rounded p-2 mb-2"
                        rows={4}
                        placeholder="Paste table rows here (e.g., 1  Item Name  100  100)..."
                        onChange={(e) => parsePastedTable(file.id, e.target.value)}
                      />
                      
                      <button 
                        onClick={() => {
                          setFiles(prev => prev.map(f => f.id === file.id && f.data ? {
                            ...f, data: { ...f.data, lineItems: [...(f.data.lineItems || []), { quantity: '', description: '', unitPrice: '', total: '' }] }
                          } : f));
                        }}
                        className="text-emerald-600 text-sm flex items-center gap-1 mb-2"
                      >
                        <Plus className="w-4 h-4" /> Add Row Manually
                      </button>
                      
                      {file.data.lineItems && file.data.lineItems.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr>
                                {Object.keys(file.data.lineItems[0]).map(h => <th key={h} className="border p-2 bg-gray-50 capitalize">{h}</th>)}
                                <th className="border p-2 bg-gray-50">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {file.data.lineItems.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {Object.entries(row).map(([field, value], colIndex) => (
                                    <td key={colIndex} className="border p-0">
                                      <input
                                        className="w-full p-2"
                                        value={value}
                                        onChange={(e) => updateLineItem(file.id, rowIndex, field, e.target.value)}
                                      />
                                    </td>
                                  ))}
                                  <td className="border p-2 text-center">
                                    <button onClick={() => {
                                      setFiles(prev => prev.map(f => f.id === file.id && f.data?.lineItems ? {
                                        ...f, data: { ...f.data, lineItems: f.data.lineItems.filter((_, idx) => idx !== rowIndex) }
                                      } : f));
                                    }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">File Details: {viewingFile.file.name}</h3>
            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {Object.entries(viewingFile.data?.extractedFields || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b py-2">
                  <span className="font-medium text-gray-700">{key}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
              {viewingFile.data?.lineItems && viewingFile.data.lineItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Line Items</h4>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {Object.keys(viewingFile.data.lineItems[0]).map(h => <th key={h} className="border p-1 bg-gray-50 capitalize">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {viewingFile.data.lineItems.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((val, colIndex) => <td key={colIndex} className="border p-1">{val}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewingFile(null)} className="px-4 py-2 bg-emerald-600 text-white rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Template: {editingTemplate.name}</h3>
            <input 
              value={editingTemplate.name} 
              onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
              className="w-full mb-4 p-2 border rounded"
              placeholder="Template Name"
            />
            <div className="space-y-2 mb-4">
              {editingTemplate.fields.map((field, i) => (
                <div key={i} className="flex gap-2">
                  <input value={field.name} onChange={e => {
                    const newFields = [...editingTemplate.fields];
                    newFields[i].name = e.target.value;
                    setEditingTemplate({...editingTemplate, fields: newFields});
                  }} className="flex-1 p-2 border rounded" placeholder="Field Name" />
                  <input value={field.pattern} onChange={e => {
                    const newFields = [...editingTemplate.fields];
                    newFields[i].pattern = e.target.value;
                    setEditingTemplate({...editingTemplate, fields: newFields});
                  }} className="flex-1 p-2 border rounded" placeholder="Regex Pattern" />
                  <button onClick={() => setEditingTemplate({...editingTemplate, fields: editingTemplate.fields.filter((_, idx) => idx !== i)})} className="text-red-500"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setEditingTemplate({...editingTemplate, fields: [...editingTemplate.fields, { name: '', pattern: '' }]})} className="text-emerald-600 flex items-center gap-1 mb-4"><Plus className="w-4 h-4" /> Add Field</button>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={() => saveTemplate(editingTemplate)} className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
