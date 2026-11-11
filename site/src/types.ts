import { Language } from './constants';

export interface CadastroDraft {
  // Etapa 1
  academia: string;
  pais: 'BR' | 'PY';
  cidade: string;
  subdominio: string;
  usaDominioProprio: boolean;
  dominioProprio: string;
  // Etapa 2
  nome: string;
  email: string;
  whatsapp: string;
  termosAceitos: boolean;
}

export interface CadastroPayload {
  academia: string;
  pais: 'BR' | 'PY';
  cidade: string;
  subdominio: string;
  dominioProprio: string | null;
  nome: string;
  email: string;
  whatsapp: string;
  senha?: string;
  plano: 'assinatura';
  idioma: Language;
}

export type StatusType = 'aguardando_pagamento' | 'pago' | 'criando' | 'pronto' | 'erro';

export interface StatusResponse {
  status: StatusType;
  appUrl?: string;
  mensagem?: string;
  dominioProprio?: string | null;
}

export interface VerificarDominioResponse {
  conectado: boolean;
  mensagem: string;
}
