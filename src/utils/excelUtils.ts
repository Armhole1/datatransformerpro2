import * as XLSX from 'xlsx';
import { ProcessedFile } from '../components/PrivateExtractor';

export const importCSV = (e: React.ChangeEvent<HTMLInputElement>, setFiles: React.Dispatch<React.SetStateAction<ProcessedFile[]>>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const bstr = evt.target?.result;
    const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    // Use raw: false to preserve formatting (commas, dates)
    const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" }) as any[];
    
    const groupedFiles: Record<string, ProcessedFile> = {};

    data.forEach(row => {
      const rowKeys = Object.keys(row);
      const fileNameKey = rowKeys.find(k => k.toLowerCase() === 'filename');
      const fileName = fileNameKey && row[fileNameKey] ? String(row[fileNameKey]) : `Imported-${Math.random().toString(36).substring(7)}`;
      
      if (!groupedFiles[fileName]) {
        groupedFiles[fileName] = {
          id: Math.random().toString(36).substring(7),
          file: new File([], fileName),
          status: 'success',
          templateId: 'default',
          data: { rawText: '', extractedFields: {}, tables: [] }
        };
      }

      const f = groupedFiles[fileName];
      
      const tableIndexKey = rowKeys.find(k => k.toLowerCase() === 'tableindex');
      const tableIndexStr = tableIndexKey ? row[tableIndexKey] : '1';
      const tableIndex = Math.max(0, parseInt(tableIndexStr) - 1 || 0);
      
      if (!f.data!.tables![tableIndex]) {
        f.data!.tables![tableIndex] = { id: Math.random().toString(), fields: {}, lineItems: [] };
      }

      const currentTable = f.data!.tables![tableIndex];

      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'filename' || lowerKey === 'tableindex') return;
        
        const normalizedKey = lowerKey.replace(/\s/g, '');
        if (['description', 'quantity', 'total', 'unitprice'].includes(normalizedKey)) {
          // handled below
        } else if (['containernumber', 'tabletotal'].includes(normalizedKey)) {
          currentTable.fields[key] = row[key] != null ? String(row[key]) : '';
        } else {
          f.data!.extractedFields[key] = row[key] != null ? String(row[key]) : '';
        }
      });

      const descKey = rowKeys.find(k => k.toLowerCase().replace(/\s/g, '') === 'description');
      const qtyKey = rowKeys.find(k => k.toLowerCase().replace(/\s/g, '') === 'quantity');
      const totalKey = rowKeys.find(k => k.toLowerCase().replace(/\s/g, '') === 'total');
      const unitPriceKey = rowKeys.find(k => k.toLowerCase().replace(/\s/g, '') === 'unitprice');

      if ((descKey && row[descKey] != null) || (qtyKey && row[qtyKey] != null) || (totalKey && row[totalKey] != null) || (unitPriceKey && row[unitPriceKey] != null)) {
        currentTable.lineItems.push({
          description: descKey && row[descKey] != null ? String(row[descKey]) : '',
          quantity: qtyKey && row[qtyKey] != null ? String(row[qtyKey]) : '',
          total: totalKey && row[totalKey] != null ? String(row[totalKey]) : '',
          unitPrice: unitPriceKey && row[unitPriceKey] != null ? String(row[unitPriceKey]) : ''
        });
      }
    });

    setFiles(prev => [...prev, ...Object.values(groupedFiles)]);
  };
  reader.readAsBinaryString(file);
  e.target.value = '';
};

export const handleDownloadAll = (files: ProcessedFile[]) => {
  const successFiles = files.filter(f => f.status === 'success' && f.data);
  if (successFiles.length === 0) return;

  const summaryData = successFiles.map(f => {
    const containerNumbers = (f.data!.tables || []).map(t => t.fields['Container Number'] || t.fields['container number']).filter(Boolean).join(' | ');
    const tableTotals = (f.data!.tables || []).map(t => t.fields['Table Total'] || t.fields['table total']).filter(Boolean).join(' | ');
    return {
      fileName: f.file.name,
      ...f.data!.extractedFields,
      ...(containerNumbers ? { 'Container Number': containerNumbers } : {}),
      ...(tableTotals ? { 'Table Total': tableTotals } : {})
    };
  });

  const detailsData = successFiles.flatMap(f => 
    (f.data!.tables || []).flatMap((tbl, tIdx) => {
      return tbl.lineItems.map(item => ({
        fileName: f.file.name,
        tableIndex: tIdx + 1,
        ...tbl.fields,
        ...item
      }));
    })
  );

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsDetails = XLSX.utils.json_to_sheet(detailsData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Invoices_Summary");
  XLSX.utils.book_append_sheet(wb, wsDetails, "Line_Items_Detail");
  XLSX.writeFile(wb, "invoices_export.xlsx");
};
