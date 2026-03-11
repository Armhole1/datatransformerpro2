import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, X } from 'lucide-react';
import { ProcessedFile } from '../PrivateExtractor';

interface PreviewModalProps {
  files: ProcessedFile[];
  onClose: () => void;
}

export default function PreviewModal({ files, onClose }: PreviewModalProps) {
  const [activeSheet, setActiveSheet] = useState<'summary' | 'details'>('summary');
  const [addSpacing, setAddSpacing] = useState(true);

  const successFiles = files.filter(f => f.status === 'success' && f.data);

  const summaryData = successFiles.map(f => {
    const containerNumbers = (f.data!.tables || [])
      .map(t => t.fields['Container Number'] || t.fields['container number'])
      .filter(Boolean)
      .join(' | ');
      
    const tableTotals = (f.data!.tables || [])
      .map(t => t.fields['Table Total'] || t.fields['table total'])
      .filter(Boolean)
      .join(' | ');

    return {
      fileName: f.file.name,
      ...f.data!.extractedFields,
      ...(containerNumbers ? { 'Container Number': containerNumbers } : {}),
      ...(tableTotals ? { 'Table Total': tableTotals } : {})
    };
  });

  const detailsData = successFiles.flatMap(f => 
    (f.data!.tables || []).flatMap((tbl, tIdx) => {
      const tableTotalStr = tbl.fields['Table Total'] || tbl.fields['table total'] || '0';
      const tableTotal = parseFloat(String(tableTotalStr).replace(/[^0-9.-]+/g,""));
      const itemsTotal = tbl.lineItems.reduce((acc, item) => acc + parseFloat(String(item.total || '0').replace(/[^0-9.-]+/g,"")), 0);
      
      const freightStr = tbl.fields['Freight'] || tbl.fields['freight'] || f.data!.extractedFields['Freight'] || f.data!.extractedFields['freight'] || '0';
      const freight = parseFloat(String(freightStr).replace(/[^0-9.-]+/g,""));
      
      const isMismatch = tableTotal !== 0 && 
                         Math.abs(tableTotal - itemsTotal) > 0.01 && 
                         Math.abs(tableTotal - (itemsTotal + freight)) > 0.01;
      
      return tbl.lineItems.map(item => ({
        fileName: f.file.name,
        tableIndex: tIdx + 1,
        ...tbl.fields,
        ...item,
        isMismatch
      }));
    })
  );

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Add empty row between files in summary
    const summaryWithSpacing: any[] = [];
    successFiles.forEach((f, idx) => {
      summaryWithSpacing.push(summaryData[idx]);
      if (idx < successFiles.length - 1) summaryWithSpacing.push({}); // Empty row
    });
    const wsSummary = XLSX.utils.json_to_sheet(summaryWithSpacing);
    
    // Add empty row between files in details
    const detailsWithSpacing: any[] = [];
    let lastFileName = '';
    detailsData.forEach((row, idx) => {
      if (idx > 0 && row.fileName !== lastFileName) {
        detailsWithSpacing.push({}); // Empty row
      }
      detailsWithSpacing.push(row);
      lastFileName = row.fileName;
    });
    const wsDetails = XLSX.utils.json_to_sheet(detailsWithSpacing.map(r => { const { isMismatch, ...rest } = r as any; return rest; }));
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Invoices_Summary");
    XLSX.utils.book_append_sheet(wb, wsDetails, "Line_Items_Detail");
    XLSX.writeFile(wb, "invoices_export.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Preview Output</h3>
          <div className="flex gap-2">
            <button onClick={downloadExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
              <Download className="w-4 h-4" /> Download Excel
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
          <div className="flex gap-4">
            <button onClick={() => setActiveSheet('summary')} className={`px-4 py-2 ${activeSheet === 'summary' ? 'border-b-2 border-emerald-600 font-semibold text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>Summary Sheet</button>
            <button onClick={() => setActiveSheet('details')} className={`px-4 py-2 ${activeSheet === 'details' ? 'border-b-2 border-emerald-600 font-semibold text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>Details Sheet</button>
          </div>
          {activeSheet === 'details' && (
            <button onClick={() => setAddSpacing(!addSpacing)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-md">
              {addSpacing ? 'Remove Spacing' : 'Add Spacing'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                {Object.keys(activeSheet === 'summary' ? (summaryData[0] || {}) : (detailsData[0] || {})).filter(k => k !== 'isMismatch').map(h => <th key={h} className="border border-gray-200 dark:border-gray-600 p-2 capitalize font-medium text-gray-700 dark:text-gray-300">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(activeSheet === 'summary' ? summaryData : detailsData).map((row: any, i, arr) => {
                const isNewInvoice = activeSheet === 'details' && addSpacing && i > 0 && row.fileName !== arr[i-1].fileName;
                return (
                  <React.Fragment key={i}>
                    {isNewInvoice && (
                      <tr>
                        <td colSpan={100} className="h-6 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-300 dark:border-gray-600"></td>
                      </tr>
                    )}
                    <tr className={row.isMismatch ? 'bg-red-100 dark:bg-red-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}>
                      {Object.entries(row).filter(([k]) => k !== 'isMismatch').map(([k, val], j) => <td key={j} className="border border-gray-200 dark:border-gray-700 p-2 text-gray-800 dark:text-gray-200">{val as string}</td>)}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
