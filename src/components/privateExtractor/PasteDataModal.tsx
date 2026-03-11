import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function PasteDataModal({ isOpen, onClose, onPaste }: { isOpen: boolean, onClose: () => void, onPaste: (data: string) => void }) {
  const [data, setData] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paste Data</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 dark:text-white mb-4"
          placeholder="Paste CSV or raw text here..."
        />
        <button
          onClick={() => { onPaste(data); onClose(); }}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
        >
          Import Data
        </button>
      </div>
    </div>
  );
}
