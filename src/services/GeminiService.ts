import { GoogleGenAI, Type } from '@google/genai';

export interface DynamicInvoice {
  templateName: string;
  fields: { id: string; label: string; value: string }[];
  tables: {
    id: string;
    label: string;
    columns: string[];
    rows: { cells: string[] }[];
  }[];
}

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeInvoiceTemplate = async (file: File): Promise<DynamicInvoice> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const base64 = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { inlineData: { data: base64, mimeType: file.type } },
      { text: "Extract the invoice template structure and all visible data. Return a JSON object with 'templateName', 'fields' (array of objects with id, label, value), and 'tables' (array of objects with id, label, columns array, and rows array where each row is an object with a 'cells' array of strings matching the columns length)." }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          templateName: { type: Type.STRING },
          fields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                value: { type: Type.STRING }
              }
            }
          },
          tables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      cells: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) throw new Error("Failed to extract template.");
  return JSON.parse(response.text) as DynamicInvoice;
};
