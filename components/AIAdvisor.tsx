import React, { useState } from 'react';
import { Transaction, FinancialInsight } from '../types.ts';
import { generateFinancialAdvice } from '../services/geminiService.ts';
import { Sparkles, BrainCircuit, CheckCircle2, ChevronRight } from 'lucide-react';

interface AIAdvisorProps {
  transactions: Transaction[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<FinancialInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (transactions.length === 0) return;
    
    setLoading(true);
    try {
      const result = await generateFinancialAdvice(transactions);
      setInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-indigo-950 dark:text-white whitespace-nowrap">Consultor IA</h3>
                    </div>
                </div>
                {!insight && (
                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || transactions.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 ml-4"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <BrainCircuit size={18} />}
                        <span className="hidden sm:inline">{loading ? 'Analisando...' : 'Analisar Finanças'}</span>
                    </button>
                )}
            </div>

            {insight && (
                <div className="animate-fade-in space-y-4">
                    <div className="bg-white/50 dark:bg-dark-bg/50 backdrop-blur rounded-xl p-4 border border-indigo-200 dark:border-indigo-500/20">
                        <p className="text-slate-700 dark:text-slate-200 text-sm">{insight.analysis}</p>
                    </div>
                    <button onClick={handleAnalyze} className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 transition-colors ml-auto">
                        Atualizar análise <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};