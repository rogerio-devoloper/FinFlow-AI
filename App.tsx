import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionStatus } from './types';
import { StatsCards } from './components/StatsCards';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Charts } from './components/Charts';
import { AIAdvisor } from './components/AIAdvisor';
import { SettingsModal } from './components/SettingsModal';
import { FilterBar, FilterState } from './components/FilterBar';
import { SCurveChart } from './components/SCurveChart';
import { LayoutDashboard, Plus, Settings, Sun, Moon, CloudCheck, Loader2, Download, Share, PlusSquare } from 'lucide-react';
import { syncToSheet } from './services/sheetsService';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [filter, setFilter] = useState<FilterState>({
    period: 'month',
    year: new Date().getFullYear(),
    value: new Date().getMonth()
  });

  const [sheetConfig, setSheetConfig] = useState<{url: string, autoSync: boolean}>({ url: '', autoSync: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIos && !isStandalone) {
      setShowIosGuide(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const savedTheme = localStorage.getItem('finflow_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('finflow_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const saved = localStorage.getItem('finflow_transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {}
    }
    
    const savedConfig = localStorage.getItem('finflow_sheet_config');
    if (savedConfig) {
        try {
            setSheetConfig(JSON.parse(savedConfig));
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('finflow_transactions', JSON.stringify(transactions));
    
    if (sheetConfig.url && sheetConfig.autoSync && transactions.length > 0) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            handleSyncToCloud(transactions);
        }, 3000);
    }
  }, [transactions, sheetConfig.autoSync, sheetConfig.url]);

  const handleSyncToCloud = async (dataToSync: Transaction[]) => {
      if (!sheetConfig.url) return;
      setIsSyncing(true);
      try {
          await syncToSheet(sheetConfig.url, dataToSync);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleSheetConfigSave = (url: string, autoSync: boolean) => {
      const newConfig = { url, autoSync };
      setSheetConfig(newConfig);
      localStorage.setItem('finflow_sheet_config', JSON.stringify(newConfig));
      if (autoSync && url) handleSyncToCloud(transactions);
  };

  useEffect(() => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      if (year !== filter.year) return false;
      if (filter.period === 'month') return month === filter.value;
      if (filter.period === 'quarter') return Math.floor(month / 3) === filter.value;
      if (filter.period === 'semester') return (month < 6 ? 0 : 1) === filter.value;
      return true;
    });
    setFilteredTransactions(filtered);
  }, [transactions, filter]);

  const handleSaveTransaction = (t: Transaction) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
    } else {
      setTransactions(prev => [...prev, t]);
    }
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const toggleTransactionStatus = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === TransactionStatus.COMPLETED ? TransactionStatus.PENDING : TransactionStatus.COMPLETED
        };
      }
      return t;
    }));
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg pb-20 transition-colors duration-300">
      
      {canInstall && (
        <div className="fixed bottom-24 right-6 z-50 animate-bounce">
          <button 
            onClick={handleInstallClick}
            className="bg-brand-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-brand-500 transition-all scale-110"
          >
            <Download size={24} />
            <span className="font-bold text-sm pr-2">INSTALAR APP</span>
          </button>
        </div>
      )}

      {showIosGuide && (
        <div className="fixed bottom-6 left-6 right-6 z-50 bg-brand-600 text-white p-4 rounded-2xl shadow-2xl animate-fade-in flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium">Instale este App no seu iPhone:</p>
            <button onClick={() => setShowIosGuide(false)} className="p-1">✕</button>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col items-center gap-1">
              <div className="bg-white/20 p-2 rounded-lg"><Share size={20} /></div>
              <span>1. Compartilhar</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="bg-white/20 p-2 rounded-lg"><PlusSquare size={20} /></div>
              <span>2. Add à Tela de Início</span>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-2 rounded-lg">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
                 <h1 className="text-xl font-bold text-dark-text leading-none">FinFlow <span className="text-brand-500">AI</span></h1>
                 {sheetConfig.url && (
                    <div className="flex items-center gap-1 mt-1">
                        {isSyncing ? (
                             <span className="text-[10px] text-brand-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Sync...</span>
                        ) : (
                             <span className="text-[10px] text-emerald-500 flex items-center gap-1"><CloudCheck size={10} /> Online</span>
                        )}
                    </div>
                 )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-dark-muted hover:text-dark-text transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-dark-muted hover:text-dark-text transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-brand-600/20 flex items-center gap-2 text-sm">
              <Plus size={18} />
              <span className="hidden sm:inline">Nova Movimentação</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <FilterBar filter={filter} onChange={setFilter} />
        <StatsCards transactions={filteredTransactions} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
                <Charts transactions={filteredTransactions} isDarkMode={theme === 'dark'} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <TransactionList transactions={filteredTransactions} onDelete={deleteTransaction} onToggleStatus={toggleTransactionStatus} onEdit={handleEditClick} />
                   <SCurveChart transactions={filteredTransactions} isDarkMode={theme === 'dark'} />
                </div>
            </div>
            <div className="xl:col-span-1">
                <AIAdvisor transactions={filteredTransactions} />
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
                    <h4 className="text-dark-text font-semibold mb-4 text-brand-500">App Instalável</h4>
                    <p className="text-dark-muted text-sm leading-relaxed mb-4">
                        Este software funciona como um App Nativo. Instale para acessar offline e diretamente da sua tela inicial.
                    </p>
                    <button 
                      onClick={handleInstallClick}
                      disabled={!canInstall}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-brand-500 text-brand-500 rounded-lg text-sm font-bold hover:bg-brand-500 hover:text-white transition-all disabled:opacity-30 disabled:grayscale"
                    >
                      {canInstall ? 'INSTALAR AGORA' : 'PRONTO PARA USO'}
                    </button>
                </div>
            </div>
        </div>
      </main>

      {isModalOpen && <TransactionForm onAdd={handleSaveTransaction} onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} initialData={editingTransaction} />}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} transactions={transactions} onImport={(d) => setTransactions(d)} onSheetConfigSave={handleSheetConfigSave} sheetConfig={sheetConfig} onManualSync={() => handleSyncToCloud(transactions)} isSyncing={isSyncing} />
    </div>
  );
};

export default App;