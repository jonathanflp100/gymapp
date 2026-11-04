/**
 * Traduções dos DADOS DE DEMONSTRAÇÃO (mockData) para es-PY.
 *
 * As telas já são traduzidas via i18n. Os textos livres dos dados (nomes de
 * treinos, observações, nomes de pessoas) são escritos em português no mock,
 * então esta tabela troca cada texto exato pela versão em espanhol quando o
 * idioma ativo é es-PY.
 *
 * Quando o app for ligado ao backend real, isto deixa de ser usado: no produto
 * real, o professor escreve as fichas no idioma da própria academia.
 */
import { MOCK_EXERCISES } from './mockData';

const BASE_TEXT_ES: Record<string, string> = {
  // Pessoas
  'Carlos Oliveira': 'Carlos Giménez',
  'Gabriela Santos': 'Gabriela Ortiz',
  'Lucas Ferreira': 'Lucas Fernández',
  'Beatriz Souza': 'Belén Sosa',
  'Rodrigo Lima': 'Rodrigo Ayala',
  'Camila Mendes': 'Camila Rojas',
  'Prof. Marcos Silva': 'Prof. Marcos Villalba',
  'Biomecânica & Hipertrofia Avançada': 'Biomecánica e Hipertrofia Avanzada',
  Mensal: 'Mensual',

  // Rotinas
  'Treino A - Peito, Ombros & Tríceps (Push)': 'Rutina A - Pecho, Hombros y Tríceps (Empuje)',
  'Foco em hipertrofia de empurrar, ativação escapular e progressão de carga.':
    'Enfoque en hipertrofia de empuje, activación escapular y progresión de carga.',
  'Treino B - Costas, Posterior & Bíceps (Pull)': 'Rutina B - Espalda, Posterior y Bíceps (Tirón)',
  'Construção de densidade dorsal e força de puxada.': 'Desarrollo de densidad dorsal y fuerza de tirón.',
  'Treino C - Membros Inferiores Completo (Legs)': 'Rutina C - Tren Inferior Completo (Piernas)',
  'Quadríceps, glúteos e panturrilha com alto estímulo metabólico.':
    'Cuádriceps, glúteos y pantorrillas con alto estímulo metabólico.',

  // Nomes de rotina no histórico
  'Treino A - Peito, Ombros & Tríceps': 'Rutina A - Pecho, Hombros y Tríceps',
  'Treino B - Costas e Bíceps': 'Rutina B - Espalda y Bíceps',
  'Treino C - Membros Inferiores': 'Rutina C - Tren Inferior',

  // Observações dos exercícios
  'Aquecer 2 séries com barra vazia antes de colocar a carga principal.':
    'Calentar 2 series con la barra vacía antes de poner la carga principal.',
  'Amplitude total sem deixar os cotovelos passarem de 90° para baixo.':
    'Rango completo sin dejar que los codos bajen de 90°.',
  'Manter abdômen contraído durante todo o movimento.': 'Mantener el abdomen contraído durante todo el movimiento.',
  'Pausa isométrica de 1 segundo no topo.': 'Pausa isométrica de 1 segundo arriba.',
  'Abrir a corda no final da extensão.': 'Abrir la cuerda al final de la extensión.',
  'Concentrar a tração nos cotovelos.': 'Concentrar el tirón en los codos.',
  'Coluna firme, puxar na linha do umbigo.': 'Columna firme, tirar a la altura del ombligo.',
  'Sem balançar o tronco.': 'Sin balancear el tronco.',
  'Descer com segurança e estabilidade.': 'Bajar con seguridad y estabilidad.',
  'Excelente sensação de força no supino.': 'Excelente sensación de fuerza en el press de banca.',
};

// Nomes de exercícios usados no histórico e nos recordes vêm dos exercícios bilíngues.
const EXERCISE_NAMES_ES: Record<string, string> = Object.fromEntries(
  MOCK_EXERCISES.map((ex) => [ex.name['pt-BR'], ex.name['es-PY']])
);

export const DEMO_TEXT_ES: Record<string, string> = { ...EXERCISE_NAMES_ES, ...BASE_TEXT_ES };

/** Percorre o objeto e troca todo texto que tiver tradução. Retorna uma cópia. */
export function localizeDemoData<T>(value: T): T {
  if (typeof value === 'string') {
    return (DEMO_TEXT_ES[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => localizeDemoData(item)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = localizeDemoData(v);
    }
    return out as T;
  }
  return value;
}
