import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialInsight, TransactionType } from "../types.ts";

export const generateFinancialAdvice = async (transactions: Transaction[]): Promise<FinancialInsight> => {
  const apiKey = process.env.API_KEY || "";
  
  if (!apiKey) {
    return {
      healthScore: 0,
      analysis: "Configure sua API_KEY para ativar a inteligência artificial.",
      tips: ["Obtenha sua chave no Google AI Studio."]
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const summary = transactions.map(t => 
    `${t.date}: ${t.type} de R$${t.amount} em ${t.category} (${t.status})`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estas finanças e retorne um JSON com healthScore (0-100), analysis (resumo) e tips (3 dicas):\n\n${summary}`,
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

    return JSON.parse(response.text || "{}") as FinancialInsight;
  } catch (error) {
    console.error("Gemini Error:", error);
    return { healthScore: 0, analysis: "Erro ao conectar com a IA.", tips: [] };
  }
};