import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Lock, UploadCloud, Loader2, Wand2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { extractTextLocally, Template } from '../lib/localParser';

export default function TemplateGenerator({ onSave }: { onSave: (template: Template) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const generateTemplate = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    console.log("Starting template generation for file:", file.name);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Generation timed out after 30 seconds')), 30000)
    );

    try {
      const generationPromise = (async () => {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
        
        const text = await extractTextLocally(file);
        console.log("Text extracted, length:", text.length);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        console.log("Calling Gemini...");
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Analyze this invoice text and create a JSON template for extracting key fields. Return only the JSON object.
          Template structure: { "name": string, "fields": [{ "name": string, "pattern": string }] }.
          Use regex patterns for the 'pattern' field.
          Invoice text: ${text.substring(0, 2000)}`,
          config: {
            responseMimeType: "application/json",
          },
        });
        console.log("Gemini response received:", response.text);

        const generatedTemplate = JSON.parse(response.text || '{}');
        console.log("Template parsed:", generatedTemplate);
        return { ...generatedTemplate, id: Math.random().toString() };
      })();

      const result = await Promise.race([generationPromise, timeoutPromise]);
      setTemplate(result as Template);
    } catch (err: any) {
      console.error("Error in template generation:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Wand2 className="w-6 h-6 text-emerald-600" />
        AI Template Generator
      </h2>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
        <input type="file" onChange={handleFileChange} className="mb-4" />
        <button 
          onClick={generateTemplate}
          disabled={!file || loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
          Generate Template
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {template && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-4">Generated Template: {template.name}</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm mb-4">
            {JSON.stringify(template, null, 2)}
          </pre>
          <button onClick={() => onSave(template)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Save Template</button>
        </div>
      )}
    </div>
  );
}
