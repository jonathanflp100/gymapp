"""Gera apresentacao_pt.html e apresentacao_es.html e os PDFs. Uso: python3 build_decks.py"""
import asyncio, re
from pathlib import Path
from playwright.async_api import async_playwright

D = Path("/root/work/pdf")
CSS = re.search(r"<style>(.*?)</style>", (D / "apresentacao_deitada.html").read_text(), re.S).group(1)

EXTRA = """
  .browser { width: 150mm; border-radius: 4mm; overflow: hidden; background: #0B1120; box-shadow: 0 14px 36px rgba(15,23,42,.30), 0 0 0 1px rgba(15,23,42,.5); flex-shrink: 0; }
  .browser .bar { height: 6mm; display: flex; align-items: center; gap: 1.6mm; padding: 0 3mm; background: #1E293B; }
  .browser .bar i { width: 2.2mm; height: 2.2mm; border-radius: 50%; background: #475569; display: inline-block; }
  .browser .bar span { margin-left: 3mm; font-size: 9px; color: #94A3B8; background: #0F172A; border-radius: 99px; padding: 1px 10px; }
  .browser img { display: block; width: 100%; }
  .stack { position: relative; }
  .stack .phone.over { position: absolute; right: -10mm; bottom: -8mm; }
  .note-box { margin-top: 6mm; border-left: 3px solid var(--red); background: #F8FAFC; padding: 3.5mm 5mm; font-size: 12px; color: var(--muted); border-radius: 0 3mm 3mm 0; line-height: 1.5; }
  .pricewrap { display: grid; grid-template-columns: 1.25fr 1fr; gap: 9mm; margin-top: 8mm; align-items: stretch; }
  .plan .price { font-size: 46px; }
  .plan .setup { margin-top: 3mm; display: inline-block; font-size: 13px; font-weight: 700; background: var(--red-soft); color: var(--red-dark); padding: 5px 12px; border-radius: 999px; }
  .alt { border: 1.5px dashed #CBD5E1; border-radius: 6mm; padding: 7mm 8mm; background: #F8FAFC; }
  .alt h3 { font-size: 16px; }
  .alt .price { font-family: "Inter Display", "Inter", sans-serif; font-size: 28px; font-weight: 900; margin-top: 2mm; letter-spacing: -0.02em; }
  .alt .price small { font-size: 13px; color: var(--muted); font-weight: 700; letter-spacing: 0; }
  .alt ul.checks li { font-size: 12.5px; margin: 2mm 0; }
  .alt ul.checks li::before { background: #64748B; }
  .cta-row { display: flex; gap: 4mm; margin-top: 9mm; flex-wrap: wrap; }
  .cta { font-size: 14px; font-weight: 700; padding: 3.5mm 6mm; border-radius: 999px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18); color: #E2E8F0; }
  .cta.main { background: var(--red); border-color: var(--red); color: #fff; }
"""

THEMES = {
    "pt": dict(red="#DC2626", soft="#FEE2E2", dark="#991B1B", glow="#3b0d0d", light="#F87171", lighter="#FCA5A5"),
    "es": dict(red="#2563EB", soft="#DBEAFE", dark="#1E40AF", glow="#0b1f4d", light="#60A5FA", lighter="#93C5FD"),
}

