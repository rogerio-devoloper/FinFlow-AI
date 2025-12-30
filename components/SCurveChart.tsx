import React from 'react';
import { Transaction, TransactionType } from '../types.ts';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/formatters.ts';

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
      date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      receitaAcumulada: cumulativeIncome,
      despesaAcumulada: cumulativeExpense,
    };
  });

  const chartData = data.length > 30 ? data.filter((_, i) => i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 20) === 0) : data;

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl shadow-sm overflow-hidden h-full flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-dark-border">
        <h3 className="text-lg font-semibold text-dark-text">Evolução Financeira</h3>
      </div>
      <div className="flex-1 min-h-[300px] p-4">
        {transactions.length === 0 ? (
           <div className="h-full flex items-center justify-center text-dark-muted text-sm">
               Sem dados para o período.
           </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={isDarkMode ? "#94a3b8" : "#64748b"} tick={{fontSize: 10}} tickMargin={10} />
                <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} tick={{fontSize: 10}} />
                <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: textColor, borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: textColor }}
                    formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="receitaAcumulada" name="Receita Acum." stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesaAcumulada" name="Despesa Acum." stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};