import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SCurveChartProps {
  transactions: Transaction[];
  isDarkMode: boolean;
}

export const SCurveChart: React.FC<SCurveChartProps> = ({ transactions, isDarkMode }) => {
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';

  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulativeIncome = 0;
  let cumulativeExpense = 0;

  const data = sortedTransactions.map(t => {
    if (t.type === TransactionType.INCOME) cumulativeIncome += t.amount;
    else cumulativeExpense += t.amount;

    return {
      date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
      receitaAcumulada: cumulativeIncome,
      despesaAcumulada: cumulativeExpense,
    };
  });

  const currencyFormatter = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-dark-text">Evolução Financeira</h3>
          <p className="text-[10px] text-dark-muted mt-0.5">Acumulado do período</p>
        </div>
      </div>
      <div className="h-[220px] w-full p-2">
        {transactions.length === 0 ? (
           <div className="h-full flex items-center justify-center text-dark-muted text-xs italic">
               Sem dados para o período.
           </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis 
                    dataKey="date" 
                    stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                    tick={{fontSize: 9}} 
                    tickMargin={8}
                    interval="preserveStartEnd"
                />
                <YAxis 
                    stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                    tick={{fontSize: 9}} 
                    tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                    width={60}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: textColor, borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: textColor, padding: '2px 0' }}
                    formatter={(value: number) => currencyFormatter(value)}
                />
                <Area 
                    type="monotone" 
                    dataKey="receitaAcumulada" 
                    name="Receita Acum."
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    strokeWidth={2}
                    animationDuration={1500}
                />
                <Area 
                    type="monotone" 
                    dataKey="despesaAcumulada" 
                    name="Despesa Acum."
                    stroke="#f43f5e" 
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                    strokeWidth={2}
                    animationDuration={1500}
                />
            </AreaChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};