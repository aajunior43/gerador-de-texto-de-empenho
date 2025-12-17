import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateEmpenhoDescription = async (file: File): Promise<string> => {
  try {
    const filePart = await fileToGenerativePart(file);

    const prompt = `
      Analise o documento anexo (pode ser uma fatura, contrato, ordem de serviço, ou requisição).
      O seu objetivo é gerar o texto da "Descrição" para uma Nota de Empenho (NE) do setor público.
      
      Regras Estritas:
      1. A saída deve estar EXCLUSIVAMENTE em CAIXA ALTA (letras maiúsculas).
      2. O texto deve começar OBRIGATORIAMENTE com a frase exata: "PELA DESPESA EMPENHADA REFERENTE A".
      3. Identifique o objeto da despesa de forma sucinta mas completa (ex: aquisição de material de consumo, prestação de serviço de limpeza, etc).
      4. Se houver número de processo, pregão, contrato ou nota fiscal visível, inclua-os no texto.
      5. Não use markdown, apenas texto puro.
      
      Exemplo de formato esperado:
      "PELA DESPESA EMPENHADA REFERENTE A AQUISIÇÃO DE MATERIAIS DE ESCRITÓRIO PARA ATENDER AS NECESSIDADES DA SECRETARIA MUNICIPAL DE SAÚDE, CONFORME PREGÃO ELETRÔNICO N. 12/2024 E CONTRATO N. 05/2024."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          filePart,
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.2, // Low temperature for more deterministic/factual output
      }
    });

    let text = response.text || "";
    
    // Fallback enforcement of rules in case the model hallucinates casing or prefix
    text = text.toUpperCase().trim();
    
    // Clean up potential markdown bolding or unexpected chars
    text = text.replace(/\*\*/g, '').replace(/\*/g, '');

    const requiredPrefix = "PELA DESPESA EMPENHADA";
    if (!text.startsWith(requiredPrefix)) {
      // If it missed the prefix, try to fix it naturally or just prepend
      // Check if it starts with "REFERENTE", if so, just add the first part
      if (text.startsWith("REFERENTE")) {
        text = "PELA DESPESA EMPENHADA " + text;
      } else {
         text = `${requiredPrefix} REFERENTE A ${text}`;
      }
    }

    return text;
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Falha ao processar o documento. Verifique se o arquivo é válido e tente novamente.");
  }
};