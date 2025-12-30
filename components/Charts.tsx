import React from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/formatters';

interface ChartsProps {
  transactions: Transaction[];
  isDarkMode: boolean;
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#6366f1'];

export const Charts: React.FC<ChartsProps> = ({ transactions, isDarkMode }) => {
  // Chart Colors based on theme
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';

  // Prepare data for Pie Chart (Expenses by Category)
  const expensesByCategory = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  // Prepare data for Bar Chart
  const barData = [
    {
      name: 'Entradas',
      amount: transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, c) => a + c.amount, 0)
    },
    {
      name: 'Saídas',
      amount: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, c) => a + c.amount, 0)
    }
  ];

  if (transactions.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center text-dark-muted">
        Adicione transações para visualizar os gráficos.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Category Distribution */}
      <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <h3 className="text-lg font-semibold text-dark-text mb-4">Gastos por Categoria</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                stroke={isDarkMode ? '#1e293b' : '#fff'}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: textColor, borderRadius: '8px' }}
                itemStyle={{ color: textColor }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend 
                wrapperStyle={{ color: textColor }} 
                formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income vs Expense */}
      <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <h3 className="text-lg font-semibold text-dark-text mb-4">Resumo Financeiro</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
              <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
              <Tooltip 
                cursor={{fill: gridColor, opacity: 0.4}}
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: textColor, borderRadius: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
                itemStyle={{ color: textColor }}
              />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.name === 'Entradas' ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
