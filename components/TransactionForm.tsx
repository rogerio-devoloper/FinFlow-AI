import React, { useState, useEffect } from 'react';
import { CATEGORIES, Transaction, TransactionType, TransactionStatus } from '../types.ts';
import { PlusCircle, X, CheckCircle2, Save } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transaction: Transaction) => void;
  onClose: () => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onClose, initialData }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setDate(initialData.date);
      setDueDate(initialData.dueDate || '');
      setIsCompleted(initialData.status === TransactionStatus.COMPLETED);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    const newTransaction: Transaction = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
      dueDate: dueDate || undefined,
      status: isCompleted ? TransactionStatus.COMPLETED : TransactionStatus.PENDING
    };

    onAdd(newTransaction);
    onClose();
  };

  const getDateLabel = () => {
    if (isCompleted) {
      return type === TransactionType.INCOME ? 'Data do Recebimento' : 'Data do Pagamento';
    }
    return 'Data de Lançamento';
  };

  const getDueDateLabel = () => {
    return type === TransactionType.INCOME ? 'Previsão Recebimento' : 'Vencimento';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in transition-colors duration-300">
        <div className="flex justify-between items-center p-6 border-b border-dark-border">
          <h3 className="text-xl font-semibold text-dark-text">
            {initialData ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h3>
          <button onClick={onClose} className="text-dark-muted hover:text-dark-text transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex bg-dark-input p-1 rounded-lg border border-dark-border">
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === TransactionType.INCOME 
                  ? 'bg-emerald-600 text-white shadow' 
                  : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === TransactionType.EXPENSE 
                  ? 'bg-rose-600 text-white shadow' 
                  : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              Despesa
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-muted mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-dark-input border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder={type === TransactionType.INCOME ? "Ex: Salário, Freela..." : "Ex: Aluguel, Internet..."}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-dark-input border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-input border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">{getDateLabel()}</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-dark-input border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:[color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">{getDueDateLabel()}</label>
              <input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-dark-input border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div 
            className="flex items-center gap-3 p-3 rounded-lg border border-dark-border bg-dark-hover/50 cursor-pointer hover:bg-dark-hover transition-colors"
            onClick={() => setIsCompleted(!isCompleted)}
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isCompleted ? 'bg-brand-500 border-brand-500' : 'border-dark-muted'}`}>
                {isCompleted && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-dark-text">
                    {type === TransactionType.INCOME ? 'Recebido' : 'Pago'}
                </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all mt-4"
          >
            {initialData ? <Save size={20} /> : <PlusCircle size={20} />}
            {initialData ? 'Salvar Alterações' : isCompleted ? 'Adicionar' : 'Agendar'}
          </button>
        </form>
      </div>
    </div>
  );
};