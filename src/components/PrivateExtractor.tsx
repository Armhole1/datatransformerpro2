import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Lock, UploadCloud, Download, Plus, Edit2 } from 'lucide-react';
import { extractTextLocally, parseTextWithTemplate, Template } from '../lib/localParser';
import TemplateEditor from './privateExtractor/TemplateEditor';
import FileItem from './privateExtractor/FileItem';
import ViewDetailsModal from './privateExtractor/ViewDetailsModal';

type FileStatus = 'pending' | 'processing' | 'success' | 'error';

export interface TableData {
  id: string;
  fields: Record<string, string>;
  lineItems: Record<string, string>[];
}

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
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
  } as any);

  const processFile = async (fileObj: ProcessedFile) => {
    const template = templates.find(t => t.id === fileObj.templateId) || DEFAULT_TEMPLATE;
    setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'processing' } : f)));
    try {
      const text = await extractTextLocally(fileObj.file);
      const data = parseTextWithTemplate(text, template);
      const tables: TableData[] = data.lineItems && data.lineItems.length > 0 
        ? [{ id: Math.random().toString(), fields: { 'Container Number': '', 'Table Total': '' }, lineItems: data.lineItems }] 
        : [{ id: Math.random().toString(), fields: { 'Container Number': '', 'Table Total': '' }, lineItems: [] }];
      setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'success', data: { ...data, tables } } : f)));
    } catch (error: any) {
      setFiles((prev) => prev.map((f) => (f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f)));
    }
  };

  const updateField = (id: string, field: string, value: string) => {
    setFiles((prev) => prev.map((f) => f.id === id && f.data ? { ...f, data: { ...f.data, extractedFields: { ...f.data.extractedFields, [field]: value } } } : f));
  };

  const updateTableField = (id: string, tableId: string, field: string, value: string) => {
    setFiles((prev) => prev.map((f) => {
      if (f.id !== id || !f.data?.tables) return f;
      
      const updatedTables = f.data.tables.map(tbl => {
        if (tbl.id === tableId) {
          return { ...tbl, fields: { ...tbl.fields, [field]: value } };
        }
        return tbl;
      });

      let newGlobalTotal = f.data.extractedFields['Total Amount'];
      if (field === 'Table Total') {
        const sum = updatedTables.reduce((acc, tbl) => {
          const val = parseFloat((tbl.fields['Table Total'] || '0').replace(/[^0-9.-]+/g,""));
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        newGlobalTotal = sum.toString();
      }

      return {
        ...f,
        data: {
          ...f.data,
          extractedFields: {
            ...f.data.extractedFields,
            ...(field === 'Table Total' ? { 'Total Amount': newGlobalTotal } : {})
          },
          tables: updatedTables
        }
      };
    }));
  };

  const updateLineItem = (id: string, tableId: string, rowIndex: number, field: string, value: string) => {
    setFiles((prev) => prev.map((f) => f.id === id && f.data?.tables ? {
      ...f, data: { ...f.data, tables: f.data.tables.map(tbl => tbl.id === tableId ? { ...tbl, lineItems: tbl.lineItems.map((row, rIdx) => rIdx === rowIndex ? { ...row, [field]: value } : row) } : tbl) }
    } : f));
  };

  const parsePastedTable = (id: string, tableId: string, pastedText: string) => {
    const lines = pastedText.trim().split('\n').filter(line => line.trim() !== '');
    let rows = lines.map(row => row.trim().split('\t'));
    if (rows.length > 0 && rows[0].length < 2) rows = lines.map(row => row.trim().split(/\s+/));
    const lineItems = rows.map(row => ({
      quantity: row[0] || '',
      description: row.slice(1, row.length - 2).join(' ') || '',
      unitPrice: row[row.length - 2] || '',
      total: row[row.length - 1] || ''
    }));
    setFiles((prev) => prev.map((f) => f.id === id && f.data?.tables ? { ...f, data: { ...f.data, tables: f.data.tables.map(tbl => tbl.id === tableId ? { ...tbl, lineItems } : tbl) } } : f));
  };

  const addRow = (id: string, tableId: string) => {
    setFiles((prev) => prev.map((f) => f.id === id && f.data?.tables ? {
      ...f, data: { ...f.data, tables: f.data.tables.map(tbl => tbl.id === tableId ? { ...tbl, lineItems: [...tbl.lineItems, { quantity: '', description: '', unitPrice: '', total: '' }] } : tbl) }
    } : f));
  };

  const deleteRow = (id: string, tableId: string, rowIndex: number) => {
    setFiles((prev) => prev.map((f) => f.id === id && f.data?.tables ? {
      ...f, data: { ...f.data, tables: f.data.tables.map(tbl => tbl.id === tableId ? { ...tbl, lineItems: tbl.lineItems.filter((_, rIdx) => rIdx !== rowIndex) } : tbl) }
    } : f));
  };

  const addTable = (id: string) => {
    setFiles((prev) => prev.map((f) => f.id === id && f.data ? {
      ...f, data: { ...f.data, tables: [...(f.data.tables || []), { id: Math.random().toString(), fields: { 'Container Number': '', 'Table Total': '' }, lineItems: [] }] }
    } : f));
  };

  const deleteTable = (id: string, tableId: string) => {
    setFiles((prev) => prev.map((f) => f.id === id && f.data?.tables ? {
      ...f, data: { ...f.data, tables: f.data.tables.filter(tbl => tbl.id !== tableId) }
    } : f));
  };

  const downloadCSV = (file: ProcessedFile) => {
    if (!file.data) return;
    const { extractedFields, tables } = file.data;
    const globalFieldKeys = Object.keys(extractedFields);
    
    const tableFieldKeys = new Set<string>();
    if (tables) {
      tables.forEach(tbl => Object.keys(tbl.fields).forEach(k => tableFieldKeys.add(k)));
    }
    const tableFieldsArray = Array.from(tableFieldKeys);

    const headerRow = [
      "fileName", 
      ...globalFieldKeys.map(k => `"${k.replace(/"/g, '""')}"`), 
      "tableIndex", 
      ...tableFieldsArray.map(k => `"${k.replace(/"/g, '""')}"`),
      "description", "quantity", "total", "unitPrice"
    ].join(',');
    
    let csvContent = headerRow + "\n";
    const baseFields = [
      file.file.name, 
      ...globalFieldKeys.map(k => `"${(extractedFields[k] || '').replace(/"/g, '""')}"`)
    ].join(',');
    
    let hasRows = false;
    if (tables && tables.length > 0) {
      tables.forEach((table, tIdx) => {
        const tblFields = tableFieldsArray.map(k => `"${(table.fields[k] || '').replace(/"/g, '""')}"`).join(',');
        
        if (table.lineItems.length > 0) {
          hasRows = true;
          table.lineItems.forEach(item => { 
            csvContent += `${baseFields},"${tIdx + 1}",${tblFields},"${(item.description || '').replace(/"/g, '""')}","${(item.quantity || '').replace(/"/g, '""')}","${(item.total || '').replace(/"/g, '""')}","${(item.unitPrice || '').replace(/"/g, '""')}"\n`; 
          });
        } else {
          hasRows = true;
          csvContent += `${baseFields},"${tIdx + 1}",${tblFields},,,,\n`;
        }
      });
    }
    if (!hasRows) { 
      const emptyTblFields = tableFieldsArray.map(() => "").join(',');
      csvContent += `${baseFields},,${emptyTblFields},,,,\n`; 
    }
    
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${file.file.name.split('.')[0]}_flattened.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadAllCSV = () => {
    const allGlobalFieldKeys = new Set<string>();
    const allTableFieldKeys = new Set<string>();
    
    files.filter(f => f.status === 'success' && f.data).forEach(file => {
      Object.keys(file.data!.extractedFields).forEach(k => allGlobalFieldKeys.add(k));
      if (file.data!.tables) {
        file.data!.tables.forEach(tbl => Object.keys(tbl.fields).forEach(k => allTableFieldKeys.add(k)));
      }
    });
    
    const globalFieldKeysArray = Array.from(allGlobalFieldKeys);
    const tableFieldsArray = Array.from(allTableFieldKeys);
    
    const headerRow = [
      "fileName", 
      ...globalFieldKeysArray.map(k => `"${k.replace(/"/g, '""')}"`), 
      "tableIndex", 
      ...tableFieldsArray.map(k => `"${k.replace(/"/g, '""')}"`),
      "description", "quantity", "total", "unitPrice"
    ].join(',');
    
    let csvContent = headerRow + "\n";

    files.filter(f => f.status === 'success' && f.data).forEach(file => {
      const { extractedFields, tables } = file.data!;
      const baseFields = [
        file.file.name, 
        ...globalFieldKeysArray.map(k => `"${(extractedFields[k] || '').replace(/"/g, '""')}"`)
      ].join(',');
      
      let hasRows = false;
      if (tables && tables.length > 0) {
        tables.forEach((table, tIdx) => {
          const tblFields = tableFieldsArray.map(k => `"${(table.fields[k] || '').replace(/"/g, '""')}"`).join(',');
          if (table.lineItems.length > 0) {
            hasRows = true;
            table.lineItems.forEach(item => { 
              csvContent += `${baseFields},"${tIdx + 1}",${tblFields},"${(item.description || '').replace(/"/g, '""')}","${(item.quantity || '').replace(/"/g, '""')}","${(item.total || '').replace(/"/g, '""')}","${(item.unitPrice || '').replace(/"/g, '""')}"\n`; 
            });
          } else {
            hasRows = true;
            csvContent += `${baseFields},"${tIdx + 1}",${tblFields},,,,\n`;
          }
        });
      }
      if (!hasRows) { 
        const emptyTblFields = tableFieldsArray.map(() => "").join(',');
        csvContent += `${baseFields},,${emptyTblFields},,,,\n`; 
      }
    });
    
    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_invoices_flattened.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const saveTemplate = (template: Template) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    setEditingTemplate(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Lock className="w-6 h-6 text-emerald-600" /> Private Local Extractor</h2>
        <p className="text-gray-600 mb-4">Process documents entirely in your browser. No data is sent to any server.</p>
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
          <label className="text-sm font-medium text-gray-700">Active Template:</label>
          <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm">
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={() => setEditingTemplate(templates.find(t => t.id === selectedTemplateId) || null)} className="p-2 text-gray-500 hover:text-emerald-600"><Edit2 className="w-5 h-5" /></button>
          <button onClick={() => { const newT: Template = { id: Math.random().toString(), name: 'New Template', fields: [] }; setTemplates(prev => [...prev, newT]); setEditingTemplate(newT); }} className="p-2 text-gray-500 hover:text-emerald-600"><Plus className="w-5 h-5" /></button>
        </div>
      </div>
      <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors border-gray-300 hover:border-emerald-400 hover:bg-gray-50">
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900">Click to upload or drag and drop</p>
      </div>
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Processed Files ({files.length})</h3>
            {files.filter(f => f.status === 'success').length > 0 && (
              <button onClick={downloadAllCSV} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"><Download className="w-4 h-4" /> Download All Flattened CSV</button>
            )}
          </div>
          <div className="space-y-3">
            {files.map((file) => (
              <FileItem 
                key={file.id} 
                file={file} 
                onUpdateField={updateField} 
                onUpdateTableField={updateTableField}
                onUpdateLineItem={updateLineItem} 
                onParseTable={parsePastedTable} 
                onAddRow={addRow} 
                onDeleteRow={deleteRow} 
                onAddTable={addTable}
                onDeleteTable={deleteTable}
                onDeleteFile={(id) => setFiles(prev => prev.filter(f => f.id !== id))} 
                onView={setViewingFile} 
                onDownload={downloadCSV} 
              />
            ))}
          </div>
        </div>
      )}
      {viewingFile && <ViewDetailsModal file={viewingFile} onClose={() => setViewingFile(null)} />}
      {editingTemplate && <TemplateEditor template={editingTemplate} onSave={saveTemplate} onCancel={() => setEditingTemplate(null)} setTemplate={setEditingTemplate} />}
    </div>
  );
}
