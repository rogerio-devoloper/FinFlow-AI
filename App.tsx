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
import { LayoutDashboard, Plus, Settings, Sun, Moon, CloudCheck, CloudOff, Loader2 } from 'lucide-react';
import { syncToSheet, fetchFromSheet } from './services/sheetsService';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Default to light
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [filter, setFilter] = useState<FilterState>({
    period: 'month',
    year: new Date().getFullYear(),
    value: new Date().getMonth()
  });

  // Google Sheets State
  const [sheetConfig, setSheetConfig] = useState<{url: string, autoSync: boolean}>({ url: '', autoSync: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // FIX: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to avoid namespace error
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('finflow_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
       // Default is light, ensure dark class is removed
       document.documentElement.classList.remove('dark');
       setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('finflow_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('finflow_transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
    
    const savedConfig = localStorage.getItem('finflow_sheet_config');
    if (savedConfig) {
        try {
            setSheetConfig(JSON.parse(savedConfig));
        } catch(e) {}
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('finflow_transactions', JSON.stringify(transactions));
    
    // Auto Sync Logic
    if (sheetConfig.url && sheetConfig.autoSync && transactions.length > 0) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        setSyncStatus('idle'); // Reset status while waiting
        syncTimeoutRef.current = setTimeout(() => {
            handleSyncToCloud(transactions);
        }, 3000); // 3 seconds debounce
    }
  }, [transactions, sheetConfig.autoSync, sheetConfig.url]); // Re-run when transactions change

  const handleSyncToCloud = async (dataToSync: Transaction[]) => {
      if (!sheetConfig.url) return;
      
      setIsSyncing(true);
      try {
          await syncToSheet(sheetConfig.url, dataToSync);
          setSyncStatus('success');
          // Clear success message after a while
          setTimeout(() => setSyncStatus('idle'), 5000);
      } catch (e) {
          console.error(e);
          setSyncStatus('error');
      } finally {
          setIsSyncing(false);
      }
  };

  const handleManualSync = async () => {
      // Logic: Pull first, merge? No, simple strategy: Overwrite cloud with local (Backup mode)
      // Or: If local is empty, pull from cloud. 
      // For this app, let's treat Local as Single Source of Truth for edits, but allow pulling if user wants (Import)
      // But the Settings button "Sync Now" usually implies pushing current state or bi-directional.
      // Let's do a Push. To pull, user usually does "Import". 
      // Actually, let's try to pull first to check if we have data there? No, too complex.
      // We will Push current state to Cloud.
      await handleSyncToCloud(transactions);
  };

  const handleSheetConfigSave = (url: string, autoSync: boolean) => {
      const newConfig = { url, autoSync };
      setSheetConfig(newConfig);
      localStorage.setItem('finflow_sheet_config', JSON.stringify(newConfig));
      
      // If turning on auto-sync, trigger immediate sync
      if (autoSync && url) {
          handleSyncToCloud(transactions);
      }
  };

  // Filter Logic
  useEffect(() => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();

      if (year !== filter.year) return false;

      if (filter.period === 'month') {
        return month === filter.value;
      }
      if (filter.period === 'quarter') {
        const quarter = Math.floor(month / 3);
        return quarter === filter.value;
      }
      if (filter.period === 'semester') {
        const semester = month < 6 ? 0 : 1;
        return semester === filter.value;
      }
      // Year period
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
          status: t.status === TransactionStatus.COMPLETED 
            ? TransactionStatus.PENDING 
            : TransactionStatus.COMPLETED
        };
      }
      return t;
    }));
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleImportData = (data: Transaction[]) => {
    setTransactions(data);
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-2 rounded-lg">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
                 <h1 className="text-xl font-bold text-dark-text tracking-tight transition-colors leading-none">FinFlow <span className="text-brand-500">AI</span></h1>
                 {sheetConfig.url && (
                    <div className="flex items-center gap-1 mt-1">
                        {isSyncing ? (
                             <span className="text-[10px] text-brand-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> Sincronizando...</span>
                        ) : syncStatus === 'success' ? (
                             <span className="text-[10px] text-emerald-500 flex items-center gap-1"><CloudCheck size={10} /> Salvo na nuvem</span>
                        ) : syncStatus === 'error' ? (
                             <span className="text-[10px] text-rose-500 flex items-center gap-1"><CloudOff size={10} /> Erro no sync</span>
                        ) : (
                             <span className="text-[10px] text-dark-muted flex items-center gap-1"><CloudCheck size={10} /> Conectado</span>
                        )}
                    </div>
                 )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-hover rounded-lg transition-colors"
              title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-hover rounded-lg transition-colors relative"
              title="Configurações e Backup"
            >
              <Settings size={20} />
              {sheetConfig.url && !sheetConfig.autoSync && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2 text-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nova Movimentação</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        
        <FilterBar filter={filter} onChange={setFilter} />

        <StatsCards transactions={filteredTransactions} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
                <Charts transactions={filteredTransactions} isDarkMode={theme === 'dark'} />
                
                {/* New Grid for List and S-Curve */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <TransactionList 
                      transactions={filteredTransactions} 
                      onDelete={deleteTransaction} 
                      onToggleStatus={toggleTransactionStatus}
                      onEdit={handleEditClick}
                   />
                   <SCurveChart transactions={filteredTransactions} isDarkMode={theme === 'dark'} />
                </div>
            </div>
            <div className="xl:col-span-1">
                <AIAdvisor transactions={filteredTransactions} />
                
                {/* Simple Tips Widget */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm transition-colors duration-300">
                    <h4 className="text-dark-text font-semibold mb-4">Dica Rápida</h4>
                    <p className="text-dark-muted text-sm leading-relaxed">
                        Faça backup dos seus dados regularmente clicando no ícone de engrenagem acima. Você pode exportar para o Excel!
                    </p>
                </div>
            </div>
        </div>

      </main>

      {isModalOpen && (
        <TransactionForm 
          onAdd={handleSaveTransaction} 
          onClose={handleModalClose}
          initialData={editingTransaction}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        transactions={transactions}
        onImport={handleImportData}
        onSheetConfigSave={handleSheetConfigSave}
        sheetConfig={sheetConfig}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
      />
    </div>
  );
};

export default App;