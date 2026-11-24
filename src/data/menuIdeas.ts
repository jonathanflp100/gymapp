// Ideias de cardápio (sugestões GERAIS de alimentação, não são dieta individual nem prescrição).
// Comida do dia a dia do Brasil e do Paraguai. Porções em medidas caseiras, sem contagem de calorias.

export type MenuGoal = 'gain' | 'lose';
type Bi = { 'pt-BR': string; 'es-PY': string };

export interface MenuIdea {
  id: string;
  goal: MenuGoal;
  title: Bi;
  tags: Bi[];
  breakfast: Bi;
  lunch: Bi;
  snack: Bi;
  dinner: Bi;
}

const b = (pt: string, es: string): Bi => ({ 'pt-BR': pt, 'es-PY': es });

const T = {
  protein: b('Rico em proteína', 'Rico en proteína'),
  quick: b('Rápido de fazer', 'Rápido de preparar'),
  budget: b('Econômico', 'Económico'),
  veg: b('Sem carne', 'Sin carne'),
  light: b('Leve', 'Liviano'),
  fiber: b('Rico em fibras', 'Rico en fibras'),
  regional: b('Regional', 'Regional'),
  preworkout: b('Bom antes do treino', 'Bueno antes de entrenar'),
};

export const MENU_IDEAS: MenuIdea[] = [
  // ------------------------------------------------------------------ ganhar massa (hipertrofia)
  {
    id: 'g1', goal: 'gain', title: b('Clássico do treino', 'Clásico del gimnasio'), tags: [T.protein, T.budget],
    breakfast: b('3 ovos mexidos, 2 fatias de pão integral, 1 banana e café com leite', '3 huevos revueltos, 2 rebanadas de pan integral, 1 banana y cocido con leche'),
    lunch: b('Arroz, feijão, 1 filé grande de frango grelhado e salada à vontade', 'Arroz, porotos, 1 filete grande de pollo a la plancha y ensalada libre'),
    snack: b('Iogurte natural com aveia e mel', 'Yogur natural con avena y miel'),
    dinner: b('Macarrão com carne moída ao molho de tomate e legumes', 'Fideos con carne molida en salsa de tomate y verduras'),
  },
  {
    id: 'g2', goal: 'gain', title: b('Tapioca power', 'Tapioca con todo'), tags: [T.protein, T.preworkout],
    breakfast: b('Tapioca com 2 ovos e queijo branco, mais 1 copo de leite', 'Tapioca con 2 huevos y queso fresco, más 1 vaso de leche'),
    lunch: b('Arroz, lentilha, carne de panela magra e abóbora', 'Arroz, lentejas, carne magra a la olla y zapallo'),
    snack: b('Vitamina de banana com aveia e pasta de amendoim', 'Licuado de banana con avena y pasta de maní'),
    dinner: b('Omelete de 3 ovos com legumes, arroz e salada', 'Omelet de 3 huevos con verduras, arroz y ensalada'),
  },
  {
    id: 'g3', goal: 'gain', title: b('Mandioca e carne', 'Mandi\'o y carne'), tags: [T.regional, T.protein],
    breakfast: b('Cuscuz com ovo e queijo, café com leite', 'Cocido con leche, 2 chipas pequeñas y 2 huevos duros'),
    lunch: b('Mandioca cozida, bife acebolado, feijão e salada de tomate', 'Mandi\'o hervida, bife con cebolla, porotos y ensalada de tomate'),
    snack: b('Sanduíche de pão integral com frango desfiado', 'Sándwich de pan integral con pollo desmenuzado'),
    dinner: b('Arroz, peixe assado e legumes cozidos', 'Arroz, pescado al horno y verduras hervidas'),
  },
  {
    id: 'g4', goal: 'gain', title: b('Frango com batata-doce', 'Pollo con batata'), tags: [T.protein, T.preworkout],
    breakfast: b('Pão francês com ovo e queijo, 1 fruta e café com leite', 'Pan con huevo y queso, 1 fruta y cocido con leche'),
    lunch: b('Batata-doce, frango grelhado, brócolis e arroz', 'Batata dulce, pollo a la plancha, brócoli y arroz'),
    snack: b('Banana com aveia e 1 copo de leite', 'Banana con avena y 1 vaso de leche'),
    dinner: b('Wrap de frango com queijo e salada', 'Wrap de pollo con queso y ensalada'),
  },
  {
    id: 'g5', goal: 'gain', title: b('Prato feito reforçado', 'Plato del día reforzado'), tags: [T.budget],
    breakfast: b('Mingau de aveia com leite, banana e canela', 'Avena cocida con leche, banana y canela'),
    lunch: b('Arroz, feijão, ovo frito, carne moída e salada', 'Arroz, porotos, huevo frito, carne molida y ensalada'),
    snack: b('Pão com pasta de amendoim e 1 fruta', 'Pan con pasta de maní y 1 fruta'),
    dinner: b('Sopa de legumes com carne e macarrão', 'Sopa de verduras con carne y fideos'),
  },
  {
    id: 'g6', goal: 'gain', title: b('Peixe e arroz', 'Pescado y arroz'), tags: [T.protein],
    breakfast: b('2 ovos cozidos, pão integral com requeijão e suco natural', '2 huevos duros, pan integral con queso crema y jugo natural'),
    lunch: b('Arroz, filé de tilápia, purê de batata e salada', 'Arroz, filete de tilapia, puré de papa y ensalada'),
    snack: b('Iogurte com granola e 1 fruta', 'Yogur con granola y 1 fruta'),
    dinner: b('Macarrão integral com frango e molho de tomate', 'Fideos integrales con pollo y salsa de tomate'),
  },
  {
    id: 'g7', goal: 'gain', title: b('Vori vori de domingo', 'Vori vori de domingo'), tags: [T.regional],
    breakfast: b('Cuscuz com ovos mexidos e café com leite', 'Cocido con leche, pan y 2 huevos revueltos'),
    lunch: b('Sopa de frango com bolinhas de milho (vori vori) e salada', 'Vori vori de pollo y ensalada'),
    snack: b('Vitamina de mamão com aveia', 'Licuado de papaya con avena'),
    dinner: b('Arroz, carne assada magra e mandioca', 'Arroz, carne asada magra y mandi\'o'),
  },
  {
    id: 'g8', goal: 'gain', title: b('Sem carne, com proteína', 'Sin carne, con proteína'), tags: [T.veg, T.protein],
    breakfast: b('Omelete de 3 ovos com queijo, pão e fruta', 'Omelet de 3 huevos con queso, pan y fruta'),
    lunch: b('Arroz, feijão, grão-de-bico refogado e legumes', 'Arroz, porotos, garbanzos salteados y verduras'),
    snack: b('Iogurte, aveia e pasta de amendoim', 'Yogur, avena y pasta de maní'),
    dinner: b('Lentilha com arroz, ovo cozido e salada', 'Lentejas con arroz, huevo duro y ensalada'),
  },
  {
    id: 'g9', goal: 'gain', title: b('Rápido pra quem trabalha', 'Rápido para quien trabaja'), tags: [T.quick],
    breakfast: b('Sanduíche de pão integral com ovo e queijo, 1 banana', 'Sándwich de pan integral con huevo y queso, 1 banana'),
    lunch: b('Marmita: arroz, frango desfiado, feijão e cenoura', 'Vianda: arroz, pollo desmenuzado, porotos y zanahoria'),
    snack: b('Leite com aveia e 1 fruta', 'Leche con avena y 1 fruta'),
    dinner: b('Omelete com sobras de frango e arroz', 'Omelet con sobras de pollo y arroz'),
  },
  {
    id: 'g10', goal: 'gain', title: b('Carne com aipim', 'Asado liviano con mandi\'o'), tags: [T.regional, T.protein],
    breakfast: b('Tapioca com frango e queijo, café com leite', 'Mbejú pequeño, cocido con leche y 1 fruta'),
    lunch: b('Carne magra assada, mandioca, arroz e vinagrete', 'Carne magra asada, mandi\'o, arroz y ensalada criolla'),
    snack: b('Sanduíche de queijo branco e 1 fruta', 'Sándwich de queso fresco y 1 fruta'),
    dinner: b('Sopa de legumes com frango e batata', 'Sopa de verduras con pollo y papa'),
  },
  {
    id: 'g11', goal: 'gain', title: b('Café da manhã reforçado', 'Desayuno reforzado'), tags: [T.preworkout],
    breakfast: b('Panqueca de banana com aveia e 2 ovos, mel por cima', 'Panqueque de banana con avena y 2 huevos, con miel'),
    lunch: b('Arroz, feijão, frango ao molho e salada', 'Arroz, porotos, pollo en salsa y ensalada'),
    snack: b('Pão integral com atum', 'Pan integral con atún'),
    dinner: b('Batata cozida, carne moída e legumes', 'Papa hervida, carne molida y verduras'),
  },
  {
    id: 'g12', goal: 'gain', title: b('Atum e macarrão', 'Atún y fideos'), tags: [T.quick, T.protein],
    breakfast: b('Mingau de aveia com leite e pasta de amendoim', 'Avena cocida con leche y pasta de maní'),
    lunch: b('Macarrão com atum, tomate e azeite, mais salada', 'Fideos con atún, tomate y aceite de oliva, más ensalada'),
    snack: b('Iogurte com fruta picada', 'Yogur con fruta picada'),
    dinner: b('Arroz, ovos mexidos com legumes e feijão', 'Arroz, huevos revueltos con verduras y porotos'),
  },
  {
    id: 'g13', goal: 'gain', title: b('Fim de semana leve', 'Fin de semana liviano'), tags: [T.light],
    breakfast: b('Pão francês com ovo, queijo e tomate, suco natural', 'Pan con huevo, queso y tomate, jugo natural'),
    lunch: b('Churrasco de frango e carne magra, arroz, farofa leve e salada', 'Asado de pollo y carne magra, arroz, mandi\'o y ensalada'),
    snack: b('Salada de frutas com aveia', 'Ensalada de frutas con avena'),
    dinner: b('Sanduíche natural de frango e cenoura', 'Sándwich de pollo y zanahoria'),
  },
  {
    id: 'g14', goal: 'gain', title: b('Feijoada light', 'Poroto con carne'), tags: [T.regional, T.fiber],
    breakfast: b('Cuscuz com ovo, café com leite e 1 fruta', 'Cocido con leche, pan con huevo y 1 fruta'),
    lunch: b('Feijão preto com carne magra, arroz, couve refogada e laranja', 'Porotos negros con carne magra, arroz, verduras salteadas y naranja'),
    snack: b('Vitamina de banana com leite', 'Licuado de banana con leche'),
    dinner: b('Omelete de forno com legumes e arroz', 'Tortilla al horno con verduras y arroz'),
  },
  {
    id: 'g15', goal: 'gain', title: b('Frango ao forno', 'Pollo al horno'), tags: [T.protein, T.budget],
    breakfast: b('2 ovos, pão integral, queijo e café com leite', '2 huevos, pan integral, queso y cocido con leche'),
    lunch: b('Coxa e sobrecoxa assadas sem pele, arroz, feijão e legumes', 'Muslo y contramuslo al horno sin piel, arroz, porotos y verduras'),
    snack: b('Banana com pasta de amendoim', 'Banana con pasta de maní'),
    dinner: b('Macarrão com frango desfiado e brócolis', 'Fideos con pollo desmenuzado y brócoli'),
  },

  // ------------------------------------------------------------------ emagrecer
  {
    id: 'l1', goal: 'lose', title: b('Prato colorido', 'Plato colorido'), tags: [T.light, T.fiber],
    breakfast: b('2 ovos mexidos, 1 fatia de pão integral e café sem açúcar', '2 huevos revueltos, 1 rebanada de pan integral y café sin azúcar'),
    lunch: b('Metade do prato de salada, frango grelhado e 3 colheres de arroz', 'Mitad del plato de ensalada, pollo a la plancha y 3 cucharadas de arroz'),
    snack: b('1 fruta e 1 iogurte natural', '1 fruta y 1 yogur natural'),
    dinner: b('Sopa de legumes com frango desfiado', 'Sopa de verduras con pollo desmenuzado'),
  },
  {
    id: 'l2', goal: 'lose', title: b('Peixe e legumes', 'Pescado y verduras'), tags: [T.light, T.protein],
    breakfast: b('Iogurte natural com morangos e 1 colher de aveia', 'Yogur natural con frutillas y 1 cucharada de avena'),
    lunch: b('Tilápia assada, legumes no vapor e 2 colheres de arroz integral', 'Tilapia al horno, verduras al vapor y 2 cucharadas de arroz integral'),
    snack: b('Cenoura e pepino em palitos com pasta de grão-de-bico', 'Bastones de zanahoria y pepino con pasta de garbanzos'),
    dinner: b('Omelete de 2 ovos com espinafre e tomate', 'Omelet de 2 huevos con espinaca y tomate'),
  },
  {
    id: 'l3', goal: 'lose', title: b('Feijão com salada', 'Porotos con ensalada'), tags: [T.budget, T.fiber],
    breakfast: b('Café com leite desnatado e 1 tapioca pequena com queijo branco', 'Cocido con leche descremada y 1 tostada con queso fresco'),
    lunch: b('Arroz (pouco), feijão, carne magra moída e salada grande', 'Arroz (poco), porotos, carne magra molida y ensalada grande'),
    snack: b('1 maçã', '1 manzana'),
    dinner: b('Frango grelhado com abobrinha e cenoura refogadas', 'Pollo a la plancha con zapallito y zanahoria salteados'),
  },
  {
    id: 'l4', goal: 'lose', title: b('Tereré e salada', 'Tereré y ensalada'), tags: [T.regional, T.light],
    breakfast: b('2 ovos cozidos, 1 fruta e café sem açúcar', '2 huevos duros, 1 fruta y café sin azúcar'),
    lunch: b('Salada de folhas, tomate e frango, com mandioca cozida (2 pedaços)', 'Ensalada de hojas, tomate y pollo, con 2 trozos de mandi\'o hervida'),
    snack: b('Tereré sem açúcar e 1 iogurte', 'Tereré sin azúcar y 1 yogur'),
    dinner: b('Caldo de legumes com carne magra', 'Caldo de verduras con carne magra'),
  },
  {
    id: 'l5', goal: 'lose', title: b('Rápido e leve', 'Rápido y liviano'), tags: [T.quick, T.light],
    breakfast: b('Pão integral com queijo branco e tomate, café', 'Pan integral con queso fresco y tomate, café'),
    lunch: b('Wrap integral de frango com alface e cenoura', 'Wrap integral de pollo con lechuga y zanahoria'),
    snack: b('1 punhado de amendoim sem sal e 1 fruta', '1 puñado de maní sin sal y 1 fruta'),
    dinner: b('Salada de atum com ovo, tomate e folhas', 'Ensalada de atún con huevo, tomate y hojas'),
  },
  {
    id: 'l6', goal: 'lose', title: b('Sopa da noite', 'Sopa de la noche'), tags: [T.light, T.budget],
    breakfast: b('Mingau de aveia com água ou leite desnatado e canela', 'Avena cocida con agua o leche descremada y canela'),
    lunch: b('Arroz (pouco), feijão, ovo cozido e salada à vontade', 'Arroz (poco), porotos, huevo duro y ensalada libre'),
    snack: b('Iogurte natural com 1 fruta', 'Yogur natural con 1 fruta'),
    dinner: b('Sopa de abóbora com frango', 'Sopa de zapallo con pollo'),
  },
  {
    id: 'l7', goal: 'lose', title: b('Sem carne e leve', 'Sin carne y liviano'), tags: [T.veg, T.fiber],
    breakfast: b('Omelete de 2 ovos com tomate e cebola', 'Omelet de 2 huevos con tomate y cebolla'),
    lunch: b('Lentilha, salada grande e legumes assados', 'Lentejas, ensalada grande y verduras asadas'),
    snack: b('1 fruta e 1 fatia de queijo branco', '1 fruta y 1 rebanada de queso fresco'),
    dinner: b('Grão-de-bico com legumes e ovo cozido', 'Garbanzos con verduras y huevo duro'),
  },
  {
    id: 'l8', goal: 'lose', title: b('Frango e abobrinha', 'Pollo y zapallito'), tags: [T.protein, T.light],
    breakfast: b('Iogurte natural com 1 banana pequena', 'Yogur natural con 1 banana chica'),
    lunch: b('Frango grelhado, purê de abóbora e salada', 'Pollo a la plancha, puré de zapallo y ensalada'),
    snack: b('Chá ou tereré sem açúcar e 1 fruta', 'Té o tereré sin azúcar y 1 fruta'),
    dinner: b('Abobrinha recheada com carne moída magra', 'Zapallito relleno con carne molida magra'),
  },
  {
    id: 'l9', goal: 'lose', title: b('Marmita esperta', 'Vianda inteligente'), tags: [T.quick, T.budget],
    breakfast: b('2 ovos mexidos e 1 fruta', '2 huevos revueltos y 1 fruta'),
    lunch: b('Marmita: 3 colheres de arroz, feijão, frango e brócolis', 'Vianda: 3 cucharadas de arroz, porotos, pollo y brócoli'),
    snack: b('Iogurte natural', 'Yogur natural'),
    dinner: b('Salada de folhas com frango desfiado e milho', 'Ensalada de hojas con pollo desmenuzado y choclo'),
  },
  {
    id: 'l10', goal: 'lose', title: b('Peixe com mandioca', 'Pescado con mandi\'o'), tags: [T.regional, T.protein],
    breakfast: b('Café com leite desnatado e 1 pão integral com ovo', 'Cocido con leche descremada y 1 pan integral con huevo'),
    lunch: b('Peixe grelhado, 2 pedaços de mandioca e salada de tomate', 'Pescado a la plancha, 2 trozos de mandi\'o y ensalada de tomate'),
    snack: b('1 fruta', '1 fruta'),
    dinner: b('Sopa de legumes com ovo', 'Sopa de verduras con huevo'),
  },
  {
    id: 'l11', goal: 'lose', title: b('Proteína primeiro', 'Proteína primero'), tags: [T.protein],
    breakfast: b('Omelete de 2 ovos com queijo branco', 'Omelet de 2 huevos con queso fresco'),
    lunch: b('Carne magra grelhada, salada grande e 2 colheres de arroz', 'Carne magra a la plancha, ensalada grande y 2 cucharadas de arroz'),
    snack: b('Iogurte natural com canela', 'Yogur natural con canela'),
    dinner: b('Frango desfiado com legumes refogados', 'Pollo desmenuzado con verduras salteadas'),
  },
  {
    id: 'l12', goal: 'lose', title: b('Salada completa', 'Ensalada completa'), tags: [T.light, T.quick],
    breakfast: b('1 fatia de pão integral com ovo e 1 fruta', '1 rebanada de pan integral con huevo y 1 fruta'),
    lunch: b('Salada com folhas, grão-de-bico, ovo, tomate e frango', 'Ensalada con hojas, garbanzos, huevo, tomate y pollo'),
    snack: b('Palitos de cenoura e 1 iogurte', 'Bastones de zanahoria y 1 yogur'),
    dinner: b('Peixe assado com legumes', 'Pescado al horno con verduras'),
  },
  {
    id: 'l13', goal: 'lose', title: b('Café da manhã salgado', 'Desayuno salado'), tags: [T.protein, T.budget],
    breakfast: b('2 ovos cozidos, tomate e café sem açúcar', '2 huevos duros, tomate y café sin azúcar'),
    lunch: b('Arroz (pouco), feijão, frango e beterraba ralada', 'Arroz (poco), porotos, pollo y remolacha rallada'),
    snack: b('1 fruta e chá', '1 fruta y té'),
    dinner: b('Omelete com legumes e salada', 'Omelet con verduras y ensalada'),
  },
  {
    id: 'l14', goal: 'lose', title: b('Caldo de domingo', 'Caldo de domingo'), tags: [T.regional, T.light],
    breakfast: b('Iogurte natural com aveia', 'Yogur natural con avena'),
    lunch: b('Frango assado sem pele, legumes assados e salada', 'Pollo al horno sin piel, verduras asadas y ensalada'),
    snack: b('1 fruta e tereré sem açúcar', '1 fruta y tereré sin azúcar'),
    dinner: b('Caldo de mandioca com carne magra (porção pequena)', 'Caldo de mandi\'o con carne magra (porción chica)'),
  },
  {
    id: 'l15', goal: 'lose', title: b('Leve e saciante', 'Liviano y que llena'), tags: [T.fiber, T.light],
    breakfast: b('Mingau de aveia com maçã e canela', 'Avena cocida con manzana y canela'),
    lunch: b('Carne moída magra com legumes, salada e 2 colheres de arroz', 'Carne molida magra con verduras, ensalada y 2 cucharadas de arroz'),
    snack: b('Iogurte natural e 1 punhado de amendoim', 'Yogur natural y 1 puñado de maní'),
    dinner: b('Sopa de legumes com lentilha', 'Sopa de verduras con lentejas'),
  },
];

