import React, { useState } from 'react';
import { Lock, Loader2, Eye, Download, X, Plus, Trash2, Check } from 'lucide-react';

function AddFieldInline({ onAdd }: { onAdd: (key: string, value: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [key, setKey] = useState('');
  const [val, setVal] = useState('');

  if (isAdding) {
    return (
      <div className="col-span-2 flex gap-2 items-end">
        <div className="flex-1 flex gap-2">
          <input placeholder="Field Name" value={key} onChange={e => setKey(e.target.value)} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-white" />
          <input placeholder="Value" value={val} onChange={e => setVal(e.target.value)} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-white" />
        </div>
        <button onClick={() => { if(key.trim()) { onAdd(key.trim(), val); setKey(''); setVal(''); setIsAdding(false); } }} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"><Check className="w-4 h-4" /></button>
        <button onClick={() => setIsAdding(false)} className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center h-[30px]">
      <button onClick={() => setIsAdding(true)} className="text-emerald-600 text-sm flex items-center gap-1 hover:underline">
        <Plus className="w-4 h-4" /> Add Custom Field
      </button>
    </div>
  );
}

interface FileItemProps {
  key?: string | number;
  file: any;
  onUpdateField: (id: string, field: string, value: string) => void;
  onUpdateTableField: (id: string, tableId: string, field: string, value: string) => void;
  onUpdateLineItem: (id: string, tableId: string, rowIndex: number, field: string, value: string) => void;
  onParseTable: (id: string, tableId: string, text: string) => void;
  onAddRow: (id: string, tableId: string) => void;
  onDeleteRow: (id: string, tableId: string, rowIndex: number) => void;
  onAddTable: (id: string) => void;
  onDeleteTable: (id: string, tableId: string) => void;
  onDeleteFile: (id: string) => void;
  onView: (file: any) => void;
  onDownload: (file: any) => void;
}

export default function FileItem(props: FileItemProps) {
  const { file, onUpdateField, onUpdateTableField, onUpdateLineItem, onParseTable, onAddRow, onDeleteRow, onAddTable, onDeleteTable, onDeleteFile, onView, onDownload } = props;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">{file.file.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {file.status === 'processing' && <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />}
          {file.status === 'success' && (
            <>
              <button onClick={() => onView(file)} className="p-1 text-gray-400 hover:text-emerald-600"><Eye className="w-5 h-5" /></button>
              <button onClick={() => onDownload(file)} className="p-1 text-gray-400 hover:text-indigo-600"><Download className="w-5 h-5" /></button>
            </>
          )}
          <button onClick={() => onDeleteFile(file.id)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
        </div>
      </div>
      
      {file.status === 'success' && file.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            {Object.entries(file.data.extractedFields).map(([key, value]) => (
              <div key={key} className="relative group">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 flex justify-between items-center">
                  {key}
                  <button onClick={() => {
                    const newData = { ...file.data.extractedFields };
                    delete newData[key];
                    onUpdateField(file.id, key, '__DELETE__'); // I'll need to handle this in PrivateExtractor
                  }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </label>
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => onUpdateField(file.id, key, e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-white"
                />
              </div>
            ))}
            <AddFieldInline onAdd={(k, v) => onUpdateField(file.id, k, v)} />
          </div>

          <div className="border-t dark:border-gray-700 pt-4 space-y-6">
            {file.data.tables?.map((table: any, tableIndex: number) => (
              <div key={table.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Table {tableIndex + 1} (Container)
                  </label>
                  <button onClick={() => onDeleteTable(file.id, table.id)} className="text-red-500 text-sm flex items-center gap-1 hover:underline">
                    <Trash2 className="w-4 h-4" /> Delete Table
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end mb-4">
                  {Object.entries(table.fields).map(([key, value]) => (
                    <div key={key} className="relative group">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 flex justify-between items-center">
                        {key}
                        <button onClick={() => {
                          onUpdateTableField(file.id, table.id, key, '__DELETE__');
                        }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </label>
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => onUpdateTableField(file.id, table.id, key, e.target.value)}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                  <AddFieldInline onAdd={(k, v) => onUpdateTableField(file.id, table.id, k, v)} />
                </div>

                <textarea
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded p-2 mb-2 bg-white dark:bg-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Paste table rows here (e.g., 1  Item Name  100  100)..."
                  onChange={(e) => onParseTable(file.id, table.id, e.target.value)}
                />
                
                <button 
                  onClick={() => onAddRow(file.id, table.id)}
                  className="text-emerald-600 text-sm flex items-center gap-1 mb-2 hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add Row Manually
                </button>
                
                {table.lineItems && table.lineItems.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse bg-white dark:bg-gray-800">
                      <thead>
                        <tr>
                          {Object.keys(table.lineItems[0]).map(h => <th key={h} className="border dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-900 capitalize">{h}</th>)}
                          <th className="border dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-900">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.lineItems.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex}>
                            {Object.entries(row).map(([field, value], colIndex) => (
                              <td key={colIndex} className="border dark:border-gray-600 p-0">
                                <input
                                  className="w-full p-2 outline-none focus:bg-emerald-50 dark:focus:bg-emerald-900/30 bg-transparent"
                                  value={value as string}
                                  onChange={(e) => onUpdateLineItem(file.id, table.id, rowIndex, field, e.target.value)}
                                />
                              </td>
                            ))}
                            <td className="border dark:border-gray-600 p-2 text-center">
                              <button onClick={() => onDeleteRow(file.id, table.id, rowIndex)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            <button onClick={() => onAddTable(file.id)} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg flex items-center justify-center gap-2 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 transition-colors bg-white dark:bg-gray-800">
              <Plus className="w-5 h-5" /> Add Another Table (e.g., for a new Container)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
