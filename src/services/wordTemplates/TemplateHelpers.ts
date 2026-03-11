import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType } from 'docx';

export const createField = (label: string, value: string, font: string, size: number, boldLabel = true) => {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label || ''}: `, bold: boldLabel, font, size }),
      new TextRun({ text: value || '', font, size })
    ],
    spacing: { after: 120 }
  });
};

export const createTwoColumnFields = (fields: any[], font: string, size: number) => {
  const mid = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, mid);
  const rightFields = fields.slice(mid);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: Array.from({ length: mid }).map((_, i) => new TableRow({
      children: [
        new TableCell({
          children: leftFields[i] ? [createField(leftFields[i].label, leftFields[i].value, font, size)] : [new Paragraph("")],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
        }),
        new TableCell({
          children: rightFields[i] ? [createField(rightFields[i].label, rightFields[i].value, font, size)] : [new Paragraph("")],
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
        })
      ]
    }))
  });
};

export const createDynamicTable = (table: any, font: string, headerBg: string, headerColor: string = "000000", borderStyle: BorderStyle = BorderStyle.SINGLE, borderColor: string = "000000") => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: borderStyle, size: 1, color: borderColor },
      bottom: { style: borderStyle, size: 1, color: borderColor },
      left: { style: borderStyle, size: 1, color: borderColor },
      right: { style: borderStyle, size: 1, color: borderColor },
      insideHorizontal: { style: borderStyle, size: 1, color: borderColor },
      insideVertical: { style: borderStyle, size: 1, color: borderColor },
    },
    rows: [
      new TableRow({
        children: table.columns.map((col: string) => 
          new TableCell({
            shading: { fill: headerBg, type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ children: [new TextRun({ text: col || '', bold: true, font, size: 20, color: headerColor })], spacing: { before: 100, after: 100 }, alignment: AlignmentType.CENTER })],
          })
        )
      }),
      ...table.rows.map((row: any) => new TableRow({
        children: row.cells.map((cell: string) => 
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell || '', font, size: 20 })], spacing: { before: 100, after: 100 } })],
          })
        )
      }))
    ]
  });
};
