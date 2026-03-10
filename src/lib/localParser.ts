import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure PDF.js worker using Vite's URL import
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextLocally(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return await extractTextFromPDF(file);
  } else if (file.type.startsWith('image/')) {
    return await extractTextFromImage(file);
  }
  throw new Error('Unsupported file type for local parsing');
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(' ');
    fullText += text + '\n';
  }
  return fullText;
}

async function extractTextFromImage(file: File): Promise<string> {
  const result = await Tesseract.recognize(file, 'eng');
  return result.data.text;
}

export interface Template {
  id: string;
  name: string;
  fields: { name: string; pattern: string }[];
}

// Rule-based parser for structured data using a template
export function parseTextWithTemplate(text: string, template: Template) {
  const extractedFields: Record<string, string> = {};
  
  template.fields.forEach(field => {
    const regex = new RegExp(field.pattern, 'i');
    const match = text.match(regex);
    extractedFields[field.name] = match ? match[1].trim() : 'N/A';
  });

  return {
    rawText: text,
    extractedFields
  };
}