T = {
 "pt": dict(
  lang="pt-BR", title="GymApp — App da sua academia", foot="GymApp · O app da sua academia",
  cover_brand="Apresentação para academias",
  cover_h1='O app da <em>sua academia</em>, com a sua marca, no celular de cada aluno.',
  cover_sub="Treino com sugestão de carga, aulas, check-in, evolução, ideias de cardápio, página da academia e loja. Seu nome, sua logo e suas cores. Em português e em espanhol.",
  chips=["Marca própria", "Aluno · Professor · Dono", "Português e Español", "Instala sem loja de apps"],
  why_eye="Por que ter o app da sua academia",
  why_h2="Aluno que acompanha a própria evolução volta mais.<br>E aluno que volta, renova.",
  why_lead="O app transforma o treino em hábito. Você e seus professores enxergam quem está treinando e quem está sumindo, antes que ele cancele.",
  why_cards=[("★","Sua marca","Nome, logo e cores da academia em todas as telas. O aluno instala o app da <b>sua</b> academia."),
             ("↻","Mais retenção","Sequência de dias, recordes, ranking e desafios motivam a voltar. O painel mostra quem sumiu."),
             ("✎","Professor produtivo","Monta a ficha uma vez e envia para vários alunos. Chega de ficha de papel perdida."),
             ("$","Mais vendas","Página da academia para atrair alunos novos e loja de suplementos com pedido pelo WhatsApp.")],
  why_band="<b>Funciona junto com o que você já usa.</b> O app não substitui seu sistema de mensalidades e catraca: ele cuida do que acontece <b>dentro</b> da academia, que é o treino, as aulas e a evolução do aluno.",
  all_eye="O que vem no app", all_h2="Tudo num app só.", all_legend="Novidades desta versão",
  pills=["Treino do dia","Cargas e recordes","Timer de descanso","5.600 exercícios com animação","Sugestão de carga","Bi-set, drop set e aquecimento",
         "Aulas com reserva","Lista de presença","Avaliação física","Ranking do mês","Check-in por QR code","Mural de avisos","Desafios do mês",
         "Mapa do corpo","Fotos antes e depois","Alunos sumidos","Modelos de ficha","Relatório do mês","Notificações","Funciona sem internet",
         "*30 ideias de cardápio","*Nutricionista parceiro","*Página pública da academia","*Loja com pedido no WhatsApp","*Cartaz com QR da página",
         "Sua logo e cores","Português e espanhol","Instala sem loja de apps"],
  s_train=("Para o aluno · Treino","A ficha do dia no bolso, do aquecimento ao último exercício.",
   ["<b>Treino de hoje</b> com a ficha montada pelo professor","<b>Cargas anteriores</b> já preenchidas e <b>timer de descanso</b> automático",
    "<b>Recordes pessoais</b> detectados sozinhos, com comemoração no fim","<b>Mais de 5.600 exercícios</b> com passo a passo em português e espanhol",
    "<b>Animação da cadência</b>: o ritmo certo de cada repetição","<b>Lembretes</b>: aula de hoje, dias sem treinar, desafio quase completo"],
   ["Treino do dia","Séries e cargas","Guia com animação"]),
  s_smart=("Para o aluno · Treino inteligente","O app diz quanto colocar de carga. O aluno só treina.",
   [("Progressão de carga","Bateu as repetições? O app sugere subir a carga. Não bateu? Mantém. O professor escolhe a regra."),
    ("Técnicas de verdade","Aquecimento, bi-set e tri-set, drop set, rest-pause, prancha por tempo e cardio em minutos."),
    ("Máquina ocupada?","Um toque troca pelo substituto da ficha ou por outro exercício do mesmo músculo."),
    ("Sem internet","O treino continua e é salvo quando a conexão volta. A tela não apaga no meio da série.")],
   ["Sugestão de carga","Bi-set e aquecimento"]),
  s_evo=("Para o aluno · Evolução que dá para ver","Mapa do corpo, gráfico de cada exercício e fotos de antes e depois.",
   [("Mapa do corpo","Frente e costas com os músculos do treino de hoje e da semana acesos."),("Gráfico por exercício","Melhor carga e 1RM estimado ao longo dos meses."),
    ("Calendário do ano","Cada dia de treino vira um quadradinho colorido."),("Antes e depois","Fotos comparadas deslizando. Só o aluno e a equipe veem.")],
   ["Músculos da semana","Carga por exercício"]),
  s_classes=("Para o aluno · Aulas e avaliação","Reserva de aula, evolução do corpo e um empurrão a mais.",
   [("Aulas coletivas","Grade da semana, vagas restantes e reserva ou cancelamento em um toque."),
    ("Avaliação física","Peso, % de gordura, massa magra e medidas, comparando com a avaliação anterior."),
    ("Ranking do mês","Quem mais treinou aparece no topo: uma competição saudável que faz o aluno não faltar."),
    ("Peso e meta","O próprio aluno registra o peso e acompanha a meta no gráfico.")],
   ["Aulas com reserva","Avaliação física","Ranking do mês"]),
  s_engage=("Para a academia toda · Engajamento","Check-in por QR code, mural de avisos e desafios do mês.",
   [("Check-in por QR","O aluno aponta a câmera para o QR da recepção e pronto. O código muda todo dia: foto antiga não funciona."),
    ("Presença ao vivo","A equipe vê quem está na academia agora e o movimento dos últimos 7 dias."),
    ("Mural de avisos","Feriado, horário, promoção: aparece na tela inicial de todos os alunos."),
    ("Desafios do mês","\"20 treinos\", \"12 check-ins\": a academia define o prêmio e o app conta sozinho.")],
   ["Check-in e avisos","QR na TV da recepção","Desafios com prêmio"]),
  s_menu=("Novo · Ideias de cardápio","30 ideias de refeição para quem quer ganhar massa ou emagrecer.",
   ["<b>15 ideias para hipertrofia</b> e <b>15 para emagrecimento</b>, com café, almoço, lanche e jantar",
    "<b>Sem cadastro e sem conta</b>: o aluno abre e já vê a ideia do dia",
    "<b>Trocas inteligentes</b> (arroz por mandioca, frango por ovos) e dicas práticas",
    "<b>Favoritos</b> para salvar as ideias que o aluno mais gostou",
    "<b>Nutricionista parceiro</b>: a academia indica um profissional com botão de WhatsApp"],
   "Não é dieta nem prescrição. O app mostra ideias gerais com aviso claro e recomenda procurar um nutricionista, que é quem pode montar um plano alimentar individual (Lei 8.234/91). Bom para o aluno e uma parceria a mais para a academia.",
   ["Ideias do dia","Ideias de cardápio"]),
  s_page=("Novo · Página da academia e loja","Uma página para atrair alunos e uma loja dentro do app.",
   [("Página pública","Endereço próprio com fotos, horários, planos, aulas da semana e mapa. Pronta para o Instagram e o Google."),
    ("Aula experimental","Botão que abre o WhatsApp da academia com a mensagem pronta. O lead cai direto na recepção."),
    ("Loja no app","Suplementos, roupas e acessórios com foto e preço. O aluno pede pelo WhatsApp, sem taxa de marketplace."),
    ("Cartaz com QR","O dono edita tudo pelo app e imprime um cartaz com o QR code da página.")],
   ["Página no celular","Loja no app"], "suaacademia.com/academia"),
  s_teacher=("Para o professor","Acompanhar cada aluno sem planilha e sem ficha de papel.",
   ["<b>Alunos sumidos</b> há mais de 7 dias, com mensagem pronta no WhatsApp","<b>Ficha do aluno:</b> frequência, treinos, recordes e avaliações",
    "<b>Modelos prontos</b> (ABC, Push/Pull/Legs, Iniciante...) e envio para vários alunos","<b>Imprimir a ficha</b> ou salvar em PDF, com a logo da academia",
    "<b>Avaliações físicas</b> registradas pelo celular","<b>Grade de aulas</b> com vagas e lista de presença"],
   ["Alunos sumidos","Ficha do aluno","Modelos de ficha"]),
  s_owner=("Para o dono da academia","Você controla a marca, a equipe e enxerga os números.",
   [("Marca","Logo, cores, nome e slogan com prévia ao vivo. Muda na hora no celular de todos."),("Equipe","Defina quem é aluno, professor ou administrador e inative quem saiu."),
    ("Equipamentos","Marque o que a academia tem: o professor monta a ficha só com exercícios que dá para fazer aí."),
    ("Página e loja","Edite fotos, planos, produtos e preços pelo celular, sem depender de ninguém."),
    ("Relatório do mês","Ativos, treinos, check-ins, quem mais treinou, quem sumiu e aulas mais cheias, em PDF."),
    ("Notificações","Aula em 1 hora, aviso novo no mural e \"faz 5 dias que você não treina\", automático.")],
   ["Configurações","Relatório do mês"]),
  s_setup=("Como funciona a implantação","Da assinatura ao app no celular dos alunos.","A gente cuida da parte técnica. A academia só precisa enviar a logo e escolher as cores.",
   [("Sua marca","Configuramos nome, logo, cores, WhatsApp, endereço e a página da academia."),("No ar","App no endereço da academia, com conexão segura (HTTPS)."),
    ("Equipe","Professores, equipamentos, aulas da semana, loja e primeiras fichas."),("Alunos","Cartaz com QR na recepção. Conta criada em menos de um minuto.")],
   [("Dados protegidos","Cada academia com seus dados separados. Aluno vê só o que é dele."),("Backup automático","Cópia de segurança diária de contas, treinos, aulas e avaliações."),
    ("Sem loja de apps","Instala pelo navegador no Android e no iPhone, sempre atualizado."),("Suporte próximo","Direto com quem desenvolveu o app, em português e em espanhol.")]),
  price=dict(eye="Investimento", h2="Um plano só, com tudo incluso.",
   name="Assinatura GymApp", value="R$ 350", per=" /mês", note="Todas as funções deste material, para a academia inteira.",
   setup="+ implantação única de R$ 497",
   items=["App completo com a marca da academia, alunos ilimitados","Página pública, loja e ideias de cardápio incluídas","Hospedagem, segurança e backup diário",
          "Atualizações e novidades incluídas","Implantação, treinamento da equipe e suporte por WhatsApp"],
   alt_h="Prefere pagar uma vez?", alt_value="R$ 17.997", alt_pre="a partir de ", alt_note="Licença de uso, pagamento único.",
   alt_items=["Mesmo app, instalado num servidor em nome da academia","Servidor pago pela academia (cerca de R$ 30 a R$ 55/mês)","Manutenção e atualizações: sob consulta"],
   addons="<b>Opcionais sob consulta:</b> vídeos dos exercícios gravados com os professores da academia · app nas lojas (Google Play / App Store) · rede com várias unidades.",
   foot="GymApp · Valores em reais, sujeitos a alteração"),
  final=("Próximo passo","Veja o app funcionando com a marca da sua academia.",
   "Em poucos minutos montamos uma demonstração com o seu nome, sua logo e suas cores, no seu celular.",
   ["Pedir demonstração no WhatsApp","Teste agora: gymapp.jonathanflp100.workers.dev/demo"]),
 ),
 "es": dict(
  lang="es-PY", title="GymApp — La app de tu gimnasio", foot="GymApp · La app de tu gimnasio",
  cover_brand="Presentación para gimnasios",
  cover_h1='La app de <em>tu gimnasio</em>, con tu marca, en el celular de cada alumno.',
  cover_sub="Rutinas con sugerencia de carga, clases, check-in, progreso, ideas de menú, página del gimnasio y tienda. Tu nombre, tu logo y tus colores. En español y en portugués.",
  chips=["Marca propia", "Alumno · Entrenador · Dueño", "Español y Português", "Se instala sin tienda de apps"],
  why_eye="Por qué tener la app de tu gimnasio",
  why_h2="El alumno que ve su progreso vuelve más.<br>Y el alumno que vuelve, renueva.",
  why_lead="La app convierte el entrenamiento en hábito. Vos y tus entrenadores ven quién está entrenando y quién está desapareciendo, antes de que se dé de baja.",
  why_cards=[("★","Tu marca","Nombre, logo y colores del gimnasio en todas las pantallas. El alumno instala la app de <b>tu</b> gimnasio."),
             ("↻","Más retención","Racha de días, récords, ranking y desafíos motivan a volver. El panel muestra quién dejó de venir."),
             ("✎","Entrenador productivo","Arma la rutina una vez y la envía a varios alumnos. Se acabó la rutina de papel perdida."),
             ("$","Más ventas","Página del gimnasio para atraer alumnos nuevos y tienda de suplementos con pedido por WhatsApp.")],
  why_band="<b>Funciona junto con lo que ya usás.</b> La app no reemplaza tu sistema de cuotas y molinete: se encarga de lo que pasa <b>dentro</b> del gimnasio, que es el entrenamiento, las clases y el progreso del alumno.",
  all_eye="Qué trae la app", all_h2="Todo en una sola app.", all_legend="Novedades de esta versión",
  pills=["Rutina del día","Cargas y récords","Timer de descanso","5.600 ejercicios con animación","Sugerencia de carga","Bi-serie, drop set y calentamiento",
         "Clases con reserva","Lista de asistencia","Evaluación física","Ranking del mes","Check-in con código QR","Tablón de avisos","Desafíos del mes",
         "Mapa del cuerpo","Fotos antes y después","Alumnos ausentes","Modelos de rutina","Informe del mes","Notificaciones","Funciona sin internet",
         "*30 ideas de menú","*Nutricionista aliado","*Página pública del gimnasio","*Tienda con pedido por WhatsApp","*Cartel con QR de la página",
         "Tu logo y colores","Español y portugués","Se instala sin tienda de apps"],
  s_train=("Para el alumno · Entrenamiento","La rutina del día en el bolsillo, del calentamiento al último ejercicio.",
   ["<b>Rutina de hoy</b> armada por el entrenador","<b>Cargas anteriores</b> ya completadas y <b>timer de descanso</b> automático",
    "<b>Récords personales</b> detectados solos, con festejo al final","<b>Más de 5.600 ejercicios</b> con paso a paso en español y portugués",
    "<b>Animación de la cadencia</b>: el ritmo correcto de cada repetición","<b>Recordatorios</b>: clase de hoy, días sin entrenar, desafío casi completo"],
   ["Rutina del día","Series y cargas","Guía con animación"]),
  s_smart=("Para el alumno · Entrenamiento inteligente","La app dice cuánta carga poner. El alumno solo entrena.",
   [("Progresión de carga","¿Cumplió las repeticiones? La app sugiere subir la carga. ¿No? La mantiene. El entrenador elige la regla."),
    ("Técnicas de verdad","Calentamiento, bi-serie y tri-serie, drop set, rest-pause, plancha por tiempo y cardio en minutos."),
    ("¿Máquina ocupada?","Un toque la cambia por el sustituto de la rutina o por otro ejercicio del mismo músculo."),
    ("Sin internet","El entrenamiento sigue y se guarda cuando vuelve la conexión. La pantalla no se apaga en medio de la serie.")],
   ["Sugerencia de carga","Bi-serie y calentamiento"]),
  s_evo=("Para el alumno · Progreso que se ve","Mapa del cuerpo, gráfico de cada ejercicio y fotos de antes y después.",
   [("Mapa del cuerpo","Frente y espalda con los músculos de hoy y de la semana iluminados."),("Gráfico por ejercicio","Mejor carga y 1RM estimado a lo largo de los meses."),
    ("Calendario del año","Cada día de entrenamiento es un cuadradito de color."),("Antes y después","Fotos comparadas deslizando. Solo el alumno y el equipo las ven.")],
   ["Músculos de la semana","Carga por ejercicio"]),
  s_classes=("Para el alumno · Clases y evaluación","Reserva de clases, progreso del cuerpo y un empujón extra.",
   [("Clases grupales","Grilla de la semana, lugares disponibles y reserva o cancelación en un toque."),
    ("Evaluación física","Peso, % de grasa, masa magra y medidas, comparando con la evaluación anterior."),
    ("Ranking del mes","Quien más entrenó aparece arriba: una competencia sana que hace que el alumno no falte."),
    ("Peso y meta","El propio alumno registra su peso y sigue su meta en el gráfico.")],
   ["Clases con reserva","Evaluación física","Ranking del mes"]),
  s_engage=("Para todo el gimnasio · Participación","Check-in con QR, tablón de avisos y desafíos del mes.",
   [("Check-in con QR","El alumno apunta la cámara al QR de la recepción y listo. El código cambia cada día: una foto vieja no sirve."),
    ("Asistencia en vivo","El equipo ve quién está en el gimnasio ahora y el movimiento de los últimos 7 días."),
    ("Tablón de avisos","Feriado, horario, promoción: aparece en la pantalla de inicio de todos los alumnos."),
    ("Desafíos del mes","\"20 entrenos\", \"12 check-ins\": el gimnasio define el premio y la app cuenta sola.")],
   ["Check-in y avisos","QR en la TV de recepción","Desafíos con premio"]),
  s_menu=("Nuevo · Ideas de menú","30 ideas de comidas para ganar masa muscular o bajar de peso.",
   ["<b>15 ideas para ganar masa</b> y <b>15 para bajar de peso</b>, con desayuno, almuerzo, merienda y cena",
    "<b>Sin registro y sin cuenta</b>: el alumno abre y ya ve la idea del día",
    "<b>Cambios inteligentes</b> (arroz por mandi'o, pollo por huevos) y consejos prácticos",
    "<b>Favoritos</b> para guardar las ideas que más le gustaron",
    "<b>Nutricionista aliado</b>: el gimnasio recomienda un profesional con botón de WhatsApp"],
   "No es una dieta ni una prescripción. La app muestra ideas generales con un aviso claro y recomienda consultar a un nutricionista, que es quien puede armar un plan alimentario individual. Bueno para el alumno y una alianza más para el gimnasio.",
   ["Ideas del día","Ideas de menú"]),
  s_page=("Nuevo · Página del gimnasio y tienda","Una página para atraer alumnos y una tienda dentro de la app.",
   [("Página pública","Dirección propia con fotos, horarios, planes, clases de la semana y mapa. Lista para Instagram y Google."),
    ("Clase de prueba","Botón que abre el WhatsApp del gimnasio con el mensaje listo. El interesado llega directo a recepción."),
    ("Tienda en la app","Suplementos, ropa y accesorios con foto y precio. El alumno pide por WhatsApp, sin comisión de marketplace."),
    ("Cartel con QR","El dueño edita todo desde la app e imprime un cartel con el código QR de la página.")],
   ["Página en el celular","Tienda en la app"], "tugimnasio.com/academia"),
  s_teacher=("Para el entrenador","Seguir a cada alumno sin planillas y sin rutinas de papel.",
   ["<b>Alumnos ausentes</b> hace más de 7 días, con mensaje listo por WhatsApp","<b>Ficha del alumno:</b> frecuencia, entrenamientos, récords y evaluaciones",
    "<b>Modelos listos</b> (ABC, Push/Pull/Legs, Principiante...) y envío a varios alumnos","<b>Imprimir la rutina</b> o guardarla en PDF, con el logo del gimnasio",
    "<b>Evaluaciones físicas</b> cargadas desde el celular","<b>Grilla de clases</b> con lugares y lista de asistencia"],
   ["Alumnos ausentes","Ficha del alumno","Modelos de rutina"]),
  s_owner=("Para el dueño del gimnasio","Vos controlás la marca, el equipo y ves los números.",
   [("Marca","Logo, colores, nombre y eslogan con vista previa en vivo. Cambia al instante en el celular de todos."),("Equipo","Definí quién es alumno, entrenador o administrador y desactivá a quien se fue."),
    ("Equipamiento","Marcá lo que tiene el gimnasio: el entrenador arma rutinas solo con ejercicios que se pueden hacer ahí."),
    ("Página y tienda","Editá fotos, planes, productos y precios desde el celular, sin depender de nadie."),
    ("Informe del mes","Activos, entrenamientos, check-ins, quién más entrenó, quién desapareció y clases más llenas, en PDF."),
    ("Notificaciones","Clase en 1 hora, aviso nuevo en el tablón y \"hace 5 días que no entrenás\", automático.")],
   ["Configuración","Informe del mes"]),
  s_setup=("Cómo es la implementación","De la suscripción a la app en el celular de los alumnos.","Nosotros nos encargamos de la parte técnica. El gimnasio solo envía el logo y elige los colores.",
   [("Tu marca","Configuramos nombre, logo, colores, WhatsApp, dirección y la página del gimnasio."),("En línea","App en la dirección del gimnasio, con conexión segura (HTTPS)."),
    ("Equipo","Entrenadores, equipamiento, clases de la semana, tienda y primeras rutinas."),("Alumnos","Cartel con QR en recepción. Cuenta creada en menos de un minuto.")],
   [("Datos protegidos","Cada gimnasio con sus datos separados. El alumno ve solo lo suyo."),("Copia de seguridad","Respaldo diario de cuentas, entrenamientos, clases y evaluaciones."),
    ("Sin tienda de apps","Se instala desde el navegador en Android y iPhone, siempre actualizada."),("Soporte cercano","Directo con quien desarrolló la app, en español y en portugués.")]),
  price=dict(eye="Inversión", h2="Un solo plan, con todo incluido.",
   name="Suscripción GymApp", value="Gs. 400.000", per=" /mes", note="Todas las funciones de esta presentación, para todo el gimnasio.",
   setup="+ implementación única de Gs. 600.000",
   items=["App completa con la marca del gimnasio, alumnos ilimitados","Página pública, tienda e ideas de menú incluidas","Hosting, seguridad y copia de seguridad diaria",
          "Actualizaciones y novedades incluidas","Implementación, capacitación del equipo y soporte por WhatsApp"],
   alt_h="¿Preferís pagar una sola vez?", alt_value="Gs. 28.000.000", alt_pre="desde ", alt_note="Licencia de uso, pago único.",
   alt_items=["La misma app, instalada en un servidor a nombre del gimnasio","Servidor pagado por el gimnasio (Gs. 50.000 a Gs. 90.000/mes)","Mantenimiento y actualizaciones: a consultar"],
   addons="<b>Opcionales a consultar:</b> videos de los ejercicios grabados con los entrenadores del gimnasio · app en las tiendas (Google Play / App Store) · cadena con varias sedes.",
   foot="GymApp · Valores en guaraníes, sujetos a cambios"),
  final=("Próximo paso","Mirá la app funcionando con la marca de tu gimnasio.",
   "En pocos minutos armamos una demostración con tu nombre, tu logo y tus colores, en tu celular.",
   ["Pedir demostración por WhatsApp","Probala ahora: gymapp.jonathanflp100.workers.dev/demo"]),
 ),
}


