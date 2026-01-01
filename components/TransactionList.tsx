import React from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { ArrowDownLeft, ArrowUpRight, Trash2, Calendar, CheckCircle2, Circle, AlertCircle, Clock, Pencil, AlertTriangle } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onToggleStatus, onEdit }) => {
  const incomes = transactions.filter(t => t.type === TransactionType.INCOME).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isOverdue = (t: Transaction) => {
    if (t.status === TransactionStatus.COMPLETED) return false;
    const today = new Date().toISOString().split('T')[0];
    const relevantDate = t.dueDate || t.date;
    return relevantDate < today;
  };

  const isNearDate = (t: Transaction) => {
    if (t.status === TransactionStatus.COMPLETED) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(t.dueDate || t.date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 2;
  };

  const getStatusColor = (t: Transaction) => {
      if (t.status === TransactionStatus.COMPLETED) return 'text-emerald-500';
      if (isOverdue(t)) return 'text-rose-500';
      if (isNearDate(t)) return 'text-amber-500';
      return 'text-amber-500';
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
  };

  // Fixed: Added key to props type to satisfy TypeScript error during mapping.
  // Note: key is not passed down by React to the component, but it's required in the JSX element type for lists.
  const TransactionItem = ({ t }: { t: Transaction; key?: string }) => (
    <div 
      className={`p-3 rounded-xl border border-transparent transition-all group relative overflow-hidden ${
          isOverdue(t) 
          ? 'animate-overdue' 
          : isNearDate(t)
          ? 'animate-glow-warning bg-amber-500/5'
          : 'hover:bg-dark-hover'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => onToggleStatus(t.id)}
            className={`transition-colors focus:outline-none flex-shrink-0 ${getStatusColor(t)}`}
          >
            {t.status === TransactionStatus.COMPLETED ? (
                <CheckCircle2 size={20} className="fill-current bg-dark-card rounded-full" />
            ) : isOverdue(t) ? (
                <AlertCircle size={20} className="fill-current bg-dark-card rounded-full" />
            ) : isNearDate(t) ? (
                <AlertTriangle size={20} className="fill-current animate-pulse" />
            ) : (
                <Circle size={20} />
            )}
          </button>

          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${t.status === TransactionStatus.COMPLETED ? 'text-dark-text' : 'text-dark-muted'}`}>
                {t.description}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-dark-muted flex items-center gap-1">
                    <Calendar size={10} /> 
                    {formatDate(t.date)}
                </span>
                {t.dueDate && (
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${isOverdue(t) ? 'text-rose-500' : isNearDate(t) ? 'text-amber-500' : 'text-dark-muted'}`}>
                        <Clock size={10} />
                        {formatDate(t.dueDate)}
                    </span>
                )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end flex-shrink-0">
          <span className={`text-sm font-bold ${
            t.status === TransactionStatus.PENDING ? 'opacity-60' : ''
          } ${
            t.type === TransactionType.INCOME ? 'text-emerald-500 dark:text-emerald-400' : 'text-dark-text'
          }`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <button onClick={() => onEdit(t)} className="p-1 text-dark-muted hover:text-brand-500"><Pencil size={12}/></button>
            <button onClick={() => onDelete(t.id)} className="p-1 text-dark-muted hover:text-rose-500"><Trash2 size={12}/></button>
          </div>
        </div>
      </div>
      {isNearDate(t) && (
        <div className="absolute top-0 right-0 p-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Receitas Column */}
      <div className="bg-dark-card border border-dark-border rounded-2xl shadow-sm flex flex-col overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-dark-border flex justify-between items-center bg-emerald-500/5">
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
            <ArrowUpRight size={16} /> Receitas
          </h3>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
            {incomes.length} itens
          </span>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1 max-h-[400px]">
          {incomes.length === 0 ? (
            <p className="text-center py-8 text-xs text-dark-muted italic">Nenhuma receita.</p>
          ) : (
            incomes.map(t => <TransactionItem key={t.id} t={t} />)
          )}
        </div>
      </div>

      {/* Despesas Column */}
      <div className="bg-dark-card border border-dark-border rounded-2xl shadow-sm flex flex-col overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-dark-border flex justify-between items-center bg-rose-500/5">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 uppercase tracking-wider">
            <ArrowDownLeft size={16} /> Despesas
          </h3>
          <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold">
            {expenses.length} itens
          </span>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1 max-h-[400px]">
          {expenses.length === 0 ? (
            <p className="text-center py-8 text-xs text-dark-muted italic">Nenhuma despesa.</p>
          ) : (
            expenses.map(t => <TransactionItem key={t.id} t={t} />)
          )}
        </div>
      </div>
    </div>
  );
};