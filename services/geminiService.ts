import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight, TransactionType } from "../types";

export const generateFinancialAdvice = async (transactions: Transaction[]): Promise<FinancialInsight> => {
  // Acesso seguro ao process.env
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  
  if (!apiKey) {
    return {
      healthScore: 0,
      analysis: "Chave API não configurada no ambiente.",
      tips: ["Configure a API_KEY para usar o Consultor IA."]
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const summary = transactions.map(t => 
    `${t.date} (${t.status}): ${t.type} de R$${t.amount} em ${t.category} - ${t.description}${t.dueDate ? ` [Vencimento: ${t.dueDate}]` : ''}`
  ).join('\n');

  const prompt = `
    Atue como um especialista financeiro pessoal.
    Analise as transações abaixo (incluindo status PENDING/COMPLETED, datas de pagamento e vencimento).
    
    Transações:
    ${summary}

    Considere:
    1. Saldo real (apenas COMPLETED).
    2. Fluxo de caixa futuro (PENDING).
    3. Contas em atraso (PENDING onde Data de Vencimento < Hoje).

    Retorne JSON com:
    - healthScore (0-100)
    - analysis (resumo curto)
    - tips (3 dicas)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["healthScore", "analysis", "tips"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as FinancialInsight;

  } catch (error) {
    console.error("Error Gemini:", error);
    return {
      healthScore: 0,
      analysis: "Erro ao analisar dados com a IA.",
      tips: ["Verifique sua conexão."]
    };
  }
};