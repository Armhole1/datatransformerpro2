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
          <input placeholder="Field Name" value={key} onChange={e => setKey(e.target.value)} className="w-full text-sm border border-gray-300 rounded px-2 py-1" />
          <input placeholder="Value" value={val} onChange={e => setVal(e.target.value)} className="w-full text-sm border border-gray-300 rounded px-2 py-1" />
        </div>
        <button onClick={() => { if(key.trim()) { onAdd(key.trim(), val); setKey(''); setVal(''); setIsAdding(false); } }} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"><Check className="w-4 h-4" /></button>
        <button onClick={() => setIsAdding(false)} className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"><X className="w-4 h-4" /></button>
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
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-gray-900">{file.file.name}</p>
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
              <div key={key}>
                <label className="text-[10px] uppercase font-bold text-gray-500">{key}</label>
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => onUpdateField(file.id, key, e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
            ))}
            <AddFieldInline onAdd={(k, v) => onUpdateField(file.id, k, v)} />
          </div>

          <div className="border-t pt-4 space-y-6">
            {file.data.tables?.map((table: any, tableIndex: number) => (
              <div key={table.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-gray-700">
                    Table {tableIndex + 1} (Container)
                  </label>
                  <button onClick={() => onDeleteTable(file.id, table.id)} className="text-red-500 text-sm flex items-center gap-1 hover:underline">
                    <Trash2 className="w-4 h-4" /> Delete Table
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end mb-4">
                  {Object.entries(table.fields).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-[10px] uppercase font-bold text-gray-500">{key}</label>
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => onUpdateTableField(file.id, table.id, key, e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </div>
                  ))}
                  <AddFieldInline onAdd={(k, v) => onUpdateTableField(file.id, table.id, k, v)} />
                </div>

                <textarea
                  className="w-full text-sm border border-gray-300 rounded p-2 mb-2 bg-white"
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
                    <table className="w-full text-sm border-collapse bg-white">
                      <thead>
                        <tr>
                          {Object.keys(table.lineItems[0]).map(h => <th key={h} className="border p-2 bg-gray-100 capitalize">{h}</th>)}
                          <th className="border p-2 bg-gray-100">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.lineItems.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex}>
                            {Object.entries(row).map(([field, value], colIndex) => (
                              <td key={colIndex} className="border p-0">
                                <input
                                  className="w-full p-2 outline-none focus:bg-emerald-50"
                                  value={value as string}
                                  onChange={(e) => onUpdateLineItem(file.id, table.id, rowIndex, field, e.target.value)}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-center">
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

            <button onClick={() => onAddTable(file.id)} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-600 transition-colors bg-white">
              <Plus className="w-5 h-5" /> Add Another Table (e.g., for a new Container)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
