export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO Date string YYYY-MM-DD (Payment/Transaction Date)
  dueDate?: string; // ISO Date string YYYY-MM-DD (Due Date)
}

export interface FinancialInsight {
  healthScore: number;
  analysis: string;
  tips: string[];
}

export const CATEGORIES = [
  'Salário',
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Investimentos',
  'Dívidas',
  'Outros'
];