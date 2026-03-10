import React from 'react';

interface ViewDetailsModalProps {
  file: {
    file: File;
    data?: {
      extractedFields: Record<string, string>;
      tables?: { id: string; fields: Record<string, string>; lineItems: Record<string, string>[] }[];
    };
  };
  onClose: () => void;
}

export default function ViewDetailsModal({ file, onClose }: ViewDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">File Details: {file.file.name}</h3>
        <div className="space-y-4 mb-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(file.data?.extractedFields || {}).map(([key, value]) => (
              <div key={key} className="border-b pb-1">
                <span className="block text-xs font-bold text-gray-500 uppercase">{key}</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          
          {file.data?.tables && file.data.tables.length > 0 && (
            <div className="mt-6 space-y-6">
              {file.data.tables.map((table, tIdx) => (
                <div key={table.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Table {tIdx + 1}</h4>
                  
                  {Object.keys(table.fields).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Object.entries(table.fields).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-semibold text-gray-600">{key}: </span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {table.lineItems.length > 0 ? (
                    <table className="w-full text-sm border-collapse bg-white">
                      <thead>
                        <tr>
                          {Object.keys(table.lineItems[0]).map(h => <th key={h} className="border p-1 bg-gray-100 capitalize">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {table.lineItems.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.values(row).map((val, colIndex) => <td key={colIndex} className="border p-1">{val as string}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Empty table</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-emerald-600 text-white rounded">Close</button>
        </div>
      </div>
    </div>
  );
}
