import type { Settings } from './types';

// Cotação de referência: R$ 1 = Gs. 1.171,36 (06/11/2026). Ajuste em Configurações.
export const DEFAULT_SETTINGS: Settings = {
  companyName: 'GymApp',
  fxPygPerBrl: 1171.36,
  cashBrl: 18000,
  geminiModel: 'gemini-3.8-flash',
};
