import React, { useState } from 'react';
import { FileText, Settings, LayoutDashboard, PlusCircle, Receipt, Landmark, Wrench, Lock } from 'lucide-react';
import InvoiceExtractor from './components/InvoiceExtractor';
import ReceiptScanner from './components/ReceiptScanner';
import BankStatementParser from './components/BankStatementParser';
import CustomExtractor from './components/CustomExtractor';
import PrivateExtractor from './components/PrivateExtractor';

type Module = 'invoice' | 'receipt' | 'bank_statement' | 'custom' | 'private' | 'coming_soon';

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('invoice');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Data Transformer
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveModule('invoice')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeModule === 'invoice'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            Invoice Extractor
          </button>

          <button
            onClick={() => setActiveModule('receipt')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeModule === 'receipt'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Receipt className="w-5 h-5" />
            Receipt Scanner
          </button>

          <button
            onClick={() => setActiveModule('bank_statement')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeModule === 'bank_statement'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Landmark className="w-5 h-5" />
            Bank Statement Parser
          </button>

          <button
            onClick={() => setActiveModule('custom')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeModule === 'custom'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Wrench className="w-5 h-5" />
            Custom Extractor
          </button>

          <button
            onClick={() => setActiveModule('private')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeModule === 'private'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Lock className="w-5 h-5" />
            Private Extractor
          </button>
          
          <button
            onClick={() => setActiveModule('coming_soon')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeModule === 'coming_soon'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            More Modules
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeModule === 'invoice' && <InvoiceExtractor />}
        {activeModule === 'receipt' && <ReceiptScanner />}
        {activeModule === 'bank_statement' && <BankStatementParser />}
        {activeModule === 'custom' && <CustomExtractor />}
        {activeModule === 'private' && <PrivateExtractor />}
        
        {activeModule === 'coming_soon' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">More Modules Coming Soon</h2>
            <p className="text-gray-600 max-w-md">
              This app is designed to be modular. Future modules like Receipt Scanner or Bank Statement Parser will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
