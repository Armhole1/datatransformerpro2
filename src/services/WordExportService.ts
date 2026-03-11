import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ProcessedFile } from '../components/PrivateExtractor';
import { DynamicInvoice } from './GeminiService';
import { buildVehicleTemplate } from './wordTemplates/VehicleTemplate';
import { buildModernTemplate } from './wordTemplates/ModernTemplate';
import { buildMinimalTemplate } from './wordTemplates/MinimalTemplate';
import { buildCorporateTemplate } from './wordTemplates/CorporateTemplate';
import { buildClassicTemplate } from './wordTemplates/ClassicTemplate';

export const generateWordInvoice = async (file: ProcessedFile) => {
  if (!file.data) return;

  const { extractedFields, tables } = file.data;

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: "INVOICE", bold: true, size: 48 }),
          ],
          spacing: { after: 400 }
        }),
        ...Object.entries(extractedFields).map(([key, value]) => 
          new Paragraph({
            children: [
              new TextRun({ text: `${key}: `, bold: true }),
              new TextRun({ text: value as string })
            ],
            spacing: { after: 200 }
          })
        ),
        new Paragraph({ spacing: { before: 400, after: 200 } }),
        ...(tables || []).flatMap(table => [
          new Paragraph({
            children: [new TextRun({ text: `Container: ${table.fields['Container Number'] || ''}`, bold: true })],
            spacing: { after: 200 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Unit Price", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] })
                ]
              }),
              ...table.lineItems.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(item.description || '')] }),
                  new TableCell({ children: [new Paragraph(item.quantity || '')] }),
                  new TableCell({ children: [new Paragraph(item.unitPrice || '')] }),
                  new TableCell({ children: [new Paragraph(item.total || '')] })
                ]
              })),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Table Total", bold: true })] })], columnSpan: 3 }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: table.fields['Table Total'] || '', bold: true })] })] })
                ]
              })
            ]
          }),
          new Paragraph({ spacing: { before: 400 } })
        ])
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${file.file.name.replace(/\.[^/.]+$/, "")}_Invoice.docx`);
};

export const generateDynamicWordInvoice = async (data: DynamicInvoice, fileName: string, templateType: string = 'vehicle') => {
  let doc;
  switch (templateType) {
    case 'modern': doc = buildModernTemplate(data); break;
    case 'minimal': doc = buildMinimalTemplate(data); break;
    case 'corporate': doc = buildCorporateTemplate(data); break;
    case 'classic': doc = buildClassicTemplate(data); break;
    case 'vehicle':
    default: doc = buildVehicleTemplate(data); break;
  }

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName.replace(/\.[^/.]+$/, "")}_Generated.docx`);
};
