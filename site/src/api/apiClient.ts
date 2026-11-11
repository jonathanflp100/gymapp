import { BASE_DOMAIN } from '../constants';
import { CadastroPayload, StatusResponse, VerificarDominioResponse } from '../types';

export async function checkSubdomainAvailability(nome: string, isTest: boolean): Promise<boolean> {
  const clean = nome.toLowerCase().trim();
  if (clean.length < 3 || clean.length > 30) {
    return false;
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) {
    return false;
  }
  // Subdomínio 'demo' sempre indisponível conforme especificação
  if (clean === 'demo') {
    return false;
  }

  if (!isTest) {
    try {
      const res = await fetch(`/api/cadastro/subdominio?nome=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        return !!data.disponivel;
      }
    } catch (err) {
      // sem conexão com o servidor de cadastro
    }
    return false;
  }

  // Modo de teste (?teste=1): simula a verificação
  const reservados = ['demo', 'admin', 'app', 'api', 'root', 'suporte', 'staging', 'mail'];
  return !reservados.includes(clean);
}

export async function submitCadastro(
  payload: CadastroPayload,
  isTest: boolean
): Promise<{ checkoutUrl?: string; erro?: string; cadastroId?: string }> {
  // Modo de teste (?teste=1): simula o cadastro sem cobrar nada
  if (isTest) {
    const fakeId = 'CAD-' + Math.floor(100000 + Math.random() * 900000);
    try {
      sessionStorage.setItem(`cadastro_${fakeId}`, JSON.stringify({ ...payload, senha: undefined, createdAt: Date.now() }));
    } catch (e) {}
    return { checkoutUrl: `/bem-vindo?cadastro=${fakeId}&teste=1`, cadastroId: fakeId };
  }

  try {
    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { erro: data.erro || 'Não foi possível processar o cadastro.' };
    }
    return data;
  } catch (err) {
    // Nunca finge sucesso: sem servidor, o cadastro não foi feito
    return {
      erro:
        payload.idioma === 'es-PY'
          ? 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos o hablá con nosotros por WhatsApp.'
          : 'Não conseguimos falar com o servidor. Tente de novo em alguns minutos ou fale com a gente pelo WhatsApp.',
    };
  }
}

export async function fetchCadastroStatus(
  id: string,
  isTest: boolean,
  pollCount: number
): Promise<StatusResponse> {
  if (!isTest) {
    try {
      const res = await fetch(`/api/cadastro/status?id=${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch (err) {
      // sem conexão: tenta de novo na próxima consulta
    }
    return { status: 'aguardando_pagamento' };
  }

  // Tenta recuperar dados do rascunho
  let savedSubdomain = 'minha-academia';
  let savedDominioProprio: string | null = null;
  try {
    const raw = sessionStorage.getItem(`cadastro_${id}`) || sessionStorage.getItem('gymapp_cadastro_draft');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.subdominio) savedSubdomain = parsed.subdominio;
      if (parsed.dominioProprio) savedDominioProprio = parsed.dominioProprio;
    }
  } catch (e) {}

  // Simulação a cada 3 segundos: pago -> criando -> pronto
  if (pollCount <= 0) {
    return { status: 'pago' };
  } else if (pollCount === 1) {
    return { status: 'criando' };
  } else {
    return {
      status: 'pronto',
      appUrl: `https://${savedSubdomain}.${BASE_DOMAIN}`,
      dominioProprio: savedDominioProprio,
    };
  }
}

export async function verifyDomainConnection(
  id: string,
  attempt: number,
  isTest = false
): Promise<VerificarDominioResponse> {
  if (!isTest) {
    try {
      const res = await fetch(`/api/dominio/verificar?id=${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch (err) {
      // sem conexão
    }
    return { conectado: false, mensagem: 'Ainda não conseguimos verificar. Tente de novo em alguns minutos.' };
  }

  // Simulação: na 2ª tentativa confirma conexão
  if (attempt >= 1) {
    return {
      conectado: true,
      mensagem: 'Domínio conectado e certificado SSL ativo!',
    };
  } else {
    return {
      conectado: false,
      mensagem: 'Pode levar até algumas horas para o domínio propagar.',
    };
  }
}

/** O servidor de cadastro está respondendo? (no Cloudflare sem backend, /api devolve a página HTML) */
export async function cadastroOnline(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('/api/cadastro/subdominio?nome=verificacao', { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok && (res.headers.get('content-type') || '').includes('application/json');
  } catch {
    return false;
  }
}
