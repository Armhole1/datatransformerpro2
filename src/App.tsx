import React, { useState, useEffect } from 'react';
import { FileText, Settings, LayoutDashboard, PlusCircle, Receipt, Landmark, Wrench, Lock, Wand2, Moon, Sun } from 'lucide-react';
import { Template } from './lib/localParser';
import { DEFAULT_TEMPLATE } from './components/PrivateExtractor';
import InvoiceExtractor from './components/InvoiceExtractor';
import ReceiptScanner from './components/ReceiptScanner';
import BankStatementParser from './components/BankStatementParser';
import CustomExtractor from './components/CustomExtractor';
import PrivateExtractor from './components/PrivateExtractor';
import TemplateGenerator from './components/TemplateGenerator';

type Module = 'invoice' | 'receipt' | 'bank_statement' | 'custom' | 'private' | 'template_gen' | 'coming_soon';

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('private');
  const [templates, setTemplates] = useState<Template[]>([DEFAULT_TEMPLATE]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="p-6">
          <h1 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Data Transformer
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveModule('private')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeModule === 'private'
                ? (isDarkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
            }`}
          >
            <Lock className="w-5 h-5" />
            Private Extractor
          </button>
        </nav>

        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`flex items-center gap-3 px-3 py-2 w-full text-sm font-medium rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className={`flex items-center gap-3 px-3 py-2 mt-2 w-full text-sm font-medium rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeModule === 'private' && <PrivateExtractor templates={templates} setTemplates={setTemplates} />}
      </main>
    </div>
  );
}