/** Trocas simples que valem para qualquer cardápio. */
export const SWAPS: { from: Bi; to: Bi }[] = [
  { from: b('Arroz', 'Arroz'), to: b('Mandioca, batata, batata-doce ou macarrão', 'Mandi\'o, papa, batata dulce o fideos') },
  { from: b('Frango', 'Pollo'), to: b('Peixe, ovos, carne magra ou atum', 'Pescado, huevos, carne magra o atún') },
  { from: b('Feijão', 'Porotos'), to: b('Lentilha, grão-de-bico ou ervilha', 'Lentejas, garbanzos o arvejas') },
  { from: b('Pão', 'Pan'), to: b('Tapioca, cuscuz ou aveia', 'Mbejú, tostadas o avena') },
  { from: b('Iogurte', 'Yogur'), to: b('Leite ou queijo branco', 'Leche o queso fresco') },
  { from: b('Refrigerante e suco de caixinha', 'Gaseosa y jugo de caja'), to: b('Água, chá ou tereré sem açúcar', 'Agua, té o tereré sin azúcar') },
];

export const TIPS: Record<MenuGoal, Bi[]> = {
  gain: [
    b('Coma uma fonte de proteína em todas as refeições.', 'Comé una fuente de proteína en todas las comidas.'),
    b('Não pule o café da manhã nem a refeição depois do treino.', 'No saltees el desayuno ni la comida después de entrenar.'),
    b('Beba bastante água ao longo do dia.', 'Tomá bastante agua durante el día.'),
    b('Durma bem: o músculo cresce no descanso.', 'Dormí bien: el músculo crece en el descanso.'),
  ],
  lose: [
    b('Encha metade do prato com salada e legumes.', 'Llená la mitad del plato con ensalada y verduras.'),
    b('Evite doces e frituras no dia a dia, sem radicalismo.', 'Evitá dulces y frituras en el día a día, sin extremos.'),
    b('Beba água antes das refeições.', 'Tomá agua antes de las comidas.'),
    b('Não fique muitas horas sem comer: isso dá mais fome depois.', 'No pases muchas horas sin comer: después da más hambre.'),
  ],
};

/** Cardápio sugerido do dia: muda todo dia, igual para todo mundo da academia. */
export function menuOfTheDay(goal: MenuGoal, date = new Date()): MenuIdea {
  const list = MENU_IDEAS.filter((m) => m.goal === goal);
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return list[day % list.length];
}