def phones(srcs, caps, L, cls=""):
    return "".join(f'<div class="col"><div class="phone {cls}"><img src="shots_{L}/{s}.png"></div><div class="caption">{c}</div></div>' for s, c in zip(srcs, caps))


def feats(items, grid=True):
    inner = "".join(f'<div class="feature"><span class="tag">{t}</span><p>{p}</p></div>' for t, p in items)
    return f'<div class="grid2">{inner}</div>' if grid else f'<div style="margin-top:7mm">{inner}</div>'


def checks(items):
    return '<ul class="checks">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def build(L):
    t, th = T[L], THEMES[L]
    css = CSS.replace("#DC2626", th["red"]).replace("#FEE2E2", th["soft"]).replace("#991B1B", th["dark"]) \
             .replace("#3b0d0d", th["glow"]).replace("#F87171", th["light"]).replace("#FCA5A5", th["lighter"]) \
             .replace("rgba(220,38,38,.12)", "rgba(0,0,0,.10)")
    css += EXTRA + f":root {{ --red-dark: {th['dark']}; }}"
    n = [0]
    def foot(text=None):
        n[0] += 1
        return f'<div class="footer"><span>{text or t["foot"]}</span><span>{n[0]}</span></div>'

    S = []
    n[0] = 1
    S.append(f'''<section class="slide cover"><div class="split"><div class="text">
      <div class="brand"><span></span>{t["cover_brand"]}</div><h1>{t["cover_h1"]}</h1><p class="sub">{t["cover_sub"]}</p>
      <div class="chips">{"".join(f'<span class="chip">{c}</span>' for c in t["chips"])}</div></div>
      <div class="shots"><div class="phone sm"><img src="shots_{L}/05_aulas.png"></div><div class="phone lg mid"><img src="shots_{L}/01_home.png"></div><div class="phone sm"><img src="shots_{L}/32_publica.png"></div></div>
      </div></section>''')
    S.append(f'''<section class="slide center"><div class="eyebrow">{t["why_eye"]}</div><h2>{t["why_h2"]}</h2><p class="lead">{t["why_lead"]}</p>
      <div class="grid4">{"".join(f'<div class="card"><div class="ico">{i}</div><h3>{h}</h3><p>{p}</p></div>' for i,h,p in t["why_cards"])}</div>
      <div class="band"><p>{t["why_band"]}</p></div>{foot()}</section>''')
    pills = "".join(f'<span class="new">{p[1:]}</span>' if p.startswith("*") else f"<span>{p}</span>" for p in t["pills"])
    S.append(f'''<section class="slide center"><div class="eyebrow">{t["all_eye"]}</div><h2>{t["all_h2"]}</h2><div class="pills">{pills}</div>
      <div class="legend"><i></i>{t["all_legend"]}</div>{foot()}</section>''')

    e, h, items, caps = t["s_train"]
    S.append(f'''<section class="slide"><div class="split"><div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{checks(items)}</div>
      <div class="shots">{phones(["01_home","03_treino","04_guia"], caps, L)}</div></div>{foot()}</section>''')
    e, h, items, caps = t["s_smart"]
    S.append(f'''<section class="slide"><div class="split"><div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{feats(items)}</div>
      <div class="shots">{phones(["20_treino_sugestao","27_biset"], caps, L)}</div></div>{foot()}</section>''')
    e, h, items, caps = t["s_evo"]
    S.append(f'''<section class="slide"><div class="split"><div class="shots">{phones(["22_mapa_semana","21_evolucao_grafico"], caps, L)}</div>
      <div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{feats(items)}</div></div>{foot()}</section>''')
    e, h, items, caps = t["s_classes"]
    S.append(f'''<section class="slide"><div class="split"><div class="shots">{phones(["05_aulas","06_avaliacao","07_ranking"], caps, L)}</div>
      <div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{feats(items, grid=False)}</div></div>{foot()}</section>''')
    e, h, items, caps = t["s_engage"]
    S.append(f'''<section class="slide"><div class="split"><div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{feats(items)}</div>
      <div class="shots">{phones(["13_aluno_engaj","16_recepcao","14_desafios"], caps, L)}</div></div>{foot()}</section>''')
    e, h, items, note, caps = t["s_menu"]
    S.append(f'''<section class="slide"><div class="split"><div class="shots">{phones(["14_desafios","30_cardapio"], caps, L)}</div>
      <div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{checks(items)}<div class="note-box">{note}</div></div></div>{foot()}</section>''')
    e, h, items, caps, url = t["s_page"]
    S.append(f'''<section class="slide"><div class="split"><div class="text" style="flex:0 0 118mm"><div class="eyebrow">{e}</div><h2 style="font-size:31px">{h}</h2>{feats(items)}</div>
      <div class="shots" style="align-items:center"><div class="stack"><div class="browser"><div class="bar"><i></i><i></i><i></i><span>{url}</span></div><img src="shots_{L}/33_publica_desktop.png"></div>
      <div class="phone sm over"><img src="shots_{L}/31_loja.png"></div></div></div></div>{foot()}</section>''')
    e, h, items, caps = t["s_teacher"]
    S.append(f'''<section class="slide"><div class="split"><div class="shots">{phones(["09_prof_sumidos","10_ficha_aluno","23_modelos"], caps, L)}</div>
      <div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{checks(items)}</div></div>{foot()}</section>''')
    e, h, items, caps = t["s_owner"]
    S.append(f'''<section class="slide"><div class="split"><div class="text"><div class="eyebrow">{e}</div><h2>{h}</h2>{feats(items)}</div>
      <div class="shots">{phones(["12_config","25_relatorio"], caps, L)}</div></div>{foot()}</section>''')
    e, h, lead, steps, trust = t["s_setup"]
    S.append(f'''<section class="slide center"><div class="eyebrow">{e}</div><h2>{h}</h2><p class="lead">{lead}</p>
      <div class="steps">{"".join(f'<div class="step"><div class="n">{i+1}</div><h3>{a}</h3><p>{b}</p></div>' for i,(a,b) in enumerate(steps))}</div>
      <div class="trust">{"".join(f'<div class="card"><h3>{a}</h3><p>{b}</p></div>' for a,b in trust)}</div>{foot()}</section>''')
    p = t["price"]
    S.append(f'''<section class="slide center"><div class="eyebrow">{p["eye"]}</div><h2>{p["h2"]}</h2>
      <div class="pricewrap"><div class="plan best"><h3>{p["name"]}</h3><div class="price">{p["value"]}<small>{p["per"]}</small></div>
        <div class="note">{p["note"]}</div><div class="setup">{p["setup"]}</div>{checks(p["items"])}</div>
        <div class="alt"><h3>{p["alt_h"]}</h3><div class="price"><small>{p["alt_pre"]}</small>{p["alt_value"]}</div><div class="note" style="font-size:12.5px;color:var(--muted);margin-top:1mm">{p["alt_note"]}</div>{checks(p["alt_items"])}</div></div>
      <p class="addons">{p["addons"]}</p>{foot(p["foot"])}</section>''')
    e, h, sub, ctas = t["final"]
    S.append(f'''<section class="slide final"><div class="eyebrow" style="color:{th["lighter"]}">{e}</div><h2>{h}</h2><p>{sub}</p>
      <div class="cta-row"><span class="cta main">{ctas[0]}</span><span class="cta">{ctas[1]}</span></div>{foot()}</section>''')

    html = f'<!doctype html><html lang="{t["lang"]}"><head><meta charset="utf-8"><title>{t["title"]}</title><style>{css}</style></head><body>{"".join(S)}</body></html>'
    (D / f"apresentacao_{L}.html").write_text(html)


OUT = {"pt": "GymApp-Apresentacao-Brasil.pdf", "es": "GymApp-Presentacion-Paraguay.pdf"}

async def render():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome")
        for L in ("pt", "es"):
            pg = await b.new_page()
            await pg.goto(f"file://{D}/apresentacao_{L}.html"); await pg.wait_for_timeout(900)
            await pg.pdf(path=str(D / OUT[L]), print_background=True, prefer_css_page_size=True)
        await b.close()

for L in ("pt", "es"):
    build(L)
asyncio.run(render())
print("ok")
