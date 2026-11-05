/**
 * Liga cada exercício do GymApp ao exercício equivalente no catálogo do openGym
 * (catalogue/exercises/<id>.json). Assim, um treino registrado pelo GymApp
 * aparece com o exercício certo também no app do próprio openGym.
 */
export const GYMAPP_TO_CATALOGUE: Record<string, string> = {
  'ex-bench-press': '0025',
  'ex-incline-dumbbell-press': '0314',
  'ex-cable-crossover': '0227',
  'ex-chest-fly-machine': '0596',
  'ex-pushup': '0662',
  'ex-dips-chest': '0251',
  'ex-lat-pulldown': '0198',
  'ex-seated-cable-row': '0861',
  'ex-barbell-row': '0027',
  'ex-pullup': '0652',
  'ex-dumbbell-row': '0292',
  'ex-straight-arm-pulldown': '0238',
  'ex-overhead-press': '0405',
  'ex-lateral-raise': '0334',
  'ex-front-raise-cable': '0162',
  'ex-face-pull': '5656',
  'ex-shrug': '0095',
  'ex-barbell-curl': '0447',
  'ex-hammer-curl': '0313',
  'ex-preacher-curl': '0592',
  'ex-incline-dumbbell-curl': '0318',
  'ex-triceps-rope-pushdown': '0200',
  'ex-skull-crusher': '5873',
  'ex-overhead-triceps-extension': '2188',
  'ex-close-grip-bench': '0030',
  'ex-squat': '0043',
  'ex-leg-press-45': '0739',
  'ex-leg-extension': '0585',
  'ex-bulgarian-split-squat': '0410',
  'ex-walking-lunges': '4295',
  'ex-lying-leg-curl': '0586',
  'ex-seated-leg-curl': '0599',
  'ex-romanian-deadlift': '0085',
  'ex-hip-thrust': '1060',
  'ex-cable-glute-kickback': '0860',
  'ex-standing-calf-raise': '0605',
  'ex-seated-calf-raise': '0594',
  'ex-cable-crunch': '0175',
  'ex-plank': '0463',
  'ex-hanging-leg-raise': '0472',
};

export const CATALOGUE_TO_GYMAPP: Record<string, string> = Object.fromEntries(
  Object.entries(GYMAPP_TO_CATALOGUE).map(([app, cat]) => [cat, app])
);

/** Id do GymApp → id do catálogo openGym (mantém o id se não houver equivalente). */
export const toCatalogueId = (appId: string): string => GYMAPP_TO_CATALOGUE[appId] ?? appId;

/** Id do catálogo openGym → id do GymApp (mantém o id se não houver equivalente). */
export const toAppId = (catalogueId: string): string => CATALOGUE_TO_GYMAPP[catalogueId] ?? catalogueId;
