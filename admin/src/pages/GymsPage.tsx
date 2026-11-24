import { useMemo, useState } from 'react';
import { Copy, CreditCard, Link2, MessageCircle, Plus, Search, Trash2 } from 'lucide-react';
import { backend } from '../lib/backend';
import { useStore } from '../lib/store';
import { type Scope } from '../lib/metrics';
import { fmtDate, fmtMoney, fmtPct, today, uid, waLink } from '../lib/format';
import { Empty, Field, Modal, PageHeader, ScopeTabs, flag } from '../components/ui';
import { GYM_STATUS_LABEL, type Gym, type GymStatus } from '../lib/types';

const STATUS_CLS: Record<GymStatus, string> = {
  ativa: 'text-emerald-300 bg-emerald-500/10',
  teste: 'text-sky-300 bg-sky-500/10',
  atrasada: 'text-amber-300 bg-amber-500/10',
  cancelada: 'text-slate-400 bg-slate-500/10',
};

export const newGym = (over: Partial<Gym> = {}): Gym => ({
  id: uid(),
  name: '',
  city: '',
  country: 'BR',
  plan: 'saas',
  status: 'teste',
  monthlyFee: 350,
  currency: 'BRL',
  ownerName: '',
  phone: '',
  startedAt: today(),
  token: uid().replace(/-/g, ''),
  notes: '',
  students: 0,
  activeStudents: 0,
  workouts30d: 0,
  checkins30d: 0,
  ...over,
});

const ago = (iso?: string) => {
  if (!iso) return 'nunca';
  const h = (Date.now() - Date.parse(iso)) / 3_600_000;
  if (h < 1) return 'agora há pouco';
  if (h < 24) return `há ${Math.floor(h)} h`;
  return `há ${Math.floor(h / 24)} dia(s)`;
};

