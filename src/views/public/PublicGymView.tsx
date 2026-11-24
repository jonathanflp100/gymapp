import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, LogIn, MapPin, MessageCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { useBrand } from '../../context/BrandContext';
import { useLanguage } from '../../i18n/LanguageContext';
import type { PublicGym } from '../../types';
import { storefrontApi, waLink } from '../../services/storefrontApi';
import { PlanCard, ProductCard, type Lang } from '../../components/store/StoreParts';

const TXT = {
  'pt-BR': {
    trial: 'Quero uma aula experimental',
    trialMsg: 'Olá! Vi a página da academia e quero agendar uma aula experimental.',
    about: 'Sobre a academia',
    hours: 'Horário de funcionamento',
    where: 'Onde fica',
    map: 'Ver no mapa',
    plans: 'Planos',
    classes: 'Aulas da semana',
    shop: 'Loja da academia',
    student: 'Já é aluno? Entrar no app',
    days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    off: 'Esta página não está disponível no momento.',
    loading: 'Carregando…',
    error: 'Não foi possível carregar a página. Tente de novo em instantes.',
    talk: 'Falar no WhatsApp',
  },
  'es-PY': {
    trial: 'Quiero una clase de prueba',
    trialMsg: '¡Hola! Vi la página del gimnasio y quiero agendar una clase de prueba.',
    about: 'Sobre el gimnasio',
    hours: 'Horario de atención',
    where: 'Dónde estamos',
    map: 'Ver en el mapa',
    plans: 'Planes',
    classes: 'Clases de la semana',
    shop: 'Tienda del gimnasio',
    student: '¿Ya sos alumno? Entrar a la app',
    days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    off: 'Esta página no está disponible en este momento.',
    loading: 'Cargando…',
    error: 'No se pudo cargar la página. Probá de nuevo en un rato.',
    talk: 'Hablar por WhatsApp',
  },
};

export const PublicGymView: React.FC = () => {
  const { brand, brandLogoUrl } = useBrand();
  const { language } = useLanguage();
  const [data, setData] = useState<PublicGym | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    storefrontApi.publicData(brand, language).then(setData).catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lang: Lang = (data?.brand.defaultLanguage as Lang) || language;
  const t = TXT[lang];
  useEffect(() => {
    if (data) document.title = data.brand.name;
  }, [data]);

  if (error || !data)
    return <div className="min-h-screen bg-slate-950 grid place-items-center text-slate-400 text-sm p-6 text-center">{error ? t.error : t.loading}</div>;

  const b = data.brand;
  const color = b.primaryColor || '#DC2626';
  const logo = b.logoUrl || brandLogoUrl;
  const trial = waLink(b.whatsapp, t.trialMsg);

  if (!data.publicPageEnabled)
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center p-6 text-center">
        <div className="space-y-4">
          <img src={logo} alt="" className="w-16 h-16 rounded-2xl mx-auto object-cover" />
          <p className="text-slate-300">{t.off}</p>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white"><LogIn className="w-4 h-4" /> {t.student}</a>
        </div>
      </div>
    );

  const byDay = t.days.map((name, d) => ({ name, list: data.classes.filter((c) => c.weekday === d) })).filter((x) => x.list.length);
  const order = [1, 2, 3, 4, 5, 6, 0];
  byDay.sort((a, z) => order.indexOf(t.days.indexOf(a.name)) - order.indexOf(t.days.indexOf(z.name)));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* topo */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(900px 500px at 50% -10%, ${color}55, transparent 70%)` }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-6 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="w-11 h-11 rounded-xl object-cover" />
              <span className="font-black text-lg">{b.name}</span>
            </div>
            <a href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800">
              <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">{t.student}</span><span className="sm:hidden">App</span>
            </a>
          </div>
          <div className="mt-12 sm:mt-16 max-w-2xl">
            <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">{b.name}</h1>
            {b.tagline && <p className="mt-4 text-lg sm:text-xl text-slate-300">{b.tagline}</p>}
            {trial && (
              <a href={trial} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-base font-black text-white shadow-xl" style={{ backgroundColor: color, boxShadow: `0 20px 60px ${color}55` }}>
                <Sparkles className="w-5 h-5" /> {t.trial}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pb-16 space-y-14">
        {/* fotos */}
        {data.gallery.length > 0 && (
          <section className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-5 px-5" aria-label="Fotos">
            {data.gallery.map((src, i) => (
              <img key={src + i} src={src} alt="" loading="lazy" className="snap-start h-56 sm:h-72 w-auto max-w-[85vw] rounded-3xl object-cover border border-slate-800 shrink-0" />
            ))}
          </section>
        )}

        {/* sobre, horário, endereço */}
        {(data.about || data.hours || b.address) && (
          <section className="grid md:grid-cols-3 gap-4">
            {data.about && (
              <div className="md:col-span-2 rounded-3xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color }}>{t.about}</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{data.about}</p>
              </div>
            )}
            <div className="space-y-4">
              {data.hours && (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                  <h2 className="text-sm font-bold mb-1 inline-flex items-center gap-2"><Clock className="w-4 h-4" style={{ color }} /> {t.hours}</h2>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{data.hours}</p>
                </div>
              )}
              {b.address && (
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
                  <h2 className="text-sm font-bold mb-1 inline-flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color }} /> {t.where}</h2>
                  <p className="text-sm text-slate-300">{b.address}</p>
                  <a className="text-sm font-semibold mt-2 inline-block underline" style={{ color }} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}>{t.map}</a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* planos */}
        {data.plans.length > 0 && (
          <section>
            <h2 className="text-2xl font-black mb-6">{t.plans}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {data.plans.map((p) => <PlanCard key={p.id} p={p} lang={lang} whatsapp={b.whatsapp} color={color} />)}
            </div>
          </section>
        )}

        {/* aulas */}
        {byDay.length > 0 && (
          <section>
            <h2 className="text-2xl font-black mb-6 inline-flex items-center gap-2"><CalendarDays className="w-6 h-6" style={{ color }} /> {t.classes}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byDay.map((d) => (
                <div key={d.name} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                  <h3 className="font-bold mb-3">{d.name}</h3>
                  <ul className="space-y-2">
                    {d.list.map((c) => (
                      <li key={c.id} className="flex items-center gap-3 text-sm">
                        <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-mono text-slate-300 w-12">{c.time}</span>
                        <span className="flex-1 text-white font-semibold">{c.name[lang]}</span>
                        <span className="text-xs text-slate-500">{c.durationMin} min</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* loja */}
        {data.shopEnabled && data.products.length > 0 && (
          <section>
            <h2 className="text-2xl font-black mb-6 inline-flex items-center gap-2"><ShoppingBag className="w-6 h-6" style={{ color }} /> {t.shop}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.products.map((p) => <ProductCard key={p.id} p={p} lang={lang} whatsapp={b.whatsapp} color={color} />)}
            </div>
          </section>
        )}

        {/* chamada final */}
        {trial && (
          <section className="rounded-3xl p-8 text-center" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
            <h2 className="text-2xl sm:text-3xl font-black">{b.tagline || b.name}</h2>
            <a href={trial} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-black text-slate-900">
              <MessageCircle className="w-5 h-5" /> {t.trial}
            </a>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {b.name}
      </footer>

      {trial && (
        <a href={trial} target="_blank" rel="noreferrer" aria-label={t.talk} className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-[#25d366] grid place-items-center shadow-xl hover:scale-105 transition">
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
      )}
    </div>
  );
};
