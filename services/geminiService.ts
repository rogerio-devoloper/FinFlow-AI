import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight, TransactionType } from "../types";

export const generateFinancialAdvice = async (transactions: Transaction[]): Promise<FinancialInsight> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare data for the model
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
    3. Contas em atraso (PENDING onde Data de Vencimento < Hoje). Se houver, alerte com urgência.

    Retorne JSON com:
    - healthScore (0-100)
    - analysis (resumo curto da situação e alertas de atraso se houver)
    - tips (3 dicas práticas)
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
            healthScore: {
              type: Type.NUMBER,
              description: "Pontuação de saúde financeira."
            },
            analysis: {
              type: Type.STRING,
              description: "Análise concisa."
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 dicas."
            }
          },
          required: ["healthScore", "analysis", "tips"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as FinancialInsight;

  } catch (error) {
    console.error("Error calling Gemini:", error);
    return {
      healthScore: 0,
      analysis: "Erro ao analisar. Verifique sua chave API.",
      tips: ["Tente novamente."]
    };
  }
};