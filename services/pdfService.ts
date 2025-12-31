import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, TransactionType, TransactionStatus } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
};

export const generateFinancialPDF = (transactions: Transaction[], periodLabel: string) => {
  const doc = new jsPDF();
  
  // -- Header --
  doc.setFillColor(14, 165, 233); // Brand Blue
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("FinFlow AI", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("Demonstrativo Financeiro", 14, 28);
  
  doc.setFontSize(10);
  doc.text(`Período: ${periodLabel}`, 195, 20, { align: 'right' });
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 195, 28, { align: 'right' });

  // -- Summary Calculation --
  const income = transactions
    .filter(t => t.type === TransactionType.INCOME && t.status === TransactionStatus.COMPLETED)
    .reduce((acc, t) => acc + t.amount, 0);
    
  const expense = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.status === TransactionStatus.COMPLETED)
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingIncome = transactions
    .filter(t => t.type === TransactionType.INCOME && t.status === TransactionStatus.PENDING)
    .reduce((acc, t) => acc + t.amount, 0);
    
  const pendingExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.status === TransactionStatus.PENDING)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  // -- Summary Section --
  let yPos = 55;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Resumo do Período", 14, yPos);
  
  yPos += 10;
  
  // Draw summary boxes
  const drawSummaryBox = (x: number, title: string, value: number, subtext: string, color: [number, number, number]) => {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, yPos, 55, 25, 2, 2, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(title, x + 5, yPos + 8);
    
    doc.setFontSize(12);
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(value), x + 5, yPos + 16);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(subtext, x + 5, yPos + 21);
  };

  drawSummaryBox(14, "Receitas (Realizadas)", income, `+ ${formatCurrency(pendingIncome)} previsto`, [34, 197, 94]);
  drawSummaryBox(77, "Despesas (Pagas)", expense, `+ ${formatCurrency(pendingExpense)} previsto`, [244, 63, 94]);
  drawSummaryBox(140, "Saldo (Real)", balance, "Considera apenas realizado", balance >= 0 ? [34, 197, 94] : [244, 63, 94]);

  // -- Transactions Table --
  
  // Sort by date descending
  const sortedTrans = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tableData = sortedTrans.map(t => [
    formatDate(t.date),
    t.description,
    t.category,
    t.type === TransactionType.INCOME ? 'Receita' : 'Despesa',
    t.status === TransactionStatus.COMPLETED ? (t.type === TransactionType.INCOME ? 'Recebido' : 'Pago') : 'Pendente',
    formatCurrency(t.amount)
  ]);

  autoTable(doc, {
    startY: yPos + 35,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' }, // Descricao gets remaining space
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 5) {
        const rawRow = sortedTrans[data.row.index];
        if (rawRow.type === TransactionType.EXPENSE) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        } else {
            data.cell.styles.textColor = [22, 163, 74]; // Green
        }
      }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text('FinFlow AI - Gerenciamento Inteligente', 14, 287);
    doc.text(`Página ${i} de ${pageCount}`, 195, 287, { align: 'right' });
  }

  doc.save(`Extrato_FinFlow_${periodLabel.replace(/\s/g, '_')}.pdf`);
};