export default function GymsPage() {
  const { db, upsert, remove } = useStore();
  const [scope, setScope] = useState<Scope>('ALL');
  const [status, setStatus] = useState<GymStatus | 'todas'>('todas');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Gym | null>(null);

  const list = useMemo(
    () =>
      db.gyms
        .filter((g) => scope === 'ALL' || g.country === scope)
        .filter((g) => status === 'todas' || g.status === status)
        .filter((g) => !q || `${g.name} ${g.city} ${g.ownerName}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [db.gyms, scope, status, q],
  );

  return (
    <>
      <PageHeader title="Academias" subtitle={`${list.length} de ${db.gyms.length} academias`}>
        <ScopeTabs value={scope} onChange={setScope} />
        <button className="btn btn-primary" onClick={() => setEdit(newGym())}>
          <Plus size={16} /> Nova academia
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="field pl-9" placeholder="Buscar por nome, cidade ou dono" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value as GymStatus | 'todas')} aria-label="Filtrar por situação">
          <option value="todas">Todas as situações</option>
          {Object.entries(GYM_STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <Empty>Nenhuma academia com esse filtro.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-800">
                <th className="px-4 py-3 font-medium">Academia</th>
                <th className="px-3 py-3 font-medium">Situação</th>
                <th className="px-3 py-3 font-medium">Plano</th>
                <th className="px-3 py-3 font-medium text-right">Mensalidade</th>
                <th className="px-3 py-3 font-medium text-right">Alunos</th>
                <th className="px-3 py-3 font-medium text-right">Uso (30 dias)</th>
                <th className="px-3 py-3 font-medium">Último resumo</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((g) => {
                const use = g.students ? g.activeStudents / g.students : 0;
                const stale = g.status !== 'cancelada' && g.lastReportAt && Date.now() - Date.parse(g.lastReportAt) > 48 * 3_600_000;
                return (
                  <tr key={g.id} className="border-b border-slate-800/70 hover:bg-slate-800/30 cursor-pointer" onClick={() => setEdit(g)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{flag(g.country)} {g.name}</div>
                      <div className="text-xs text-slate-500">{g.city} · desde {fmtDate(g.startedAt)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[g.status]}`}>{GYM_STATUS_LABEL[g.status]}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{g.plan === 'saas' ? 'Mensal' : 'Licença'}</td>
                    <td className="px-3 py-3 text-right num text-slate-200">{g.plan === 'saas' ? fmtMoney(g.monthlyFee, g.currency) : '—'}</td>
                    <td className="px-3 py-3 text-right num text-slate-200">{g.activeStudents}/{g.students}</td>
                    <td className={`px-3 py-3 text-right num ${use < 0.3 && g.students ? 'text-amber-300' : 'text-slate-200'}`}>{g.students ? fmtPct(use) : '—'}</td>
                    <td className={`px-3 py-3 text-xs ${stale ? 'text-amber-300' : 'text-slate-400'}`}>{ago(g.lastReportAt)}</td>
                    <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {g.phone && (
                        <a href={waLink(g.phone)} target="_blank" rel="noreferrer" className="inline-flex p-1.5 rounded-lg text-emerald-400 hover:bg-slate-800" title="WhatsApp" aria-label={`WhatsApp de ${g.name}`}>
                          <MessageCircle size={16} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {edit && <GymForm
        key={edit.id}
        gym={edit}
        onClose={() => setEdit(null)}
        onSave={(g) => {
          upsert('gyms', g);
          setEdit(null);
        }}
        onDelete={(g) => {
          if (confirm(`Apagar a academia "${g.name}"? Os lançamentos financeiros dela continuam.`)) {
            remove('gyms', g.id);
            setEdit(null);
          }
        }}
        exists={db.gyms.some((x) => x.id === edit.id)}
      />}
    </>
  );
}

function GymForm({ gym, onClose, onSave, onDelete, exists }: { gym: Gym; onClose: () => void; onSave: (g: Gym) => void; onDelete: (g: Gym) => void; exists: boolean }) {
  const [g, setG] = useState<Gym>(gym);
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof Gym>(k: K, v: Gym[K]) => setG({ ...g, [k]: v });
  const setCountry = (c: Gym['country']) =>
    setG({ ...g, country: c, currency: c === 'BR' ? 'BRL' : 'PYG', monthlyFee: g.plan === 'saas' ? (c === 'BR' ? 350 : 400000) : 0 });
  const env = `ADMIN_GYM_TOKEN=${g.token}`;

  return (
    <Modal open title={exists ? g.name || 'Academia' : 'Nova academia'} onClose={onClose} wide>
      <form
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const next = { ...g };
          if (next.status === 'cancelada' && !next.canceledAt) next.canceledAt = today();
          if (next.status !== 'cancelada') next.canceledAt = undefined;
          onSave(next);
        }}
      >
        <Field label="Nome da academia"><input className="field" required value={g.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Cidade"><input className="field" value={g.city} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label="País">
          <select className="field" value={g.country} onChange={(e) => setCountry(e.target.value as Gym['country'])}>
            <option value="BR">🇧🇷 Brasil</option>
            <option value="PY">🇵🇾 Paraguai</option>
          </select>
        </Field>
        <Field label="Situação">
          <select className="field" value={g.status} onChange={(e) => set('status', e.target.value as GymStatus)}>
            {Object.entries(GYM_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Plano">
          <select className="field" value={g.plan} onChange={(e) => {
            const plan = e.target.value as Gym['plan'];
            setG({ ...g, plan, monthlyFee: plan === 'saas' ? (g.country === 'BR' ? 350 : 400000) : 0 });
          }}>
            <option value="saas">Mensal (SaaS)</option>
            <option value="licenca">Licença de uso (pagamento único)</option>
          </select>
        </Field>
        <Field label={`Mensalidade (${g.currency === 'BRL' ? 'R$' : 'Gs.'})`}>
          <input className="field num" type="number" min={0} step="any" disabled={g.plan !== 'saas'} value={g.monthlyFee} onChange={(e) => set('monthlyFee', Number(e.target.value))} />
        </Field>
        <Field label="Dono / responsável"><input className="field" value={g.ownerName} onChange={(e) => set('ownerName', e.target.value)} /></Field>
        <Field label="WhatsApp (com DDI)"><input className="field" inputMode="tel" placeholder="5587999990000" value={g.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Começou em"><input className="field" type="date" value={g.startedAt} onChange={(e) => set('startedAt', e.target.value)} /></Field>
        {g.status === 'cancelada' && (
          <Field label="Cancelou em"><input className="field" type="date" value={g.canceledAt || today()} onChange={(e) => set('canceledAt', e.target.value)} /></Field>
        )}
        <Field label="Observações" className="sm:col-span-2"><textarea className="field min-h-[70px]" value={g.notes} onChange={(e) => set('notes', e.target.value)} /></Field>

        <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <div className="text-xs text-slate-400 mb-1">Código do servidor desta academia (o servidor manda o resumo diário com ele):</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs text-sky-300">{env}</code>
            <button type="button" className="btn btn-ghost !py-1 !px-2 text-xs" onClick={() => { navigator.clipboard?.writeText(env); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              <Copy size={14} /> {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          {exists && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              <Stat label="Alunos" v={g.students} />
              <Stat label="Ativos 30d" v={g.activeStudents} />
              <Stat label="Treinos 30d" v={g.workouts30d} />
              <Stat label="Check-ins 30d" v={g.checkins30d} />
            </div>
          )}
        </div>

        {exists && g.plan === 'saas' && <BillingBox gym={g} />}

        <div className="sm:col-span-2 flex justify-between gap-2 pt-2">
          {exists ? (
            <button type="button" className="btn btn-ghost text-rose-300" onClick={() => onDelete(g)}><Trash2 size={16} /> Apagar</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary">Salvar</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const Stat = ({ label, v }: { label: string; v: number }) => (
  <div className="rounded-lg bg-slate-900 p-2">
    <div className="text-slate-500">{label}</div>
    <div className="text-slate-100 font-semibold num">{v}</div>
  </div>
);

/** Cobrança automática: gera o link da Stripe e manda pelo WhatsApp. */
function BillingBox({ gym }: { gym: Gym }) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const es = gym.country === 'PY';
  const msg = es
    ? `¡Hola${gym.ownerName ? ' ' + gym.ownerName.split(' ')[0] : ''}! Este es el link para activar la suscripción mensual de la app de ${gym.name}: ${link}`
    : `Olá${gym.ownerName ? ' ' + gym.ownerName.split(' ')[0] : ''}! Este é o link para ativar a assinatura mensal do app da ${gym.name}: ${link}`;
  const generate = async () => {
    setBusy(true);
    setErr('');
    try {
      setLink(await backend.paymentLink(gym.id));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-100 inline-flex items-center gap-1.5"><CreditCard size={16} /> Cobrança automática (Stripe)</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {gym.stripeSubscriptionId ? 'Assinatura ligada: os pagamentos entram sozinhos no Financeiro.' : 'Sem assinatura ainda. Gere o link e mande para o dono da academia.'}
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={generate} disabled={busy}>
          <Link2 size={16} /> {busy ? 'Gerando…' : gym.stripeSubscriptionId ? 'Novo link' : 'Gerar link de pagamento'}
        </button>
      </div>
      {err && <p className="text-xs text-amber-300 mt-2">{err}</p>}
      {link && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 truncate text-xs text-sky-300">{link}</code>
          <button type="button" className="btn btn-ghost !py-1 !px-2 text-xs" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            <Copy size={14} /> {copied ? 'Copiado' : 'Copiar'}
          </button>
          {gym.phone && (
            <a className="btn btn-ghost !py-1 !px-2 text-xs text-emerald-300" href={waLink(gym.phone, msg)} target="_blank" rel="noreferrer">
              <MessageCircle size={14} /> Mandar no WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
