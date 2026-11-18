// Chat opcional com o Gemini. A chave fica só neste navegador e a conversa vai direto para o Google.
// O que é enviado: um resumo com números do negócio (sem nomes, telefones ou dados de alunos).

const KEY = 'gymadmin.geminiKey';

export const getGeminiKey = () => {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
};
export const setGeminiKey = (k: string) => {
  try {
    if (k) localStorage.setItem(KEY, k.trim());
    else localStorage.removeItem(KEY);
  } catch {}
};

export interface ChatMsg {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM = `Você é o assistente financeiro do dono do GymApp, um app white-label para academias vendido no Brasil (R$) e no Paraguai (guaranis).
Responda em português do Brasil, direto e prático, como um CFO experiente falando com um empreendedor solo.
Use SOMENTE os números do resumo abaixo; se faltar um dado, diga o que falta em vez de inventar.
Valores em reais (BRL). Quando sugerir algo, diga o impacto esperado em número sempre que possível.
Respostas curtas (até ~200 palavras), com no máximo 5 tópicos.`;

export async function askGemini(model: string, history: ChatMsg[], summary: string, signal?: AbortSignal): Promise<string> {
  const key = getGeminiKey();
  if (!key) throw new Error('Cole a sua chave do Gemini para usar o chat.');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${SYSTEM}\n\nRESUMO DO NEGÓCIO (JSON):\n${summary}` }] },
      contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `erro ${res.status}`;
    if (res.status === 400 && /API key/i.test(msg)) throw new Error('Chave do Gemini inválida.');
    if (res.status === 404) throw new Error(`O modelo "${model}" não foi encontrado. Troque o nome do modelo em Configurações.`);
    if (res.status === 429) throw new Error('Limite do plano gratuito do Gemini atingido. Tente de novo em alguns minutos.');
    throw new Error(msg);
  }
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text || '').join('').trim();
  if (!text) throw new Error('O Gemini não devolveu resposta. Tente perguntar de outro jeito.');
  return text;
}
