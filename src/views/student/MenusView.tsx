import React, { useMemo, useState } from 'react';
import { ArrowLeft, Coffee, Heart, Info, MessageCircle, Moon, Repeat, Sun, Utensils, Apple, Sparkles } from 'lucide-react';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { MENU_IDEAS, SWAPS, TIPS, menuOfTheDay, type MenuGoal, type MenuIdea } from '../../data/menuIdeas';

const FAV_KEY = 'gymapp.menuFavorites';
const GOAL_KEY = 'gymapp.menuGoal';

const S = {
  'pt-BR': {
    title: 'Ideias de cardápio',
    subtitle: 'Sugestões para o dia a dia, de manhã até a noite',
    disclaimer: 'Estas são sugestões gerais de alimentação saudável. Não são uma dieta individual e não substituem a orientação de um nutricionista.',
    careful: 'Menor de 18 anos, grávida, amamentando ou com alguma condição de saúde (diabetes, pressão alta, problema nos rins, alergia ou histórico de transtorno alimentar)? Procure um nutricionista ou médico antes de mudar a alimentação.',
    gain: 'Ganhar massa',
    lose: 'Emagrecer',
    today: 'Sugestão de hoje',
    all: 'Todas as ideias',
    favorites: 'Favoritos',
    breakfast: 'Café da manhã',
    lunch: 'Almoço',
    snack: 'Lanche',
    dinner: 'Jantar',
    swaps: 'Trocas que você pode fazer',
    tips: 'Dicas',
    nutri: 'Quer um plano feito para você?',
    nutriText: (n: string) => `Fale com ${n}, nutricionista parceiro da academia.`,
    nutriBtn: 'Chamar no WhatsApp',
    nutriMsg: 'Olá! Vi seu contato no app da academia e quero um plano alimentar.',
    noFav: 'Toque no coração para guardar suas ideias preferidas.',
    fav: 'Favoritar',
    unfav: 'Tirar dos favoritos',
  },
  'es-PY': {
    title: 'Ideas de menú',
    subtitle: 'Sugerencias para el día a día, de la mañana a la noche',
    disclaimer: 'Estas son sugerencias generales de alimentación saludable. No son una dieta individual y no reemplazan la orientación de un nutricionista.',
    careful: '¿Menor de 18 años, embarazada, en lactancia o con alguna condición de salud (diabetes, presión alta, problemas renales, alergias o antecedentes de trastorno alimentario)? Consultá con un nutricionista o médico antes de cambiar tu alimentación.',
    gain: 'Ganar masa',
    lose: 'Bajar de peso',
    today: 'Sugerencia de hoy',
    all: 'Todas las ideas',
    favorites: 'Favoritos',
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    snack: 'Merienda',
    dinner: 'Cena',
    swaps: 'Cambios que podés hacer',
    tips: 'Consejos',
    nutri: '¿Querés un plan hecho para vos?',
    nutriText: (n: string) => `Hablá con ${n}, nutricionista aliado del gimnasio.`,
    nutriBtn: 'Escribir por WhatsApp',
    nutriMsg: '¡Hola! Vi tu contacto en la app del gimnasio y quiero un plan de alimentación.',
    noFav: 'Tocá el corazón para guardar tus ideas preferidas.',
    fav: 'Agregar a favoritos',
    unfav: 'Quitar de favoritos',
  },
};

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export const MenusView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { brand } = useBrand();
  const { language } = useLanguage();
  const s = S[language];
  const [goal, setGoalState] = useState<MenuGoal>(() => read<MenuGoal>(GOAL_KEY, 'gain'));
  const [favs, setFavs] = useState<string[]>(() => read<string[]>(FAV_KEY, []));
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const setGoal = (g: MenuGoal) => {
    setGoalState(g);
    write(GOAL_KEY, g);
    setOpen(null);
  };
  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    write(FAV_KEY, next);
  };

  const today = useMemo(() => menuOfTheDay(goal), [goal]);
  const list = MENU_IDEAS.filter((m) => m.goal === goal && (!onlyFavs || favs.includes(m.id)));
  const nutriPhone = (brand.nutritionistWhatsapp || '').replace(/\D/g, '');

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-black text-white">{s.title}</h1>
          <p className="text-xs text-slate-400">{s.subtitle}</p>
        </div>
      </div>

      {/* aviso fixo: não é dieta individual */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100 leading-relaxed flex gap-2" role="note">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
        <div>
          <p className="font-semibold">{s.disclaimer}</p>
          <p className="mt-1.5 text-amber-200/80">{s.careful}</p>
        </div>
      </div>

      {/* objetivo */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900 border border-slate-800 p-1" role="tablist">
        {(['gain', 'lose'] as const).map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={goal === g}
            onClick={() => setGoal(g)}
            className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${goal === g ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            style={goal === g ? { backgroundColor: brand.primaryColor } : undefined}
          >
            {g === 'gain' ? s.gain : s.lose}
          </button>
        ))}
      </div>

      {/* sugestão do dia */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5" style={{ color: brand.primaryColor }}>
            <Sparkles className="w-3.5 h-3.5" /> {s.today}
          </span>
          <FavButton on={favs.includes(today.id)} onClick={() => toggleFav(today.id)} label={favs.includes(today.id) ? s.unfav : s.fav} />
        </div>
        <h2 className="text-lg font-black text-white">{today.title[language]}</h2>
        <Tags m={today} lang={language} />
        <Meals m={today} lang={language} s={s} />
      </div>

      {/* lista */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{onlyFavs ? s.favorites : s.all} ({list.length})</h3>
        <button
          onClick={() => setOnlyFavs((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${onlyFavs ? 'border-rose-500/40 bg-rose-500/10 text-rose-200' : 'border-slate-700 text-slate-300'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${onlyFavs ? 'fill-current' : ''}`} /> {s.favorites}
        </button>
      </div>
      {list.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{s.noFav}</p>}
      <div className="space-y-2">
        {list.map((m) => (
          <div key={m.id} className="rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 p-3">
              <button className="flex-1 text-left min-w-0" onClick={() => setOpen(open === m.id ? null : m.id)} aria-expanded={open === m.id}>
                <div className="text-sm font-bold text-white truncate">{m.title[language]}</div>
                <div className="text-xs text-slate-400 truncate">{m.lunch[language]}</div>
              </button>
              <FavButton on={favs.includes(m.id)} onClick={() => toggleFav(m.id)} label={favs.includes(m.id) ? s.unfav : s.fav} />
            </div>
            {open === m.id && (
              <div className="px-3 pb-3">
                <Tags m={m} lang={language} />
                <Meals m={m} lang={language} s={s} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* trocas */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-sm font-bold text-white mb-3 inline-flex items-center gap-2"><Repeat className="w-4 h-4" /> {s.swaps}</h3>
        <ul className="space-y-2">
          {SWAPS.map((w) => (
            <li key={w.from['pt-BR']} className="text-sm text-slate-300">
              <span className="font-semibold text-white">{w.from[language]}</span> → {w.to[language]}
            </li>
          ))}
        </ul>
      </div>

      {/* dicas */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-sm font-bold text-white mb-3 inline-flex items-center gap-2"><Apple className="w-4 h-4" /> {s.tips}</h3>
        <ul className="space-y-2 list-disc pl-5 text-sm text-slate-300">
          {TIPS[goal].map((tip) => <li key={tip['pt-BR']}>{tip[language]}</li>)}
        </ul>
      </div>

      {/* nutricionista parceiro da academia */}
      {brand.nutritionistName && (
        <div className="rounded-3xl border p-4" style={{ borderColor: brand.primaryColor + '55', backgroundColor: brand.primaryColor + '14' }}>
          <h3 className="text-sm font-bold text-white">{s.nutri}</h3>
          <p className="text-sm text-slate-300 mt-1">{s.nutriText(brand.nutritionistName)}</p>
          {nutriPhone && (
            <a
              href={`https://wa.me/${nutriPhone}?text=${encodeURIComponent(s.nutriMsg)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white"
            >
              <MessageCircle className="w-4 h-4" /> {s.nutriBtn}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

const MEAL_ICONS = { breakfast: Coffee, lunch: Sun, snack: Utensils, dinner: Moon } as const;

function Meals({ m, lang, s }: { m: MenuIdea; lang: 'pt-BR' | 'es-PY'; s: (typeof S)['pt-BR'] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((k) => {
        const Icon = MEAL_ICONS[k];
        return (
          <li key={k} className="flex gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-800 grid place-items-center shrink-0"><Icon className="w-4 h-4 text-slate-300" /></span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s[k]}</div>
              <div className="text-sm text-slate-200 leading-snug">{m[k][lang]}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Tags({ m, lang }: { m: MenuIdea; lang: 'pt-BR' | 'es-PY' }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {m.tags.map((t) => (
        <span key={t['pt-BR']} className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">{t[lang]}</span>
      ))}
    </div>
  );
}

function FavButton({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`p-2 rounded-xl ${on ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'}`} aria-label={label} aria-pressed={on} title={label}>
      <Heart className={`w-5 h-5 ${on ? 'fill-current' : ''}`} />
    </button>
  );
}
