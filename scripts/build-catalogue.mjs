#!/usr/bin/env node
/**
 * Gera public/catalogo/ a partir do catálogo do openGym (somente textos, nunca as mídias).
 *
 * Uso:  node scripts/build-catalogue.mjs /caminho/para/openGym/catalogue
 *
 * Saída (arquivos de DADOS separados do código do app, com a licença de origem):
 *   public/catalogo/indice.json          [id, nomePT, nomeES, músculo, equipamento, animação, secundários]
 *   public/catalogo/instrucoes/<n>.json  { id: { pt: [...], es: [...] } } em lotes de 200
 *   public/catalogo/LICENCA.txt          origem e licenças (AGPL-3.0 do openGym + MIT do ExerciseDB)
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
if (!SRC) {
  console.error('Informe a pasta catalogue do openGym');
  process.exit(1);
}
const OUT = path.resolve('public/catalogo');

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const pt = read(path.join(SRC, 'i18n/pt-BR.json'));
const es = read(path.join(SRC, 'i18n/es.json'));

const MUSCLE = {
  glutes: 'glutes', abductors: 'glutes',
  delts: 'shoulders', 'levator scapulae': 'shoulders',
  abs: 'abs', obliques: 'abs', 'hip flexors': 'abs',
  quads: 'quadriceps', adductors: 'quadriceps', 'cardiovascular system': 'quadriceps',
  pectorals: 'chest', 'serratus anterior': 'chest',
  'upper back': 'back', lats: 'back', spine: 'back', traps: 'back',
  biceps: 'biceps', forearms: 'biceps',
  triceps: 'triceps',
  hamstrings: 'hamstrings',
  calves: 'calves', shins: 'calves',
};
const SECONDARY = {
  shoulders: 'shoulders', triceps: 'triceps', biceps: 'biceps', glutes: 'glutes', hamstrings: 'hamstrings',
  quadriceps: 'quadriceps', quads: 'quadriceps', calves: 'calves', abs: 'abs', core: 'abs', obliques: 'abs',
  chest: 'chest', 'upper chest': 'chest', lats: 'back', 'upper back': 'back', 'lower back': 'back', traps: 'back',
  delts: 'shoulders', 'rear deltoids': 'shoulders', forearms: 'biceps',
};
const EQUIP = (e = '') => {
  if (/barbell|trap bar|smith/.test(e)) return 'barbell';
  if (/dumbbell|kettlebell/.test(e)) return 'dumbbell';
  if (/cable|band|rope/.test(e)) return 'cable';
  if (/machine|leverage|sled|assisted|ergometer|skierg|bike|stepmill|elliptical/.test(e)) return 'machine';
  return 'bodyweight';
};

// Equipamento detalhado → grupo que o dono da academia marca em "Equipamentos da academia"
// (mesmas chaves de src/services/inventory.ts)
const KIT = (e = '') => {
  if (/smith/.test(e)) return 'smith';
  if (/barbell|trap bar|landmine/.test(e)) return 'barbell';
  if (/kettlebell/.test(e)) return 'kettlebell';
  if (/dumbbell/.test(e)) return 'dumbbell';
  if (/cable|rope/.test(e)) return 'cable';
  if (/band/.test(e)) return 'band';
  if (/suspension/.test(e)) return 'suspension';
  if (/ergometer|skierg|bike|stepmill|elliptical/.test(e)) return 'cardio';
  if (/machine|leverage|sled|assisted/.test(e)) return 'machine';
  if (/stability ball|bosu|medicine ball/.test(e)) return 'ball';
  if (/weight plate|weighted|sandbag/.test(e)) return 'plate';
  if (/roller|massage ball/.test(e)) return 'mobility';
  if (/macebell|tire|hammer/.test(e)) return 'other';
  return 'bodyweight';
};

// Nome em inglês → animação (padrões de src/components/exercise/MovementAnimation.tsx)
const RULES = [
  [/plank|hollow hold|wall sit/, 'plank'],
  [/hip thrust|glute bridge|bridge/, 'hipthrust'],
  [/leg press/, 'legpress'],
  [/leg extension/, 'legext'],
  [/leg curl|hamstring curl|nordic/, 'legcurl'],
  [/calf|heel raise|toe raise/, 'calf'],
  [/kickback/, (e) => (e.target === 'triceps' ? 'pushdown' : 'kickback')],
  [/split squat|bulgarian/, 'split'],
  [/lunge|step[- ]?up/, 'lunge'],
  [/squat|sissy|pistol/, 'squat'],
  [/deadlift|good morning|romanian|stiff|hyperextension|back extension/, 'rdl'],
  [/skull|lying triceps|lying extension/, 'skull'],
  [/pushdown|pressdown|push down/, 'pushdown'],
  [/triceps extension|overhead extension|french press/, 'overheadext'],
  [/preacher|scott/, 'preacher'],
  [/curl/, (e) => (e.equipment && /barbell/.test(e.equipment) ? 'curl' : 'dbcurl')],
  [/face pull/, 'facepull'],
  [/shrug/, 'shrug'],
  [/lateral raise|front raise|side raise|y raise|rear delt raise|reverse fly/, (e) => (/cable|band/.test(e.equipment || '') ? 'cableraise' : 'raise')],
  [/fly|flye|crossover|pec deck/, 'fly'],
  [/push[- ]?up|press[- ]?up/, 'pushup'],
  [/dip/, 'dip'],
  [/incline.*press|incline bench/, 'incline'],
  [/bench press|floor press|chest press|decline press/, 'bench'],
  [/shoulder press|overhead press|military|arnold|push press|seated press/, 'ohp'],
  [/pull[- ]?up|chin[- ]?up|muscle up/, 'pullup'],
  [/straight arm|pullover/, 'straightpull'],
  [/pulldown|pull down|lat pull/, 'pulldown'],
  [/seated row|cable row|machine row|low row/, 'seatedrow'],
  [/one arm row|single arm row|dumbbell row|kroc/, 'dbrow'],
  [/row/, 'bentrow'],
  [/leg raise|knee raise|toes to bar|knee tuck/, 'legraise'],
  [/crunch|sit[- ]?up|v[- ]?up|jackknife|roll[- ]?out|twist|wood ?chop/, 'crunch'],
];
const BY_MUSCLE = {
  chest: 'bench', back: 'bentrow', shoulders: 'ohp', biceps: 'dbcurl', triceps: 'pushdown',
  quadriceps: 'squat', hamstrings: 'rdl', glutes: 'hipthrust', calves: 'calf', abs: 'crunch',
};

function patternFor(e, muscle) {
  const n = (e.name || '').toLowerCase();
  for (const [re, p] of RULES) if (re.test(n)) return typeof p === 'function' ? p(e) : p;
  return BY_MUSCLE[muscle] || 'squat';
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const index = [];
const instr = {};
for (const file of fs.readdirSync(path.join(SRC, 'exercises'))) {
  if (!file.endsWith('.json')) continue;
  const e = read(path.join(SRC, 'exercises', file));
  if (!e.name || !e.target || !pt[e.id]) continue; // pula variantes/aliases
  const muscle = MUSCLE[e.target] || 'abs';
  const secondary = [...new Set((e.secondaryMuscles || []).map((m) => SECONDARY[m]).filter((m) => m && m !== muscle))].slice(0, 3);
  const namePt = cap(pt[e.id]?.name || e.name);
  const nameEs = cap(es[e.id]?.name || namePt);
  index.push([e.id, namePt, nameEs, muscle, EQUIP(e.equipment), patternFor(e, muscle), secondary, KIT(e.equipment)]);
  instr[e.id] = { pt: pt[e.id]?.instructions || [], es: es[e.id]?.instructions || pt[e.id]?.instructions || [] };
}
index.sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'instrucoes'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'indice.json'), JSON.stringify(index));

// Lotes de instruções pelo número do id (o app sabe em qual lote procurar)
const buckets = {};
for (const id of Object.keys(instr)) {
  const b = Math.floor(parseInt(id, 10) / 200);
  (buckets[b] ||= {})[id] = instr[id];
}
for (const [b, data] of Object.entries(buckets)) fs.writeFileSync(path.join(OUT, 'instrucoes', `${b}.json`), JSON.stringify(data));

fs.writeFileSync(
  path.join(OUT, 'LICENCA.txt'),
  `Catálogo de exercícios (somente textos: nomes, músculos e instruções)

Origem: openGym — https://github.com/DuarteSantos8/openGym (pasta catalogue/, versão v1.4.4)
Licença: GNU AGPL-3.0 (https://www.gnu.org/licenses/agpl-3.0.html) para descrições, traduções
e exercícios novos do openGym. Os nomes, músculos e instruções originais das entradas vindas do
ExerciseDB v1 (AscendAPI), via hasaneyldrm/exercises-dataset, são MIT
(Copyright (c) 2026 Hasan Emir Yıldírım).

Estes arquivos são dados separados, convertidos de formato (campos reduzidos, idiomas pt-BR e es),
sem alteração do conteúdo. A fonte completa está no repositório acima.
NÃO inclui as imagens/animações do openGym (licenciadas pela Gym visual).
`
);

const animCount = index.reduce((m, r) => ((m[r[5]] = (m[r[5]] || 0) + 1), m), {});
console.log(`exercícios: ${index.length} · lotes de instruções: ${Object.keys(buckets).length}`);
console.log('animações:', animCount);
