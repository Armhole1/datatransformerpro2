import React, { useState } from 'react';
import { ProcessedFile } from '../components/PrivateExtractor';
import FileItem from './FileItem';

interface FileListProps {
  files: ProcessedFile[];
  updateField: any;
  updateTableField: any;
  updateLineItem: any;
  parseTable: any;
  addRow: any;
  deleteRow: any;
  addTable: any;
  deleteTable: any;
  deleteFile: any;
  viewFile: any;
  downloadFile: any;
  reorderFiles: (startIndex: number, endIndex: number) => void;
}

export default function FileList({
  files, updateField, updateTableField, updateLineItem, parseTable,
  addRow, deleteRow, addTable, deleteTable, deleteFile, viewFile, downloadFile, reorderFiles
}: FileListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.parentNode as any);
    e.dataTransfer.setDragImage(e.currentTarget as Element, 20, 20);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    reorderFiles(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {files.map((f, index) => (
        <div 
          key={f.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`transition-all duration-200 ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}`}
        >
          <div className="cursor-grab active:cursor-grabbing p-2 bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <span className="text-xs font-medium uppercase tracking-wider">Drag to reorder</span>
          </div>
          <FileItem 
            file={f} 
            onUpdateField={updateField} 
            onUpdateTableField={updateTableField} 
            onUpdateLineItem={updateLineItem} 
            onParseTable={parseTable} 
            onAddRow={addRow} 
            onDeleteRow={deleteRow} 
            onAddTable={addTable} 
            onDeleteTable={deleteTable} 
            onDeleteFile={deleteFile} 
            onView={viewFile} 
            onDownload={downloadFile} 
          />
        </div>
      ))}
    </div>
  );
}
