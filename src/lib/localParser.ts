import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

// Simple rule-based parser for structured data
export function parseTextToStructuredData(text: string) {
  // This is a placeholder for rule-based parsing logic.
  // In a real-world scenario, you would use regex or keyword matching here.
  return {
    rawText: text,
    extractedFields: {
      totalAmount: parseFloat(text.match(/total[:\s]*\$?([\d.]+)/i)?.[1] || '0'),
      date: text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)?.[1] || 'N/A',
    }
  };
}
