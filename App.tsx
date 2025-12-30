import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionStatus } from './types.ts';
import { StatsCards } from './components/StatsCards.tsx';
import { TransactionForm } from './components/TransactionForm.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { Charts } from './components/Charts.tsx';
import { AIAdvisor } from './components/AIAdvisor.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { FilterBar, FilterState } from './components/FilterBar.tsx';
import { SCurveChart } from './components/SCurveChart.tsx';
import { LayoutDashboard, Plus, Settings, Sun, Moon, CloudCheck, Loader2 } from 'lucide-react';
import { syncToSheet } from './services/sheetsService.ts';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [filter, setFilter] = useState<FilterState>({
    period: 'month',
    year: new Date().getFullYear(),
    value: new Date().getMonth()
  });
  const [sheetConfig, setSheetConfig] = useState({ url: '', autoSync: false });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('finflow_transactions');
    if (saved) {
      try { setTransactions(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedTheme = localStorage.getItem('finflow_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('finflow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      if (year !== filter.year) return false;
      if (filter.period === 'month') return month === filter.value;
      return true;
    });
    setFilteredTransactions(filtered);
  }, [transactions, filter]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('finflow_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold">FinFlow <span className="text-brand-500">AI</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-dark-muted hover:text-dark-text">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-dark-muted hover:text-dark-text">
              <Settings size={20} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Plus size={18} /> Novo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <FilterBar filter={filter} onChange={setFilter} />
        <StatsCards transactions={filteredTransactions} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Charts transactions={filteredTransactions} isDarkMode={theme === 'dark'} />
            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={(id) => setTransactions(prev => prev.filter(t => t.id !== id))} 
              onToggleStatus={(id) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: t.status === TransactionStatus.COMPLETED ? TransactionStatus.PENDING : TransactionStatus.COMPLETED } : t))}
              onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
            />
          </div>
          <div className="space-y-6">
            <AIAdvisor transactions={filteredTransactions} />
            <SCurveChart transactions={filteredTransactions} isDarkMode={theme === 'dark'} />
          </div>
        </div>
      </main>

      {isModalOpen && (
        <TransactionForm 
          onAdd={(t) => {
            if (editingTransaction) {
              setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
            } else {
              setTransactions(prev => [...prev, t]);
            }
            setIsModalOpen(false);
            setEditingTransaction(null);
          }} 
          onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} 
          initialData={editingTransaction}
        />
      )}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        transactions={transactions} 
        onImport={(d) => setTransactions(d)}
        onSheetConfigSave={(url, auto) => setSheetConfig({ url, autoSync: auto })}
        sheetConfig={sheetConfig}
        onManualSync={() => {}}
        isSyncing={isSyncing}
      />
    </div>
  );
};

export default App;