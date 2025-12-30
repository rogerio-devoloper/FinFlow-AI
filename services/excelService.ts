import * as XLSX from 'xlsx';
import { Transaction, TransactionStatus, TransactionType } from '../types';

// Headers mapping for user friendly Excel columns
const HEADERS = {
  ID: 'ID (Não alterar)',
  DESC: 'Descrição',
  AMOUNT: 'Valor',
  TYPE: 'Tipo (Receita/Despesa)',
  CATEGORY: 'Categoria',
  DATE: 'Data (AAAA-MM-DD)',
  DUE_DATE: 'Vencimento (AAAA-MM-DD)',
  STATUS: 'Status (Pago/Pendente)'
};

export const exportToExcel = (transactions: Transaction[]) => {
  // 1. Format data for Excel
  const data = transactions.map(t => ({
    [HEADERS.ID]: t.id,
    [HEADERS.DESC]: t.description,
    [HEADERS.AMOUNT]: t.amount,
    [HEADERS.TYPE]: t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
    [HEADERS.CATEGORY]: t.category,
    [HEADERS.DATE]: t.date,
    [HEADERS.DUE_DATE]: t.dueDate || '',
    [HEADERS.STATUS]: t.status === TransactionStatus.COMPLETED ? 'Pago/Recebido' : 'Pendente'
  }));

  // 2. Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // 3. Create workbook and append worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Finanças");

  // 4. Download file
  XLSX.writeFile(wb, `FinFlow_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const importFromExcel = async (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert back to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Map back to Transaction type
        const transactions: Transaction[] = jsonData.map((row: any) => {
          // Detect type
          let type = TransactionType.EXPENSE;
          const typeStr = (row[HEADERS.TYPE] || '').toString().toUpperCase();
          if (typeStr.includes('RECEITA') || typeStr.includes('INCOME')) type = TransactionType.INCOME;

          // Detect status
          let status = TransactionStatus.PENDING;
          const statusStr = (row[HEADERS.STATUS] || '').toString().toUpperCase();
          if (statusStr.includes('PAGO') || statusStr.includes('RECEBIDO') || statusStr.includes('COMPLETED')) status = TransactionStatus.COMPLETED;

          // Validate amount
          const amount = parseFloat(row[HEADERS.AMOUNT]);
          if (isNaN(amount)) throw new Error(`Valor inválido na linha: ${JSON.stringify(row)}`);

          return {
            id: row[HEADERS.ID] || crypto.randomUUID(), // Preserve ID if exists, else create new
            description: row[HEADERS.DESC] || 'Sem descrição',
            amount: Math.abs(amount),
            type,
            category: row[HEADERS.CATEGORY] || 'Outros',
            date: row[HEADERS.DATE] || new Date().toISOString().split('T')[0],
            dueDate: row[HEADERS.DUE_DATE] || undefined,
            status
          };
        });

        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};