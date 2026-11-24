import React from 'react';
import { Flame, Dumbbell, Play, Home, CalendarDays, TrendingUp, User, CheckCircle2, Salad, ShoppingBag } from 'lucide-react';

interface Props {
  name: string;
  tagline: string;
  primary: string;
  logoUrl: string;
  isEs: boolean;
}

/** Celular de vitrine da /demo: mostra a tela inicial com o nome, a logo e a cor digitados, ao vivo. */
export const LivePhonePreview: React.FC<Props> = ({ name, tagline, primary, logoUrl, isEs }) => {
  const days = isEs ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const who = isEs ? 'Mateo' : 'Carlos';
  const nav = [Home, Dumbbell, CalendarDays, TrendingUp, User];
  return (
    <div className="relative animate-float" data-testid="demo-live-preview">
      <div className="absolute -inset-6 rounded-[48px] blur-2xl opacity-50 brand-transition" style={{ backgroundColor: primary }} />
      <div className="relative w-[190px] md:w-[250px] rounded-[38px] p-[7px] bg-slate-950 shadow-2xl ring-1 ring-white/15">
        <div className="relative rounded-[32px] overflow-hidden bg-[#020617] aspect-[9/19] flex flex-col">
          <div className="absolute top-0 inset-x-0 h-40 opacity-40 brand-transition" style={{ background: `radial-gradient(70% 100% at 50% 0%, ${primary}, transparent)` }} />
          {/* notch */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black z-10" />

          {/* header */}
          <div className="relative flex items-center gap-2 px-3 pt-8 pb-2">
            <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black text-white truncate leading-tight">{name || 'Academia'}</div>
              <div className="text-[7px] font-bold uppercase tracking-wider text-white/50">{who}</div>
            </div>
          </div>

          <div className="relative px-3 space-y-2 flex-1 min-h-0 overflow-hidden">
            {/* saudação */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-2.5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{isEs ? 'Buenos días,' : 'Bom dia,'}</div>
                  <div className="text-[13px] font-black text-white leading-tight">{who}!</div>
                  <div className="text-[7px] text-slate-400 truncate max-w-[110px]">{tagline}</div>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500 animate-flame" />
                  <span className="text-[10px] font-black text-amber-300">4</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mt-2">
                {days.map((d, i) => (
                  <div key={i} className={`rounded-md py-0.5 text-center text-[6px] font-bold ${i < 4 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-950 text-slate-600'}`}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* treino de hoje */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-2.5">
              <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-wider brand-transition" style={{ color: primary }}>
                <Dumbbell className="w-2.5 h-2.5" /> {isEs ? 'Entrenamiento de hoy' : 'Treino de hoje'}
              </div>
              <div className="text-[11px] font-black text-white mt-1 leading-tight">{isEs ? 'Rutina A · Pecho y Tríceps' : 'Treino A · Peito e Tríceps'}</div>
              <div className="mt-2 h-6 rounded-xl flex items-center justify-center gap-1 text-[8px] font-black text-white tracking-wider btn-shine brand-transition" style={{ backgroundColor: primary, boxShadow: `0 6px 16px -6px ${primary}` }}>
                <Play className="w-2.5 h-2.5 fill-white" /> {isEs ? 'EMPEZAR' : 'COMEÇAR TREINO'}
              </div>
            </div>

            {/* mini cards */}
            <div className="grid grid-cols-2 gap-2">
              {[isEs ? 'Clases' : 'Aulas', 'Ranking'].map((label, i) => (
                <div key={label} className="rounded-xl border border-white/10 bg-slate-900/80 p-2">
                  <div className="text-[6px] font-bold uppercase text-slate-400">{label}</div>
                  <div className="text-[11px] font-black text-white">{i === 0 ? '06:30' : '2º'}</div>
                  <div className="mt-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full brand-transition" style={{ width: i === 0 ? '70%' : '85%', backgroundColor: primary }} />
                  </div>
                </div>
              ))}
            </div>

            {/* check-in */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-[6px] font-black uppercase tracking-wider text-slate-400">Check-in</div>
                <div className="text-[9px] font-extrabold text-emerald-300 truncate">{isEs ? 'Hecho hoy a las 07:12' : 'Feito hoje às 07:12'}</div>
              </div>
            </div>

            {/* cardápio e loja */}
            {[
              { Icon: Salad, label: isEs ? 'Ideas de menú' : 'Ideias de cardápio' },
              { Icon: ShoppingBag, label: isEs ? 'Tienda del gimnasio' : 'Loja da academia' },
            ].map(({ Icon, label }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-slate-900/80 p-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center brand-transition" style={{ backgroundColor: `${primary}26`, color: primary }}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-[9px] font-bold text-white">{label}</span>
              </div>
            ))}
          </div>

          {/* barra inferior */}
          <div className="relative grid grid-cols-5 border-t border-white/10 bg-slate-950/90 px-2 py-2">
            {nav.map((Icon, i) => (
              <div key={i} className="flex justify-center">
                <Icon className="w-3.5 h-3.5 brand-transition" style={{ color: i === 0 ? primary : '#64748B' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
