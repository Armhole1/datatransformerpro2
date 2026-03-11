import { Document, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { DynamicInvoice } from '../GeminiService';
import { createField, createDynamicTable } from './TemplateHelpers';

export const buildClassicTemplate = (data: DynamicInvoice) => {
  const font = "Times New Roman";
  const size = 24;

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: data.templateName || "Invoice", bold: true, size: 44, font })],
          spacing: { after: 400 },
          alignment: AlignmentType.CENTER
        }),
        ...data.fields.map(f => createField(f.label, f.value, font, size)),
        new Paragraph({ spacing: { before: 400, after: 200 } }),
        ...data.tables.flatMap(table => [
          new Paragraph({ children: [new TextRun({ text: table.label, bold: true, size: 28, font })], spacing: { after: 200 } }),
          createDynamicTable(table, font, "F3F3F3", "000000", BorderStyle.DOUBLE, "000000"),
          new Paragraph({ spacing: { before: 400 } })
        ])
      ]
    }]
  });
};
