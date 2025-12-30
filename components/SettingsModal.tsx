import React, { useRef, useState } from 'react';
import { Transaction } from '../types';
import { exportToExcel, importFromExcel } from '../services/excelService';
import { generateFinancialPDF } from '../services/pdfService';
import { APPS_SCRIPT_CODE } from '../services/sheetsService';
import { X, Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, FileText, ChevronRight, Sheet, Copy, Save, Database, CloudCog, ChevronDown, BookOpen } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImport: (data: Transaction[]) => void;
  onSheetConfigSave: (url: string, autoSync: boolean) => void;
  sheetConfig: { url: string; autoSync: boolean };
  onManualSync: () => void;
  isSyncing: boolean;
}

type PeriodType = 'month' | 'quarter' | 'semester' | 'year';
type Tab = 'data' | 'cloud';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  transactions, 
  onImport,
  onSheetConfigSave,
  sheetConfig,
  onManualSync,
  isSyncing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('data');
  
  // Sheet Config State
  const [sheetUrl, setSheetUrl] = useState(sheetConfig.url);
  const [autoSync, setAutoSync] = useState(sheetConfig.autoSync);
  
  // UX: Auto-show script instructions if URL is empty
  const [showScript, setShowScript] = useState(!sheetConfig.url);
  
  // PDF Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedValue, setSelectedValue] = useState(new Date().getMonth());

  if (!isOpen) return null;

  const handleExportExcel = () => {
    try {
      exportToExcel(transactions);
      setMessage({ type: 'success', text: 'Arquivo Excel gerado com sucesso!' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Erro ao gerar arquivo.' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      onImport(data);
      setMessage({ type: 'success', text: `${data.length} transações importadas com sucesso!` });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao ler o arquivo. Verifique o formato.' });
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGeneratePdf = () => {
    // Filter transactions based on selection
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();

      if (year !== selectedYear) return false;

      if (periodType === 'month') return month === selectedValue;
      
      if (periodType === 'quarter') {
        const quarter = Math.floor(month / 3);
        return quarter === selectedValue;
      }
      
      if (periodType === 'semester') {
        const semester = month < 6 ? 0 : 1;
        return semester === selectedValue;
      }

      return true; // year
    });

    if (filtered.length === 0) {
      setMessage({ type: 'error', text: 'Não há transações no período selecionado.' });
      setShowPdfModal(false);
      return;
    }

    // Generate Label
    let label = `${selectedYear}`;
    if (periodType === 'month') {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        label = `${months[selectedValue]} de ${selectedYear}`;
    } else if (periodType === 'quarter') {
        label = `${selectedValue + 1}º Trimestre de ${selectedYear}`;
    } else if (periodType === 'semester') {
        label = `${selectedValue + 1}º Semestre de ${selectedYear}`;
    }

    generateFinancialPDF(filtered, label);
    setMessage({ type: 'success', text: 'PDF gerado com sucesso!' });
    setShowPdfModal(false);
  };

  const handleSaveSheetConfig = () => {
      // Validation: Must be a script.google.com URL
      if (sheetUrl && !sheetUrl.includes('script.google.com')) {
          if (sheetUrl.includes('docs.google.com')) {
            setMessage({ type: 'error', text: 'Link incorreto! Você colou o link da planilha. É necessário o link do Script (App da Web).' });
          } else {
            setMessage({ type: 'error', text: 'Link inválido. O link deve começar com https://script.google.com/...' });
          }
          return;
      }

      onSheetConfigSave(sheetUrl, autoSync);
      setMessage({ type: 'success', text: 'Configurações de nuvem salvas!' });
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setMessage({ type: 'success', text: 'Código copiado para a área de transferência!' });
  };

  // Render Period Selection Sub-Modal
  if (showPdfModal) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-dark-card border border-dark-border w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-semibold text-dark-text flex items-center gap-2">
               <FileText className="text-brand-500" size={20} /> Exportar PDF
             </h3>
             <button onClick={() => setShowPdfModal(false)} className="text-dark-muted hover:text-dark-text">
               <X size={20} />
             </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Tipo de Período</label>
              <div className="grid grid-cols-2 gap-2">
                {(['month', 'quarter', 'semester', 'year'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setPeriodType(type)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                      periodType === type 
                      ? 'bg-brand-500/10 border-brand-500 text-brand-500' 
                      : 'bg-dark-input border-dark-border text-dark-muted hover:border-dark-muted'
                    }`}
                  >
                    {type === 'month' && 'Mensal'}
                    {type === 'quarter' && 'Trimestral'}
                    {type === 'semester' && 'Semestral'}
                    {type === 'year' && 'Anual'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-dark-muted mb-1">Ano</label>
                   <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full bg-dark-input border border-dark-border rounded-lg px-3 py-2 text-dark-text"
                   >
                     {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                       <option key={year} value={year}>{year}</option>
                     ))}
                   </select>
                </div>
                
                {periodType !== 'year' && (
                  <div>
                    <label className="block text-sm font-medium text-dark-muted mb-1">
                       {periodType === 'month' && 'Mês'}
                       {periodType === 'quarter' && 'Trimestre'}
                       {periodType === 'semester' && 'Semestre'}
                    </label>
                    <select 
                        value={selectedValue}
                        onChange={(e) => setSelectedValue(Number(e.target.value))}
                        className="w-full bg-dark-input border border-dark-border rounded-lg px-3 py-2 text-dark-text"
                    >
                        {periodType === 'month' && ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                           <option key={i} value={i}>{m}</option>
                        ))}
                        {periodType === 'quarter' && ['1º Trim', '2º Trim', '3º Trim', '4º Trim'].map((q, i) => (
                           <option key={i} value={i}>{q}</option>
                        ))}
                        {periodType === 'semester' && ['1º Semestre', '2º Semestre'].map((s, i) => (
                           <option key={i} value={i}>{s}</option>
                        ))}
                    </select>
                  </div>
                )}
            </div>

            <button 
              onClick={handleGeneratePdf}
              className="w-full mt-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
               <Download size={18} />
               Baixar Demonstrativo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Settings Modal
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in transition-colors duration-300 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-dark-border">
          <h3 className="text-xl font-semibold text-dark-text">Configurações & Dados</h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-text transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border">
            <button 
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'data' ? 'border-brand-500 text-brand-500' : 'border-transparent text-dark-muted hover:text-dark-text'}`}
            >
                Dados Locais & Exportação
            </button>
            <button 
                onClick={() => setActiveTab('cloud')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'cloud' ? 'border-brand-500 text-brand-500' : 'border-transparent text-dark-muted hover:text-dark-text'}`}
            >
                <CloudCog size={16} /> Google Sheets (Nuvem)
            </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400'}`}>
               {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
               {message.text}
            </div>
          )}

          {activeTab === 'data' && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-sm font-medium text-dark-muted uppercase tracking-wider">Exportar Relatórios</h4>
                
                <button 
                  onClick={() => setShowPdfModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-dark-hover border border-dark-border rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-dark-text">Compartilhar Resumo (PDF)</p>
                      <p className="text-xs text-dark-muted">Demonstrativo formatado e oficial</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-dark-muted" />
                </button>
    
                <h4 className="text-sm font-medium text-dark-muted uppercase tracking-wider pt-2">Backup de Dados</h4>
    
                <button 
                  onClick={handleExportExcel}
                  className="w-full flex items-center justify-between p-4 bg-dark-hover border border-dark-border rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-dark-text">Exportar Excel</p>
                      <p className="text-xs text-dark-muted">Baixar planilha completa (.xlsx)</p>
                    </div>
                  </div>
                  <Download size={20} className="text-dark-muted" />
                </button>
    
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-4 bg-dark-hover border border-dark-border rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                      <Upload size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-dark-text">Importar Dados</p>
                      <p className="text-xs text-dark-muted">Restaurar de arquivo (.xlsx)</p>
                    </div>
                  </div>
                  <Upload size={20} className="text-dark-muted" />
                </button>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>
          )}

          {activeTab === 'cloud' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                      <div className="flex gap-3">
                          <Database className="text-emerald-500 flex-shrink-0" size={24} />
                          <div>
                              <h4 className="text-emerald-700 dark:text-emerald-400 font-semibold">Banco de Dados em Planilha</h4>
                              <p className="text-emerald-800/70 dark:text-emerald-300/70 text-sm mt-1">
                                  Conecte seu app a uma planilha do Google para salvar seus dados na nuvem automaticamente. 
                                  Isso funciona como um backend gratuito.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-dark-text mb-2">Link do Web App (Google Apps Script)</label>
                          <input 
                            type="text" 
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className="w-full bg-dark-input border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                          />
                          <div className="flex justify-between items-center mt-2">
                             <p className="text-xs text-dark-muted">
                                 O link deve começar com <code>script.google.com</code>
                             </p>
                             <button 
                                onClick={() => setShowScript(!showScript)} 
                                className="text-xs font-medium text-brand-500 hover:text-brand-400 flex items-center gap-1 transition-colors"
                             >
                                 <BookOpen size={14} />
                                 {showScript ? 'Ocultar Tutorial' : 'Como criar este link?'}
                             </button>
                          </div>
                      </div>

                      {showScript && (
                          <div className="bg-dark-hover border border-dark-border rounded-xl p-4 text-sm space-y-3 animate-fade-in">
                              <h5 className="font-semibold text-dark-text flex items-center gap-2">
                                  <span className="bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                                  Passo a Passo de Instalação
                              </h5>
                              <ol className="list-decimal list-inside space-y-2 text-dark-muted pl-1">
                                  <li>Crie uma planilha em branco: <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">sheets.new</a></li>
                                  <li>Vá em <strong>Extensões</strong> {'>'} <strong>Apps Script</strong>.</li>
                                  <li>Apague o código existente e cole o código abaixo.</li>
                                  <li>Clique em <strong>Implantar (Deploy)</strong> {'>'} <strong>Nova implantação</strong>.</li>
                                  <li>Clique na engrenagem ⚙️ e selecione <strong>App da Web</strong>.</li>
                                  <li className="text-rose-500 font-medium">Executar como: "Eu" (Me).</li>
                                  <li className="text-rose-500 font-medium">Quem pode acessar: "Qualquer pessoa" (Anyone).</li>
                                  <li>Clique em Implantar, autorize, e copie o URL gerado (termina em <code>/exec</code>).</li>
                              </ol>
                              <div className="relative mt-2">
                                  <textarea 
                                    readOnly 
                                    value={APPS_SCRIPT_CODE}
                                    className="w-full h-40 bg-black/80 text-green-400 font-mono text-xs p-3 rounded-lg border border-dark-border resize-none"
                                  />
                                  <button 
                                    onClick={copyToClipboard}
                                    className="absolute top-2 right-2 bg-dark-card p-1.5 rounded-md text-dark-text hover:text-brand-500 transition-colors shadow-sm"
                                    title="Copiar código"
                                  >
                                      <Copy size={14} />
                                  </button>
                              </div>
                          </div>
                      )}

                      <div className="flex items-center justify-between bg-dark-input p-3 rounded-lg border border-dark-border">
                          <span className="text-dark-text text-sm font-medium">Sincronização Automática</span>
                          <button 
                             onClick={() => setAutoSync(!autoSync)}
                             className={`w-12 h-6 rounded-full transition-colors relative ${autoSync ? 'bg-brand-500' : 'bg-dark-muted/30'}`}
                          >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${autoSync ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>

                      <div className="flex gap-3">
                          <button 
                            onClick={handleSaveSheetConfig}
                            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                              <Save size={18} /> Salvar Configuração
                          </button>
                          
                          {sheetUrl && (
                              <button 
                                onClick={onManualSync}
                                disabled={isSyncing}
                                className="px-4 bg-dark-hover border border-dark-border hover:bg-dark-card text-dark-text font-medium rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                              >
                                  {isSyncing ? (
                                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                      <CloudCog size={18} />
                                  )}
                                  Sincronizar Agora
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};