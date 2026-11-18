import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, MessageCircle, Phone, Plus, Search, Send, Trash2, Trophy, XCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { type Scope } from '../lib/metrics';
import { fmtBrl, fmtDate, fmtMoney, fmtPct, toBrl, today, uid, waLink } from '../lib/format';
import { Field, Kpi, Modal, PageHeader, ScopeTabs, flag } from '../components/ui';
import { LEAD_SOURCES, STAGES, type ActivityKind, type Lead, type LeadActivity, type LeadStage } from '../lib/types';
import { newGym } from './GymsPage';

const KIND_LABEL: Record<ActivityKind, string> = {
  nota: 'Nota',
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  reuniao: 'Reunião',
  demo: 'Demonstração',
  proposta: 'Proposta',
  etapa: 'Mudança de etapa',
};

const stageLabel = (s: LeadStage) => STAGES.find((x) => x.id === s)!.label;
const cur = (l: Lead) => (l.country === 'BR' ? 'BRL' : 'PYG');

export default function CrmPage() {
  const { db, upsert, remove } = useStore();
  const fx = db.settings.fxPygPerBrl;
  const [scope, setScope] = useState<Scope>('ALL');
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [open, setOpen] = useState<Lead | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStage | null>(null);

  const leads = useMemo(
    () =>
      db.leads
        .filter((l) => scope === 'ALL' || l.country === scope)
        .filter((l) => !source || l.source === source)
        .filter((l) => !q || `${l.gymName} ${l.contactName} ${l.city}`.toLowerCase().includes(q.toLowerCase())),
    [db.leads, scope, source, q],
  );
  const openLeads = leads.filter((l) => l.stage !== 'ganho' && l.stage !== 'perdido');
  const won = leads.filter((l) => l.stage === 'ganho');
  const lost = leads.filter((l) => l.stage === 'perdido');
  const weighted = openLeads.reduce((s, l) => s + toBrl(l.value, cur(l), fx) * (STAGES.find((x) => x.id === l.stage)?.prob ?? 0) * (l.plan === 'saas' ? 1 : 0), 0);
  const conv = won.length + lost.length ? won.length / (won.length + lost.length) : 0;
  const overdue = openLeads.filter((l) => l.nextActionDate && l.nextActionDate < today()).length;

  const moveTo = (lead: Lead, stage: LeadStage, extra: Partial<Lead> = {}) => {
    if (lead.stage === stage && !Object.keys(extra).length) return;
    const now = new Date().toISOString();
    const next: Lead = { ...lead, ...extra, stage, updatedAt: now };
    upsert('leads', next);
    if (lead.stage !== stage)
      upsert('activities', { id: uid(), leadId: lead.id, date: now, kind: 'etapa', text: `${stageLabel(lead.stage)} → ${stageLabel(stage)}` });
    return next;
  };

  const blank = (): Lead => {
    const now = new Date().toISOString();
    const c = scope === 'PY' ? 'PY' : 'BR';
    return { id: uid(), gymName: '', contactName: '', phone: '', email: '', city: '', country: c, stage: 'lead', plan: 'saas', value: c === 'BR' ? 350 : 550000, source: 'Indicação', students: 0, nextAction: 'Primeiro contato pelo WhatsApp', nextActionDate: today(), createdAt: now, updatedAt: now };
  };

  return (
    <>
      <PageHeader title="CRM" subtitle="Funil de vendas das academias. Arraste os cartões entre as etapas.">
        <ScopeTabs value={scope} onChange={setScope} />
        <button className="btn btn-primary" onClick={() => setOpen(blank())}><Plus size={16} /> Novo lead</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi label="Negociações abertas" value={String(openLeads.length)} hint={overdue ? `${overdue} com retorno atrasado` : 'nenhum retorno atrasado'} tone={overdue ? 'bad' : 'good'} />
        <Kpi label="MRR previsto no funil" value={fmtBrl(weighted)} hint="ponderado pela chance de cada etapa" />
        <Kpi label="Taxa de fechamento" value={fmtPct(conv)} hint={`${won.length} ganhos · ${lost.length} perdidos`} />
        <Kpi label="Ganhos" value={String(won.length)} hint="leads que viraram academia" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="field pl-9" placeholder="Buscar academia, contato ou cidade" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field w-auto" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Origem">
          <option value="">Todas as origens</option>
          {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
        {STAGES.map((st) => {
          const col = leads.filter((l) => l.stage === st.id).sort((a, b) => (a.nextActionDate || '9').localeCompare(b.nextActionDate || '9'));
          const total = col.reduce((s, l) => s + toBrl(l.value, cur(l), fx), 0);
          return (
            <div
              key={st.id}
              className={`snap-start shrink-0 w-[270px] rounded-2xl border p-2 transition-colors ${over === st.id ? 'border-sky-500 bg-sky-500/5' : 'border-slate-800 bg-slate-900/40'}`}
              onDragOver={(e) => { e.preventDefault(); setOver(st.id); }}
              onDragLeave={() => setOver(null)}
              onDrop={() => {
                const l = db.leads.find((x) => x.id === drag);
                setOver(null);
                setDrag(null);
                if (!l || l.stage === st.id) return;
                if (st.id === 'perdido' || st.id === 'ganho') setOpen({ ...l, stage: st.id });
                else moveTo(l, st.id);
              }}
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-semibold text-slate-200">{st.label} <span className="text-slate-500 font-normal">{col.length}</span></span>
                <span className="text-[11px] text-slate-500 num">{fmtBrl(total)}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {col.map((l) => {
                  const late = l.nextActionDate && l.nextActionDate < today() && st.id !== 'ganho' && st.id !== 'perdido';
                  return (
                    <button
                      key={l.id}
                      draggable
                      onDragStart={() => setDrag(l.id)}
                      onDragEnd={() => { setDrag(null); setOver(null); }}
                      onClick={() => setOpen(l)}
                      className={`w-full text-left rounded-xl border bg-[#0f172a] p-3 hover:border-slate-600 ${drag === l.id ? 'opacity-50' : ''} ${late ? 'border-rose-500/40' : 'border-slate-800'}`}
                    >
                      <div className="text-sm font-medium text-slate-100 truncate">{flag(l.country)} {l.gymName || 'Sem nome'}</div>
                      <div className="text-xs text-slate-400 truncate">{l.contactName} · {l.city}</div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-slate-300 num">{fmtMoney(l.value, cur(l))}{l.plan === 'saas' ? '/mês' : ' licença'}</span>
                        {l.nextActionDate && st.id !== 'ganho' && st.id !== 'perdido' && (
                          <span className={`inline-flex items-center gap-1 num ${late ? 'text-rose-300' : 'text-slate-400'}`}>
                            <CalendarClock size={12} /> {fmtDate(l.nextActionDate).slice(0, 5)}
                          </span>
                        )}
                        {st.id === 'perdido' && l.lostReason && <span className="text-slate-500 truncate ml-2">{l.lostReason}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <LeadSheet
          key={open.id + open.stage}
          lead={open}
          exists={db.leads.some((l) => l.id === open.id)}
          activities={db.activities.filter((a) => a.leadId === open.id).sort((a, b) => b.date.localeCompare(a.date))}
          onClose={() => setOpen(null)}
          onSave={(l) => {
            const prev = db.leads.find((x) => x.id === l.id);
            if (prev) moveTo(prev, l.stage, l);
            else {
              upsert('leads', l);
              upsert('activities', { id: uid(), leadId: l.id, date: new Date().toISOString(), kind: 'nota', text: 'Lead cadastrado.' });
            }
            setOpen(null);
          }}
          onDelete={(l) => { if (confirm(`Apagar o lead "${l.gymName}" e o histórico dele?`)) { remove('leads', l.id); setOpen(null); } }}
          onActivity={(a) => upsert('activities', a)}
          onWin={(l) => {
            const gym = newGym({ name: l.gymName, city: l.city, country: l.country, currency: cur(l), plan: l.plan, monthlyFee: l.plan === 'saas' ? l.value : 0, ownerName: l.contactName, phone: l.phone, status: 'teste', notes: `Veio do CRM (${l.source}).` });
            upsert('gyms', gym);
            const prev = db.leads.find((x) => x.id === l.id);
            if (prev) moveTo(prev, 'ganho', { ...l, gymId: gym.id, nextAction: 'Implantação', nextActionDate: undefined });
            else upsert('leads', { ...l, stage: 'ganho', gymId: gym.id });
            setOpen(null);
            location.hash = '#/academias';
          }}
        />
      )}
    </>
  );
}

function LeadSheet({ lead, exists, activities, onClose, onSave, onDelete, onActivity, onWin }: {
  lead: Lead;
  exists: boolean;
  activities: LeadActivity[];
  onClose: () => void;
  onSave: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onActivity: (a: LeadActivity) => void;
  onWin: (l: Lead) => void;
}) {
  const [l, setL] = useState(lead);
  const [kind, setKind] = useState<ActivityKind>('nota');
  const [text, setText] = useState('');
  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setL({ ...l, [k]: v });
  const needReason = l.stage === 'perdido' && !l.lostReason;
  const msg = l.country === 'BR'
    ? `Olá ${l.contactName.split(' ')[0] || ''}! Aqui é do GymApp, o app da sua academia com a sua marca. Posso te mostrar como funciona?`
    : `¡Hola ${l.contactName.split(' ')[0] || ''}! Te escribo de GymApp, la app de tu gimnasio con tu marca. ¿Te muestro cómo funciona?`;

  const addActivity = () => {
    if (!text.trim()) return;
    onActivity({ id: uid(), leadId: l.id, date: new Date().toISOString(), kind, text: text.trim() });
    setText('');
  };

  return (
    <Modal open wide title={exists ? l.gymName || 'Lead' : 'Novo lead'} onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <form
          id="lead-form"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={(e) => { e.preventDefault(); if (!needReason) onSave({ ...l, updatedAt: new Date().toISOString() }); }}
        >
          <Field label="Academia"><input className="field" required value={l.gymName} onChange={(e) => set('gymName', e.target.value)} /></Field>
          <Field label="Contato (nome)"><input className="field" value={l.contactName} onChange={(e) => set('contactName', e.target.value)} /></Field>
          <Field label="WhatsApp (com DDI)"><input className="field" inputMode="tel" value={l.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="E-mail"><input className="field" type="email" value={l.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Cidade"><input className="field" value={l.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="País">
            <select className="field" value={l.country} onChange={(e) => { const c = e.target.value as Lead['country']; setL({ ...l, country: c, value: l.plan === 'saas' ? (c === 'BR' ? 350 : 550000) : c === 'BR' ? 17997 : 28000000 }); }}>
              <option value="BR">🇧🇷 Brasil</option>
              <option value="PY">🇵🇾 Paraguai</option>
            </select>
          </Field>
          <Field label="Etapa">
            <select className="field" value={l.stage} onChange={(e) => set('stage', e.target.value as LeadStage)}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Origem">
            <select className="field" value={l.source} onChange={(e) => set('source', e.target.value)}>
              {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Plano">
            <select className="field" value={l.plan} onChange={(e) => { const p = e.target.value as Lead['plan']; setL({ ...l, plan: p, value: p === 'saas' ? (l.country === 'BR' ? 350 : 550000) : l.country === 'BR' ? 17997 : 28000000 }); }}>
              <option value="saas">Mensal (SaaS)</option>
              <option value="licenca">Licença de uso</option>
            </select>
          </Field>
          <Field label={`Valor (${l.country === 'BR' ? 'R$' : 'Gs.'}${l.plan === 'saas' ? ' por mês' : ''})`}>
            <input className="field num" type="number" min={0} step="any" value={l.value} onChange={(e) => set('value', Number(e.target.value))} />
          </Field>
          <Field label="Alunos da academia (aprox.)"><input className="field num" type="number" min={0} value={l.students || ''} onChange={(e) => set('students', Number(e.target.value))} /></Field>
          <Field label="Próximo passo — data"><input className="field" type="date" value={l.nextActionDate || ''} onChange={(e) => set('nextActionDate', e.target.value || undefined)} /></Field>
          <Field label="Próximo passo" className="sm:col-span-2"><input className="field" value={l.nextAction} onChange={(e) => set('nextAction', e.target.value)} /></Field>
          {l.stage === 'perdido' && (
            <Field label="Por que perdemos? (obrigatório)" className="sm:col-span-2">
              <input className={`field ${needReason ? '!border-rose-500' : ''}`} value={l.lostReason || ''} onChange={(e) => set('lostReason', e.target.value)} placeholder="Ex.: achou caro, já usa outro sistema…" />
            </Field>
          )}
          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
            {l.phone && (
              <a className="btn btn-ghost text-emerald-300" href={waLink(l.phone, msg)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>
            )}
            {l.phone && <a className="btn btn-ghost" href={`tel:+${l.phone.replace(/\D/g, '')}`}><Phone size={16} /> Ligar</a>}
            {!l.gymId && l.stage !== 'perdido' && (
              <button type="button" className="btn bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => l.gymName && onWin(l)} disabled={!l.gymName}>
                <Trophy size={16} /> Fechou! Criar academia
              </button>
            )}
            {l.gymId && <span className="inline-flex items-center gap-1 text-sm text-emerald-300"><CheckCircle2 size={16} /> Virou academia</span>}
            {l.stage !== 'perdido' && exists && (
              <button type="button" className="btn btn-ghost text-slate-300" onClick={() => set('stage', 'perdido')}><XCircle size={16} /> Perdido</button>
            )}
          </div>
        </form>

        <div className="lg:border-l lg:border-slate-800 lg:pl-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Histórico</h3>
          {exists ? (
            <>
              <div className="flex gap-2 mb-2">
                <select className="field !w-auto text-xs" value={kind} onChange={(e) => setKind(e.target.value as ActivityKind)} aria-label="Tipo de registro">
                  {(['nota', 'ligacao', 'whatsapp', 'reuniao', 'demo', 'proposta'] as ActivityKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mb-4">
                <input className="field" placeholder="O que aconteceu?" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())} />
                <button type="button" className="btn btn-ghost !px-3" onClick={addActivity} aria-label="Registrar"><Send size={16} /></button>
              </div>
              <ol className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {activities.map((a) => (
                  <li key={a.id} className="border-l-2 border-slate-700 pl-3">
                    <div className="text-[11px] text-slate-500">{fmtDate(a.date)} · {KIND_LABEL[a.kind]}</div>
                    <div className="text-sm text-slate-300">{a.text}</div>
                  </li>
                ))}
                {!activities.length && <li className="text-sm text-slate-500">Nada registrado ainda.</li>}
              </ol>
            </>
          ) : (
            <p className="text-sm text-slate-500">Salve o lead para registrar ligações, mensagens e reuniões.</p>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-5 mt-5 border-t border-slate-800">
        {exists ? <button type="button" className="btn btn-ghost text-rose-300" onClick={() => onDelete(l)}><Trash2 size={16} /> Apagar</button> : <span />}
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button form="lead-form" className="btn btn-primary" disabled={needReason}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}
