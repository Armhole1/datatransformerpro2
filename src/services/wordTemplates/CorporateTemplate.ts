import { Document, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { DynamicInvoice } from '../GeminiService';
import { createTwoColumnFields, createDynamicTable } from './TemplateHelpers';

export const buildCorporateTemplate = (data: DynamicInvoice) => {
  const font = "Tahoma";
  const size = 18;

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: (data.templateName || "INVOICE").toUpperCase(), bold: true, size: 36, font, color: "1E3A8A" })],
          spacing: { after: 400 },
          alignment: AlignmentType.LEFT
        }),
        createTwoColumnFields(data.fields, font, size),
        new Paragraph({ spacing: { before: 400, after: 200 } }),
        ...data.tables.flatMap(table => [
          new Paragraph({ children: [new TextRun({ text: table.label, bold: true, size: 24, font, color: "1E3A8A" })], spacing: { after: 200 } }),
          createDynamicTable(table, font, "1E3A8A", "FFFFFF", BorderStyle.THICK, "1E3A8A"),
          new Paragraph({ spacing: { before: 400 } })
        ])
      ]
    }]
  });
};
