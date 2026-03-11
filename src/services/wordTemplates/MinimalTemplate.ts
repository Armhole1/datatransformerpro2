import { Document, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { DynamicInvoice } from '../GeminiService';
import { createField, createDynamicTable } from './TemplateHelpers';

export const buildMinimalTemplate = (data: DynamicInvoice) => {
  const font = "Calibri";
  const size = 22;

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: (data.templateName || "INVOICE").toUpperCase(), size: 48, font, color: "555555" })],
          spacing: { after: 600 },
          alignment: AlignmentType.CENTER
        }),
        ...data.fields.map(f => createField(f.label, f.value, font, size, false)),
        new Paragraph({ spacing: { before: 400, after: 200 } }),
        ...data.tables.flatMap(table => [
          new Paragraph({ children: [new TextRun({ text: table.label, size: 28, font, color: "555555" })], spacing: { after: 200 } }),
          createDynamicTable(table, font, "FFFFFF", "000000", BorderStyle.SINGLE, "DDDDDD"),
          new Paragraph({ spacing: { before: 400 } })
        ])
      ]
    }]
  });
};
