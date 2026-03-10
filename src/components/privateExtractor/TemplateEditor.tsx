import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Template } from '../../lib/localParser';

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
  setTemplate: React.Dispatch<React.SetStateAction<Template | null>>;
}

export default function TemplateEditor({ template, onSave, onCancel, setTemplate }: TemplateEditorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Edit Template: {template.name}</h3>
        <input 
          value={template.name} 
          onChange={e => setTemplate({...template, name: e.target.value})}
          className="w-full mb-4 p-2 border rounded"
          placeholder="Template Name"
        />
        <div className="space-y-2 mb-4">
          {template.fields.map((field, i) => (
            <div key={i} className="flex gap-2">
              <input value={field.name} onChange={e => {
                const newFields = [...template.fields];
                newFields[i].name = e.target.value;
                setTemplate({...template, fields: newFields});
              }} className="flex-1 p-2 border rounded" placeholder="Field Name" />
              <input value={field.pattern} onChange={e => {
                const newFields = [...template.fields];
                newFields[i].pattern = e.target.value;
                setTemplate({...template, fields: newFields});
              }} className="flex-1 p-2 border rounded" placeholder="Regex Pattern" />
              <button onClick={() => setTemplate({...template, fields: template.fields.filter((_, idx) => idx !== i)})} className="text-red-500"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => setTemplate({...template, fields: [...template.fields, { name: '', pattern: '' }]})} className="text-emerald-600 flex items-center gap-1 mb-4"><Plus className="w-4 h-4" /> Add Field</button>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600">Cancel</button>
          <button onClick={() => onSave(template)} className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}
