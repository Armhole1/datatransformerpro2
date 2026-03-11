import { Document, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { DynamicInvoice } from '../GeminiService';
import { createTwoColumnFields, createDynamicTable } from './TemplateHelpers';

export const buildModernTemplate = (data: DynamicInvoice) => {
  const font = "Helvetica";
  const size = 20;

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: data.templateName || "INVOICE", bold: true, size: 40, font, color: "10B981" })],
          spacing: { after: 400 },
          alignment: AlignmentType.RIGHT
        }),
        createTwoColumnFields(data.fields, font, size),
        new Paragraph({ spacing: { before: 400, after: 200 } }),
        ...data.tables.flatMap(table => [
          new Paragraph({ children: [new TextRun({ text: table.label, bold: true, size: 24, font, color: "10B981" })], spacing: { after: 200 } }),
          createDynamicTable(table, font, "10B981", "FFFFFF", BorderStyle.NONE, "FFFFFF"),
          new Paragraph({ spacing: { before: 400 } })
        ])
      ]
    }]
  });
};
