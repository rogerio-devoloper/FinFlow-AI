import React from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types.ts';
import { ArrowDownLeft, ArrowUpRight, Trash2, Calendar, CheckCircle2, Circle, AlertCircle, Clock, Pencil } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.ts';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onToggleStatus, onEdit }) => {
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isOverdue = (t: Transaction) => {
    if (t.status === TransactionStatus.COMPLETED) return false;
    const today = new Date().toISOString().split('T')[0];
    const relevantDate = t.dueDate || t.date;
    return relevantDate < today;
  };

  const getStatusColor = (t: Transaction) => {
      if (t.status === TransactionStatus.COMPLETED) return 'text-emerald-500';
      if (isOverdue(t)) return 'text-rose-500';
      return 'text-amber-500';
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
  };

  if (sorted.length === 0) {
    return (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center text-dark-muted shadow-sm h-full flex flex-col justify-center">
            <p>Nenhuma transação neste período.</p>
        </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl shadow-sm overflow-hidden transition-colors duration-300 h-full flex flex-col">
      <div className="p-6 border-b border-dark-border flex justify-between items-center">
        <h3 className="text-lg font-semibold text-dark-text">Extrato</h3>
        <span className="text-xs text-dark-muted bg-dark-hover px-2 py-1 rounded">
            {transactions.filter(t => t.status === TransactionStatus.PENDING).length} pendências
        </span>
      </div>
      <div className="divide-y divide-dark-border overflow-y-auto flex-1 max-h-[500px]">
        {sorted.map((t) => (
          <div 
            key={t.id} 
            className={`p-4 flex items-center justify-between transition-colors group ${
                isOverdue(t) 
                ? 'animate-overdue' 
                : 'hover:bg-dark-hover'
            }`}
          >
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <button 
                onClick={() => onToggleStatus(t.id)}
                className={`transition-colors focus:outline-none flex-shrink-0 ${getStatusColor(t)}`}
              >
                {t.status === TransactionStatus.COMPLETED ? (
                    <CheckCircle2 size={22} className="fill-current bg-dark-card rounded-full" />
                ) : isOverdue(t) ? (
                    <AlertCircle size={22} className="fill-current bg-dark-card rounded-full" />
                ) : (
                    <Circle size={22} />
                )}
              </button>

              <div className={`p-2 rounded-lg flex-shrink-0 ${
                t.type === TransactionType.INCOME 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-rose-500/10 text-rose-500'
              }`}>
                {t.type === TransactionType.INCOME ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </div>

              <div className="min-w-0">
                <p className={`font-medium truncate ${t.status === TransactionStatus.COMPLETED ? 'text-dark-text' : 'text-dark-muted'}`}>
                    {t.description}
                </p>
                <div className="flex flex-col gap-0.5 mt-1">
                    <div className="flex items-center gap-2 text-xs text-dark-muted">
                        <span className="bg-dark-hover px-2 py-0.5 rounded text-dark-text/80 whitespace-nowrap">{t.category}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar size={10} /> 
                            {formatDate(t.date)}
                        </span>
                    </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 pl-2">
              <span className={`font-semibold whitespace-nowrap ${
                t.status === TransactionStatus.PENDING ? 'opacity-60' : ''
              } ${
                t.type === TransactionType.INCOME ? 'text-emerald-500 dark:text-emerald-400' : 'text-dark-text'
              }`}>
                {t.type === TransactionType.EXPENSE ? '-' : '+'} 
                {formatCurrency(t.amount)}
              </span>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(t)} className="p-1.5 text-dark-muted hover:text-brand-500 rounded-lg">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(t.id)} className="p-1.5 text-dark-muted hover:text-rose-500 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};