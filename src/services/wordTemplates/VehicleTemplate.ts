import { Document, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { DynamicInvoice } from '../GeminiService';
import { createField, createTwoColumnFields, createDynamicTable } from './TemplateHelpers';

export const buildVehicleTemplate = (data: DynamicInvoice) => {
  const font = "Arial";
  const size = 20;

  // Split fields: first 6 in 2 columns, rest as list
  const topFields = data.fields.slice(0, 6);
  const bottomFields = data.fields.slice(6);

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: data.templateName || "INVOICE", bold: true, size: 36, font })],
          spacing: { after: 400 },
          alignment: AlignmentType.LEFT
        }),
        createTwoColumnFields(topFields, font, size),
        new Paragraph({ spacing: { before: 200, after: 200 } }),
        ...bottomFields.map(f => createField(f.label, f.value, font, size)),
        new Paragraph({ spacing: { before: 200, after: 200 } }),
        ...data.tables.flatMap(table => [
          new Paragraph({ children: [new TextRun({ text: table.label, bold: true, size: 24, font })], spacing: { after: 200 } }),
          createDynamicTable(table, font, "E0E0E0", "000000", BorderStyle.SINGLE, "000000"),
          new Paragraph({ spacing: { before: 400 } })
        ])
      ]
    }]
  });
};
