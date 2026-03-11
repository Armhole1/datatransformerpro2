import { useState, useCallback, useEffect } from 'react';
import { ProcessedFile, TableData } from '../components/PrivateExtractor';
import { extractTextLocally, parseTextWithTemplate, Template } from '../lib/localParser';

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

export function useExtractorState(templates: Template[]) {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'default');
  const [viewingFile, setViewingFile] = useState<ProcessedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Auto-save drafts
  useEffect(() => {
    const saved = localStorage.getItem('invoice_drafts');
    if (saved) setFiles(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('invoice_drafts', JSON.stringify(files));
  }, [files]);

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending' as ProcessedFile['status'],
      templateId: selectedTemplateId
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => processFile(f));
  }, [selectedTemplateId, templates]);

  const updateField = (id: string, field: string, value: string) => {
    setFiles((prev) => prev.map((f) => {
      if (f.id !== id || !f.data) return f;
      const newFields = { ...f.data.extractedFields };
      if (value === '__DELETE__') {
        delete newFields[field];
      } else {
        newFields[field] = value;
      }
      return { ...f, data: { ...f.data, extractedFields: newFields } };
    }));
  };

  const updateTableField = (id: string, tableId: string, field: string, value: string) => {
    setFiles((prev) => prev.map((f) => {
      if (f.id !== id || !f.data?.tables) return f;
      const updatedTables = f.data.tables.map(tbl => {
        if (tbl.id === tableId) return { ...tbl, fields: { ...tbl.fields, [field]: value } };
        return tbl;
      });
      let newGlobalTotal = f.data.extractedFields['Total Amount'];
      if (field === 'Table Total') {
        const sum = updatedTables.reduce((acc, tbl) => {
          const val = parseFloat(String(tbl.fields['Table Total'] || '0').replace(/[^0-9.-]+/g,""));
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        newGlobalTotal = sum.toString();
      }
      return {
        ...f,
        data: {
          ...f.data,
          extractedFields: { ...f.data.extractedFields, ...(field === 'Table Total' ? { 'Total Amount': newGlobalTotal } : {}) },
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

  const deleteFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const onPasteData = (pastedText: string) => {
    const rows = pastedText.trim().split('\n').map(row => row.split('\t'));
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    const newFile: ProcessedFile = {
      id: Math.random().toString(36).substring(7),
      file: new File([], `Pasted-${Math.random().toString(36).substring(7)}`),
      status: 'success',
      templateId: 'default',
      data: { rawText: '', extractedFields: {}, tables: [{ id: Math.random().toString(), fields: { 'Container Number': '', 'Table Total': '' }, lineItems: data }] }
    };
    setFiles(prev => [...prev, newFile]);
  };

  const reorderFiles = (startIndex: number, endIndex: number) => {
    setFiles(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  return {
    files, setFiles, selectedTemplateId, setSelectedTemplateId,
    viewingFile, setViewingFile, isPreviewOpen, setIsPreviewOpen,
    onDrop, updateField, updateTableField, updateLineItem, parsePastedTable,
    addRow, deleteRow, addTable, deleteTable, deleteFile, onPasteData, reorderFiles
  };
}
