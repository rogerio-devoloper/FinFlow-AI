/**
 * Formata um número para o padrão de moeda brasileiro (BRL).
 * Exemplo: 1000.5 -> R$ 1.000,50
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
