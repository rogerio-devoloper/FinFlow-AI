import React from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { TrendingUp, TrendingDown, Wallet, Clock, AlertTriangle } from 'lucide-react';

interface StatsCardsProps {
  transactions: Transaction[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ transactions }) => {
  // Real Balance (Only Completed)
  const incomeReal = transactions
    .filter(t => t.type === TransactionType.INCOME && t.status === TransactionStatus.COMPLETED)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenseReal = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.status === TransactionStatus.COMPLETED)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balanceReal = incomeReal - expenseReal;

  // Pending (Future)
  const expensePending = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.status === TransactionStatus.PENDING)
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const incomePending = transactions
    .filter(t => t.type === TransactionType.INCOME && t.status === TransactionStatus.PENDING)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Balance Card - Keeps dark style for contrast */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-6 rounded-2xl shadow-lg shadow-brand-900/50 text-white relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet size={100} />
        </div>
        <div className="relative z-10">
          <p className="text-brand-100 text-sm font-medium mb-1">Saldo em Conta</p>
          <h2 className="text-3xl font-bold">{formatMoney(balanceReal)}</h2>
          <div className="mt-2 text-xs bg-black/20 inline-flex items-center gap-1.5 px-2 py-1 rounded-full">
            <span className={balanceReal + incomePending - expensePending >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {formatMoney(balanceReal + incomePending - expensePending)}
            </span>
            <span className="opacity-70">previsto</span>
          </div>
        </div>
      </div>

      {/* Income Card */}
      <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-300">
        <div className="flex items-center justify-between mb-2">
            <p className="text-dark-muted text-sm font-medium">Receitas</p>
            <div className="p-2 bg-emerald-500/10 rounded-full">
                <TrendingUp className="text-emerald-500" size={20} />
            </div>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{formatMoney(incomeReal)}</h2>
            {incomePending > 0 && (
                <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1 flex items-center gap-1">
                    <Clock size={12} /> +{formatMoney(incomePending)} a receber
                </p>
            )}
        </div>
      </div>

      {/* Expense Card */}
      <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-300">
         <div className="flex items-center justify-between mb-2">
            <p className="text-dark-muted text-sm font-medium">Despesas</p>
            <div className="p-2 bg-rose-500/10 rounded-full">
                <TrendingDown className="text-rose-500" size={20} />
            </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-rose-500 dark:text-rose-400">{formatMoney(expenseReal)}</h2>
          {expensePending > 0 && (
             <p className="text-xs text-rose-600/70 dark:text-rose-500/70 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> +{formatMoney(expensePending)} a pagar
             </p>
          )}
        </div>
      </div>
    </div>
  );
};