/**
 * Constantes do site de vendas. Os valores podem ser trocados sem mexer no código,
 * pelas variáveis de ambiente VITE_* (no Cloudflare: Settings → Variables and Secrets → Build).
 */
const env = import.meta.env;

export const PRODUCT_NAME: string = env.VITE_PRODUCT_NAME || 'GymApp';

// Domínio base: cada academia ganha nomedaacademia.BASE_DOMAIN; domínio próprio aponta CNAME para CNAME_TARGET
export const BASE_DOMAIN: string = env.VITE_BASE_DOMAIN || 'SEU-DOMINIO.com';
export const CNAME_TARGET: string = env.VITE_CNAME_TARGET || `academias.${BASE_DOMAIN}`;

// Preços Brasil (pt-BR)
export const PRECO_ASSINATURA_BR = 'R$ 350';
export const PRECO_LICENCA_BR = 'R$ 17.997';

// Preços Paraguai (es-PY)
export const PRECO_ASSINATURA_PY = 'Gs. 550.000';
export const PRECO_LICENCA_PY = 'Gs. 28.000.000';
export const CUSTO_SERVIDOR_PY = 'Gs. 50.000 a Gs. 90.000/mes';

// Links e contatos
export const WHATSAPP_NUMBER: string = env.VITE_WHATSAPP || '5511999999999';
export const DEMO_URL: string = env.VITE_DEMO_URL || 'https://SEU-LINK-DA-DEMO/demo';
export const SUPPORT_EMAIL: string = env.VITE_SUPPORT_EMAIL || 'contato@gymapp.com';

export type Language = 'pt-BR' | 'es-PY';
