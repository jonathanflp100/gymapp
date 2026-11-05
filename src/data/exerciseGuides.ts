/**
 * Guia de execução de cada exercício: passo a passo, dica e erro comum, em pt-BR e es-PY.
 * Na entrega para a academia, o campo de vídeo pode apontar para os vídeos gravados
 * pelos professores dela (pacote Premium).
 */
export interface ExerciseGuide {
  steps: { pt: string[]; es: string[] };
  tip: { pt: string; es: string };
  avoid: { pt: string; es: string };
  /** URL de vídeo próprio da academia (opcional). */
  videoUrl?: string;
}

const g = (
  ptSteps: string[],
  esSteps: string[],
  tipPt: string,
  tipEs: string,
  avoidPt: string,
  avoidEs: string
): ExerciseGuide => ({ steps: { pt: ptSteps, es: esSteps }, tip: { pt: tipPt, es: tipEs }, avoid: { pt: avoidPt, es: avoidEs } });

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  'ex-bench-press': g(
    ['Deite no banco com os olhos abaixo da barra e os pés firmes no chão.', 'Segure a barra um pouco além da largura dos ombros e retraia as escápulas.', 'Desça controlando até tocar a linha do peito e empurre de volta.'],
    ['Acostate en el banco con los ojos debajo de la barra y los pies firmes.', 'Agarrá la barra un poco más ancho que los hombros y retraé las escápulas.', 'Bajá controlando hasta el pecho y empujá de vuelta.'],
    'Mantenha um leve arco nas costas e o glúteo apoiado o tempo todo.',
    'Mantené un leve arco lumbar y los glúteos apoyados todo el tiempo.',
    'Quicar a barra no peito ou abrir demais os cotovelos.',
    'Rebotar la barra en el pecho o abrir demasiado los codos.'
  ),
  'ex-incline-dumbbell-press': g(
    ['Ajuste o banco entre 30° e 45° e apoie os halteres nas coxas.', 'Leve os halteres à altura do peito com os cotovelos levemente abaixo dos ombros.', 'Empurre para cima aproximando os halteres no topo, sem bater.'],
    ['Ajustá el banco entre 30° y 45° y apoyá las mancuernas en los muslos.', 'Llevá las mancuernas a la altura del pecho con los codos un poco debajo de los hombros.', 'Empujá hacia arriba acercándolas arriba, sin chocarlas.'],
    'Desça devagar para sentir o alongamento do peitoral superior.',
    'Bajá despacio para sentir el estiramiento del pecho superior.',
    'Inclinar demais o banco e transformar em exercício de ombro.',
    'Inclinar demasiado el banco y convertirlo en ejercicio de hombro.'
  ),
  'ex-cable-crossover': g(
    ['Polias no alto, dê um passo à frente e incline levemente o tronco.', 'Com os cotovelos levemente flexionados, abra os braços até sentir o peito alongar.', 'Una as mãos à frente do corpo contraindo o peitoral.'],
    ['Poleas arriba, da un paso adelante e inclinate levemente.', 'Con los codos un poco flexionados, abrí los brazos hasta sentir el pecho estirar.', 'Juntá las manos frente al cuerpo apretando el pecho.'],
    'Pense em abraçar uma árvore: o movimento vem do ombro, não do cotovelo.',
    'Pensá en abrazar un árbol: el movimiento sale del hombro, no del codo.',
    'Dobrar e esticar os cotovelos durante o movimento.',
    'Flexionar y extender los codos durante el movimiento.'
  ),
  'ex-chest-fly-machine': g(
    ['Ajuste o banco para que as manoplas fiquem na altura do peito.', 'Encoste bem as costas e segure as manoplas com os cotovelos levemente dobrados.', 'Feche os braços à frente, segure 1 segundo e volte controlando.'],
    ['Ajustá el asiento para que las manijas queden a la altura del pecho.', 'Apoyá bien la espalda y agarrá con los codos levemente flexionados.', 'Cerrá los brazos al frente, sostené 1 segundo y volvé controlando.'],
    'Mantenha o peito aberto e os ombros longe das orelhas.',
    'Mantené el pecho abierto y los hombros lejos de las orejas.',
    'Deixar o peso voltar de uma vez e bater as placas.',
    'Dejar que el peso vuelva de golpe y choquen las placas.'
  ),
  'ex-pushup': g(
    ['Mãos um pouco além dos ombros e corpo reto da cabeça aos pés.', 'Desça o peito em direção ao chão com os cotovelos a cerca de 45°.', 'Empurre o chão até estender os braços, mantendo o abdômen firme.'],
    ['Manos un poco más anchas que los hombros y cuerpo recto de cabeza a pies.', 'Bajá el pecho hacia el piso con los codos a unos 45°.', 'Empujá el piso hasta extender los brazos, con el abdomen firme.'],
    'Se ficar pesado, apoie os joelhos e mantenha a linha do tronco.',
    'Si cuesta, apoyá las rodillas y mantené la línea del tronco.',
    'Deixar o quadril cair ou empinar o bumbum.',
    'Dejar caer la cadera o levantar los glúteos.'
  ),
  'ex-dips-chest': g(
    ['Apoie-se nas barras paralelas com os braços estendidos.', 'Incline o tronco à frente e desça até os ombros ficarem na altura dos cotovelos.', 'Empurre para cima mantendo a inclinação do tronco.'],
    ['Apoyate en las barras paralelas con los brazos extendidos.', 'Inclinate hacia adelante y bajá hasta que los hombros queden a la altura de los codos.', 'Empujá hacia arriba manteniendo la inclinación.'],
    'Cruzar as pernas ajuda a manter o tronco inclinado para o peito.',
    'Cruzar las piernas ayuda a mantener el tronco inclinado hacia el pecho.',
    'Descer demais e forçar a frente do ombro.',
    'Bajar demasiado y forzar la parte frontal del hombro.'
  ),
  'ex-lat-pulldown': g(
    ['Sente com as coxas presas no apoio e segure a barra aberta.', 'Puxe a barra até a parte alta do peito levando os cotovelos para baixo.', 'Volte devagar até estender os braços por completo.'],
    ['Sentate con los muslos trabados y agarrá la barra abierta.', 'Tirá la barra hasta la parte alta del pecho llevando los codos hacia abajo.', 'Volvé despacio hasta extender por completo los brazos.'],
    'Imagine colocar os cotovelos nos bolsos de trás da calça.',
    'Imaginá meter los codos en los bolsillos traseros del pantalón.',
    'Jogar o tronco para trás para ajudar a puxar.',
    'Tirar el tronco hacia atrás para ayudarte.'
  ),
  'ex-seated-cable-row': g(
    ['Sente com os pés apoiados e os joelhos levemente flexionados.', 'Com a coluna reta, puxe o triângulo em direção ao umbigo.', 'Aperte as escápulas no final e volte alongando as costas.'],
    ['Sentate con los pies apoyados y las rodillas levemente flexionadas.', 'Con la columna recta, tirá del triángulo hacia el ombligo.', 'Apretá las escápulas al final y volvé estirando la espalda.'],
    'O tronco fica parado: quem trabalha são as costas e os braços.',
    'El tronco queda quieto: trabajan la espalda y los brazos.',
    'Balançar o tronco para frente e para trás.',
    'Balancear el tronco hacia adelante y atrás.'
  ),
  'ex-barbell-row': g(
    ['Pés na largura do quadril, segure a barra e incline o tronco a cerca de 45°.', 'Com a coluna neutra, puxe a barra em direção ao umbigo.', 'Desça controlando sem perder a posição do tronco.'],
    ['Pies al ancho de la cadera, agarrá la barra e inclinate a unos 45°.', 'Con la columna neutra, tirá la barra hacia el ombligo.', 'Bajá controlando sin perder la posición del tronco.'],
    'Abdômen contraído o tempo todo protege a lombar.',
    'Abdomen apretado todo el tiempo protege la zona lumbar.',
    'Arredondar as costas para levantar mais peso.',
    'Redondear la espalda para levantar más peso.'
  ),
  'ex-pullup': g(
    ['Segure a barra com as palmas para frente, um pouco além dos ombros.', 'Puxe o corpo até o queixo passar a barra, levando o peito em direção a ela.', 'Desça devagar até estender os braços.'],
    ['Agarrá la barra con las palmas hacia adelante, un poco más ancho que los hombros.', 'Subí hasta que el mentón pase la barra, llevando el pecho hacia ella.', 'Bajá despacio hasta extender los brazos.'],
    'Se ainda não consegue, use o elástico ou a máquina gravitron.',
    'Si todavía no podés, usá banda elástica o la máquina asistida.',
    'Dar impulso com as pernas.',
    'Tomar impulso con las piernas.'
  ),
  'ex-dumbbell-row': g(
    ['Apoie joelho e mão do mesmo lado no banco, com as costas retas.', 'Puxe o halter em direção ao quadril, mantendo o cotovelo perto do corpo.', 'Desça até alongar bem as costas.'],
    ['Apoyá rodilla y mano del mismo lado en el banco, con la espalda recta.', 'Tirá la mancuerna hacia la cadera con el codo pegado al cuerpo.', 'Bajá hasta estirar bien la espalda.'],
    'Pense em serrar madeira: o movimento é para trás, não para cima.',
    'Pensá en serruchar: el movimiento va hacia atrás, no hacia arriba.',
    'Girar o tronco para subir o halter.',
    'Girar el tronco para subir la mancuerna.'
  ),
  'ex-straight-arm-pulldown': g(
    ['De frente para a polia alta, segure a barra com os braços estendidos.', 'Incline levemente o tronco e leve a barra até as coxas.', 'Volte devagar até a altura dos olhos.'],
    ['De frente a la polea alta, agarrá la barra con los brazos extendidos.', 'Inclinate levemente y llevá la barra hasta los muslos.', 'Volvé despacio hasta la altura de los ojos.'],
    'Ótimo para ativar as costas antes das puxadas.',
    'Ideal para activar la espalda antes de los jalones.',
    'Dobrar os cotovelos e virar um tríceps.',
    'Flexionar los codos y convertirlo en tríceps.'
  ),
  'ex-overhead-press': g(
    ['Sente com as costas apoiadas e os halteres na altura dos ombros.', 'Empurre para cima até quase estender os braços.', 'Desça controlando até a altura das orelhas.'],
    ['Sentate con la espalda apoyada y las mancuernas a la altura de los hombros.', 'Empujá hacia arriba hasta casi extender los brazos.', 'Bajá controlando hasta la altura de las orejas.'],
    'Mantenha os punhos alinhados acima dos cotovelos.',
    'Mantené las muñecas alineadas sobre los codos.',
    'Arquear a lombar para empurrar mais peso.',
    'Arquear la zona lumbar para empujar más peso.'
  ),
  'ex-lateral-raise': g(
    ['Em pé, halteres ao lado do corpo e cotovelos levemente dobrados.', 'Eleve os braços pelas laterais até a altura dos ombros.', 'Desça devagar, sem deixar o halter encostar no corpo.'],
    ['De pie, mancuernas al costado y codos levemente flexionados.', 'Elevá los brazos por los costados hasta la altura de los hombros.', 'Bajá despacio sin que la mancuerna toque el cuerpo.'],
    'Lidere o movimento com os cotovelos, como se derramasse uma jarra.',
    'Guiá el movimiento con los codos, como si sirvieras una jarra.',
    'Usar impulso do corpo e subir acima dos ombros.',
    'Usar impulso del cuerpo y subir por encima de los hombros.'
  ),
  'ex-front-raise-cable': g(
    ['De costas para a polia baixa, segure o puxador entre as pernas.', 'Eleve o braço estendido à frente até a altura dos ombros.', 'Desça controlando a volta do cabo.'],
    ['De espaldas a la polea baja, agarrá la manija entre las piernas.', 'Elevá el brazo extendido al frente hasta la altura de los hombros.', 'Bajá controlando el regreso del cable.'],
    'Abdômen firme para o tronco não balançar.',
    'Abdomen firme para que el tronco no se balancee.',
    'Subir acima da linha dos ombros.',
    'Subir por encima de la línea de los hombros.'
  ),
  'ex-face-pull': g(
    ['Polia na altura do rosto com a corda; segure com as palmas para dentro.', 'Puxe a corda em direção ao rosto abrindo as mãos e os cotovelos para fora.', 'Segure 1 segundo e volte devagar.'],
    ['Polea a la altura de la cara con la soga; agarrá con las palmas hacia adentro.', 'Tirá la soga hacia la cara abriendo manos y codos hacia afuera.', 'Sostené 1 segundo y volvé despacio.'],
    'Excelente para postura e saúde dos ombros.',
    'Excelente para la postura y la salud de los hombros.',
    'Puxar com a lombar jogando o corpo para trás.',
    'Tirar con la zona lumbar echando el cuerpo atrás.'
  ),
  'ex-shrug': g(
    ['Em pé, segure a barra à frente com os braços estendidos.', 'Eleve os ombros em direção às orelhas.', 'Segure 1 segundo no topo e desça devagar.'],
    ['De pie, sostené la barra al frente con los brazos extendidos.', 'Elevá los hombros hacia las orejas.', 'Sostené 1 segundo arriba y bajá despacio.'],
    'Movimento só para cima e para baixo, sem girar os ombros.',
    'Movimiento solo hacia arriba y abajo, sin girar los hombros.',
    'Dobrar os cotovelos para ajudar.',
    'Flexionar los codos para ayudar.'
  ),
  'ex-barbell-curl': g(
    ['Em pé, segure a barra W com as palmas para cima.', 'Dobre os cotovelos levando a barra até a altura do peito.', 'Desça devagar até estender os braços.'],
    ['De pie, agarrá la barra W con las palmas hacia arriba.', 'Flexioná los codos llevando la barra hasta el pecho.', 'Bajá despacio hasta extender los brazos.'],
    'Cotovelos colados ao corpo do início ao fim.',
    'Codos pegados al cuerpo de principio a fin.',
    'Balançar o tronco para subir a barra.',
    'Balancear el tronco para subir la barra.'
  ),
  'ex-hammer-curl': g(
    ['Em pé, halteres ao lado do corpo com as palmas voltadas para dentro.', 'Suba os halteres mantendo a pegada neutra.', 'Desça controlando até estender os braços.'],
    ['De pie, mancuernas al costado con las palmas hacia adentro.', 'Subí las mancuernas manteniendo el agarre neutro.', 'Bajá controlando hasta extender los brazos.'],
    'Trabalha bíceps e antebraço: ótimo para pegada.',
    'Trabaja bíceps y antebrazo: ideal para el agarre.',
    'Levar os cotovelos para frente.',
    'Llevar los codos hacia adelante.'
  ),
  'ex-preacher-curl': g(
    ['Ajuste o banco para a axila encostar no topo do apoio.', 'Segure as manoplas e dobre os cotovelos até o topo.', 'Desça devagar quase até estender.'],
    ['Ajustá el asiento para que la axila apoye arriba del soporte.', 'Agarrá las manijas y flexioná los codos hasta arriba.', 'Bajá despacio casi hasta extender.'],
    'A descida lenta é onde está o maior estímulo.',
    'La bajada lenta es donde está el mayor estímulo.',
    'Esticar de uma vez no final e forçar o cotovelo.',
    'Extender de golpe al final y forzar el codo.'
  ),
  'ex-incline-dumbbell-curl': g(
    ['Banco a cerca de 45°, costas apoiadas e braços pendurados.', 'Suba os halteres sem tirar os cotovelos da linha do corpo.', 'Desça até alongar bem o bíceps.'],
    ['Banco a unos 45°, espalda apoyada y brazos colgando.', 'Subí las mancuernas sin sacar los codos de la línea del cuerpo.', 'Bajá hasta estirar bien el bíceps.'],
    'Use cargas menores: o alongamento deixa o exercício mais difícil.',
    'Usá cargas menores: el estiramiento lo hace más difícil.',
    'Tirar as costas do banco.',
    'Despegar la espalda del banco.'
  ),
  'ex-triceps-rope-pushdown': g(
    ['De frente para a polia alta, segure a corda com os cotovelos colados ao corpo.', 'Estenda os braços para baixo abrindo a corda no final.', 'Volte até os antebraços passarem da horizontal.'],
    ['De frente a la polea alta, agarrá la soga con los codos pegados al cuerpo.', 'Extendé los brazos hacia abajo abriendo la soga al final.', 'Volvé hasta que los antebrazos pasen la horizontal.'],
    'Só o antebraço se mexe; o cotovelo é uma dobradiça.',
    'Solo se mueve el antebrazo; el codo es una bisagra.',
    'Afastar os cotovelos do corpo.',
    'Separar los codos del cuerpo.'
  ),
  'ex-skull-crusher': g(
    ['Deite no banco segurando a barra W acima do peito.', 'Dobre os cotovelos levando a barra em direção à testa.', 'Estenda os braços de volta sem mexer os ombros.'],
    ['Acostate en el banco sosteniendo la barra W sobre el pecho.', 'Flexioná los codos llevando la barra hacia la frente.', 'Extendé los brazos de vuelta sin mover los hombros.'],
    'Cotovelos apontados para o teto o tempo todo.',
    'Codos apuntando al techo todo el tiempo.',
    'Abrir os cotovelos para os lados.',
    'Abrir los codos hacia los costados.'
  ),
  'ex-overhead-triceps-extension': g(
    ['Sentado, segure um halter com as duas mãos acima da cabeça.', 'Desça o halter atrás da cabeça dobrando os cotovelos.', 'Estenda os braços de volta ao topo.'],
    ['Sentado, sostené una mancuerna con las dos manos sobre la cabeza.', 'Bajá la mancuerna detrás de la cabeza flexionando los codos.', 'Extendé los brazos de vuelta arriba.'],
    'Mantenha os cotovelos próximos da cabeça.',
    'Mantené los codos cerca de la cabeza.',
    'Arquear a lombar durante o movimento.',
    'Arquear la zona lumbar durante el movimiento.'
  ),
  'ex-close-grip-bench': g(
    ['Deite no banco e segure a barra na largura dos ombros.', 'Desça a barra até a parte baixa do peito com os cotovelos junto ao corpo.', 'Empurre até estender os braços.'],
    ['Acostate en el banco y agarrá la barra al ancho de los hombros.', 'Bajá la barra hasta la parte baja del pecho con los codos pegados.', 'Empujá hasta extender los brazos.'],
    'Pegada fechada demais força os punhos; a largura dos ombros basta.',
    'Agarre demasiado cerrado fuerza las muñecas; con el ancho de hombros alcanza.',
    'Abrir os cotovelos como no supino tradicional.',
    'Abrir los codos como en el press tradicional.'
  ),
  'ex-squat': g(
    ['Barra apoiada no trapézio, pés na largura dos ombros e pontas levemente para fora.', 'Desça empurrando o quadril para trás até as coxas ficarem paralelas ao chão.', 'Suba empurrando o chão com o pé inteiro.'],
    ['Barra apoyada en el trapecio, pies al ancho de los hombros y puntas un poco hacia afuera.', 'Bajá llevando la cadera atrás hasta que los muslos queden paralelos al piso.', 'Subí empujando el piso con todo el pie.'],
    'Joelhos acompanham a direção da ponta dos pés.',
    'Las rodillas siguen la dirección de la punta de los pies.',
    'Deixar os joelhos caírem para dentro ou tirar o calcanhar do chão.',
    'Dejar que las rodillas se vayan hacia adentro o levantar los talones.'
  ),
  'ex-leg-press-45': g(
    ['Encoste bem as costas e apoie os pés na plataforma na largura do quadril.', 'Destrave e desça até os joelhos formarem cerca de 90°.', 'Empurre a plataforma sem travar os joelhos no final.'],
    ['Apoyá bien la espalda y los pies en la plataforma al ancho de la cadera.', 'Destrabá y bajá hasta que las rodillas formen unos 90°.', 'Empujá la plataforma sin trabar las rodillas al final.'],
    'Pés mais altos trabalham mais glúteo; mais baixos, mais quadríceps.',
    'Pies más arriba trabajan más glúteo; más abajo, más cuádriceps.',
    'Tirar o quadril do banco no fim da descida.',
    'Despegar la cadera del asiento al final de la bajada.'
  ),
  'ex-leg-extension': g(
    ['Ajuste o encosto para o joelho ficar alinhado ao eixo da máquina.', 'Estenda as pernas até ficarem retas e contraia a coxa.', 'Desça devagar sem deixar o peso bater.'],
    ['Ajustá el respaldo para que la rodilla quede alineada al eje de la máquina.', 'Extendé las piernas hasta quedar rectas y apretá el muslo.', 'Bajá despacio sin que el peso choque.'],
    'Segure 1 segundo no topo para mais estímulo.',
    'Sostené 1 segundo arriba para más estímulo.',
    'Dar impulso e subir com velocidade.',
    'Tomar impulso y subir con velocidad.'
  ),
  'ex-bulgarian-split-squat': g(
    ['Apoie o peito de um pé num banco atrás de você, halteres nas mãos.', 'Desça o joelho de trás em direção ao chão.', 'Suba empurrando com o calcanhar da perna da frente.'],
    ['Apoyá el empeine de un pie en un banco detrás tuyo, mancuernas en las manos.', 'Bajá la rodilla de atrás hacia el piso.', 'Subí empujando con el talón de la pierna de adelante.'],
    'Tronco levemente inclinado aumenta o trabalho do glúteo.',
    'Tronco levemente inclinado aumenta el trabajo del glúteo.',
    'Ficar com o pé da frente muito perto do banco.',
    'Dejar el pie de adelante muy cerca del banco.'
  ),
  'ex-walking-lunges': g(
    ['Em pé com os halteres ao lado do corpo.', 'Dê um passo largo à frente e desça até os dois joelhos formarem 90°.', 'Empurre e já leve a outra perna à frente, caminhando.'],
    ['De pie con las mancuernas al costado.', 'Da un paso largo adelante y bajá hasta que ambas rodillas formen 90°.', 'Empujá y llevá la otra pierna adelante, caminando.'],
    'Olhe à frente e mantenha o tronco alto.',
    'Mirá al frente y mantené el tronco erguido.',
    'Deixar o joelho da frente passar muito da ponta do pé.',
    'Dejar que la rodilla de adelante pase mucho la punta del pie.'
  ),
  'ex-lying-leg-curl': g(
    ['Deite de bruços com o rolo logo acima dos calcanhares.', 'Flexione os joelhos trazendo o rolo em direção ao glúteo.', 'Desça devagar até quase estender as pernas.'],
    ['Acostate boca abajo con el rodillo justo arriba de los talones.', 'Flexioná las rodillas llevando el rodillo hacia el glúteo.', 'Bajá despacio hasta casi extender las piernas.'],
    'Pressione o quadril contra o banco o tempo todo.',
    'Presioná la cadera contra el banco todo el tiempo.',
    'Levantar o quadril para completar o movimento.',
    'Levantar la cadera para completar el movimiento.'
  ),
  'ex-seated-leg-curl': g(
    ['Sente com o rolo atrás dos tornozelos e trave as coxas no apoio.', 'Flexione os joelhos puxando o rolo para baixo.', 'Volte devagar até as pernas ficarem quase retas.'],
    ['Sentate con el rodillo detrás de los tobillos y trabá los muslos.', 'Flexioná las rodillas tirando el rodillo hacia abajo.', 'Volvé despacio hasta que las piernas queden casi rectas.'],
    'Incline levemente o tronco à frente para alongar mais o posterior.',
    'Inclinate un poco hacia adelante para estirar más el femoral.',
    'Deixar o peso subir de uma vez.',
    'Dejar que el peso suba de golpe.'
  ),
  'ex-romanian-deadlift': g(
    ['Em pé com a barra à frente das coxas e joelhos levemente dobrados.', 'Empurre o quadril para trás descendo a barra rente às pernas.', 'Ao sentir o posterior alongar, volte contraindo o glúteo.'],
    ['De pie con la barra frente a los muslos y rodillas levemente flexionadas.', 'Llevá la cadera atrás bajando la barra pegada a las piernas.', 'Cuando sientas el femoral estirar, volvé apretando el glúteo.'],
    'A coluna fica neutra; quem dobra é o quadril.',
    'La columna queda neutra; lo que se dobla es la cadera.',
    'Arredondar as costas para descer mais.',
    'Redondear la espalda para bajar más.'
  ),
  'ex-hip-thrust': g(
    ['Apoie a parte alta das costas no banco, barra sobre o quadril (use proteção).', 'Com os pés firmes, eleve o quadril até o corpo ficar reto dos ombros aos joelhos.', 'Contraia o glúteo no topo e desça controlando.'],
    ['Apoyá la parte alta de la espalda en el banco, barra sobre la cadera (usá protector).', 'Con los pies firmes, elevá la cadera hasta quedar recto de hombros a rodillas.', 'Apretá el glúteo arriba y bajá controlando.'],
    'Queixo levemente para baixo evita arquear a lombar.',
    'Mentón levemente hacia abajo evita arquear la zona lumbar.',
    'Hiperestender a lombar no topo.',
    'Hiperextender la zona lumbar arriba.'
  ),
  'ex-cable-glute-kickback': g(
    ['Prenda a tornozeleira na polia baixa e apoie as mãos na máquina.', 'Leve a perna estendida para trás contraindo o glúteo.', 'Volte devagar sem apoiar o pé.'],
    ['Colocá la tobillera en la polea baja y apoyá las manos en la máquina.', 'Llevá la pierna extendida hacia atrás apretando el glúteo.', 'Volvé despacio sin apoyar el pie.'],
    'Movimento curto e controlado rende mais que balanço.',
    'Movimiento corto y controlado rinde más que el balanceo.',
    'Arquear a lombar para subir mais a perna.',
    'Arquear la zona lumbar para subir más la pierna.'
  ),
  'ex-standing-calf-raise': g(
    ['Apoie os ombros na máquina e a ponta dos pés no degrau.', 'Suba na ponta dos pés o mais alto possível.', 'Desça até alongar bem a panturrilha.'],
    ['Apoyá los hombros en la máquina y la punta de los pies en el escalón.', 'Subí en puntas de pie lo más alto posible.', 'Bajá hasta estirar bien la pantorrilla.'],
    'Pausa de 1 segundo embaixo tira o efeito mola.',
    'Pausa de 1 segundo abajo elimina el efecto resorte.',
    'Fazer repetições curtas e rápidas.',
    'Hacer repeticiones cortas y rápidas.'
  ),
  'ex-seated-calf-raise': g(
    ['Sente com o apoio sobre os joelhos e a ponta dos pés no degrau.', 'Eleve os calcanhares o máximo possível.', 'Desça devagar até alongar.'],
    ['Sentate con el apoyo sobre las rodillas y la punta de los pies en el escalón.', 'Elevá los talones lo máximo posible.', 'Bajá despacio hasta estirar.'],
    'Sentado, o foco vai para o sóleo, a parte mais profunda da panturrilha.',
    'Sentado, el foco va al sóleo, la parte más profunda de la pantorrilla.',
    'Usar o impulso do corpo.',
    'Usar el impulso del cuerpo.'
  ),
  'ex-cable-crunch': g(
    ['Ajoelhado de frente para a polia alta, segure a corda ao lado da cabeça.', 'Enrole o tronco levando os cotovelos em direção às coxas.', 'Volte devagar alongando o abdômen.'],
    ['Arrodillado frente a la polea alta, sostené la soga al costado de la cabeza.', 'Enrollá el tronco llevando los codos hacia los muslos.', 'Volvé despacio estirando el abdomen.'],
    'O quadril fica parado; quem dobra é a coluna.',
    'La cadera queda quieta; lo que se dobla es la columna.',
    'Puxar com os braços em vez do abdômen.',
    'Tirar con los brazos en vez del abdomen.'
  ),
  'ex-plank': g(
    ['Apoie antebraços e ponta dos pés no chão, cotovelos abaixo dos ombros.', 'Mantenha o corpo reto contraindo abdômen e glúteos.', 'Respire normalmente e segure o tempo indicado.'],
    ['Apoyá antebrazos y punta de los pies en el piso, codos bajo los hombros.', 'Mantené el cuerpo recto apretando abdomen y glúteos.', 'Respirá normalmente y sostené el tiempo indicado.'],
    'Melhor 30 segundos perfeitos do que 1 minuto torto.',
    'Mejor 30 segundos perfectos que 1 minuto torcido.',
    'Deixar o quadril cair ou subir demais.',
    'Dejar caer la cadera o subirla demasiado.'
  ),
  'ex-hanging-leg-raise': g(
    ['Pendure-se na barra com os braços estendidos.', 'Eleve as pernas até a altura do quadril (ou mais), sem balançar.', 'Desça devagar controlando o corpo.'],
    ['Colgate de la barra con los brazos extendidos.', 'Elevá las piernas hasta la altura de la cadera (o más), sin balancearte.', 'Bajá despacio controlando el cuerpo.'],
    'Dobrar os joelhos facilita para quem está começando.',
    'Flexionar las rodillas lo hace más fácil para principiantes.',
    'Balançar o corpo para subir as pernas.',
    'Balancear el cuerpo para subir las piernas.'
  ),
};
