import { useMemo, useRef, useState } from 'react';
import { Bot, KeyRound, Send, Sparkles, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { businessHealth, computeKpis, summaryForAi, type Scope } from '../lib/metrics';
import { fmtBrl, fmtPct } from '../lib/format';
import { InsightCard, PageHeader, ScopeTabs } from '../components/ui';
import { askGemini, getGeminiKey, setGeminiKey, type ChatMsg } from '../lib/gemini';

const SUGGESTIONS = [
  'O negócio está indo bem? Seja sincero.',
  'O que eu faço este mês para crescer mais rápido?',
  'Quantas academias preciso para ganhar R$ 30 mil por mês de lucro?',
  'Vale mais a pena focar no Brasil ou no Paraguai?',
  'Meus gastos estão saudáveis? Onde posso cortar?',
];

export default function AssistantPage() {
  const { db } = useStore();
  const [scope, setScope] = useState<Scope>('ALL');
  const h = useMemo(() => businessHealth(db, scope), [db, scope]);
  const k = useMemo(() => computeKpis(db, scope), [db, scope]);
  const color = h.score >= 75 ? '#34d399' : h.score >= 55 ? '#fbbf24' : '#fb7185';

  return (
    <>
      <PageHeader title="Assistente financeiro" subtitle="Regras de finanças de SaaS aplicadas aos seus números. Com uma chave do Gemini, dá para conversar também.">
        <ScopeTabs value={scope} onChange={setScope} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 mb-6">
        <section className="card p-5">
          <div className="text-sm text-slate-400">Nota de saúde do negócio</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-5xl font-black num" style={{ color }}>{h.score}</span>
            <span className="text-slate-500">/100</span>
          </div>
          <p className="text-slate-200 mt-2 font-medium">{h.verdict}</p>
          <div className="mt-5 space-y-3">
            {h.parts.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{p.label}</span>
                  <span className="text-slate-400 num">{Math.round(p.points)}/{p.max}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden" role="meter" aria-valuenow={Math.round(p.points)} aria-valuemin={0} aria-valuemax={p.max} aria-label={p.label}>
                  <div className="h-full rounded-full bg-slate-300" style={{ width: `${(p.points / p.max) * 100}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{p.note}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5 text-xs">
            <Mini label="Custo por academia (CAC)" v={fmtBrl(k.cac)} />
            <Mini label="Valor do cliente (LTV)" v={fmtBrl(k.ltv)} />
            <Mini label="LTV ÷ CAC" v={k.cac ? `${(k.ltv / k.cac).toFixed(1).replace('.', ',')}×` : '—'} />
            <Mini label="Cancelamento/mês" v={fmtPct(k.churn3)} />
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Referência: LTV pelo menos 3× o CAC e cancelamento abaixo de 3% ao mês.</p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
          {h.insights.map((i) => <InsightCard key={i.title} {...i} />)}
        </div>
      </div>

      <Chat />
    </>
  );
}

const Mini = ({ label, v }: { label: string; v: string }) => (
  <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2">
    <div className="text-slate-500">{label}</div>
    <div className="text-slate-100 font-semibold num">{v}</div>
  </div>
);

function Chat() {
  const { db } = useStore();
  const [key, setKey] = useState(getGeminiKey());
  const [draftKey, setDraftKey] = useState('');
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next: ChatMsg[] = [...msgs, { role: 'user', text: t }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    setErr('');
    try {
      const answer = await askGemini(db.settings.geminiModel, next, summaryForAi(db));
      setMsgs([...next, { role: 'model', text: answer }]);
    } catch (e) {
      setErr((e as Error).message);
      setMsgs(msgs);
      setInput(t);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  };

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-white inline-flex items-center gap-2"><Sparkles size={18} className="text-sky-300" /> Converse com o assistente (Gemini)</h2>
        {key && (
          <div className="flex gap-2">
            {msgs.length > 0 && <button className="btn btn-ghost !py-1 text-xs" onClick={() => setMsgs([])}><Trash2 size={14} /> Limpar</button>}
            <button className="btn btn-ghost !py-1 text-xs" onClick={() => { setGeminiKey(''); setKey(''); }}><KeyRound size={14} /> Remover chave</button>
          </div>
        )}
      </div>

      {!key ? (
        <div className="max-w-xl">
          <p className="text-sm text-slate-300 mb-3">
            Cole uma chave da API do Gemini (dá para criar uma de graça em <a className="text-sky-300 underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a>). A chave fica só neste navegador.
          </p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setGeminiKey(draftKey); setKey(getGeminiKey()); setDraftKey(''); }}>
            <input className="field" type="password" placeholder="Chave do Gemini" value={draftKey} onChange={(e) => setDraftKey(e.target.value)} autoComplete="off" />
            <button className="btn btn-primary" disabled={!draftKey.trim()}>Salvar</button>
          </form>
          <p className="text-xs text-slate-500 mt-3">O que vai para o Google: só os números do negócio (receita, gastos, quantidade de academias e alunos). Nomes, telefones e dados de alunos não são enviados.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-[480px] overflow-y-auto mb-3">
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-red-600/90 text-white' : 'bg-slate-800 text-slate-100'}`}>
                  {m.role === 'model' && <Bot size={14} className="inline mr-1.5 -mt-0.5 text-sky-300" />}
                  {m.text.replace(/\*\*(.+?)\*\*/g, '$1')}
                </div>
              </div>
            ))}
            {busy && <div className="text-sm text-slate-400">Pensando…</div>}
            <div ref={endRef} />
          </div>
          {err && <p className="text-sm text-rose-300 mb-2">{err}</p>}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input className="field" placeholder="Pergunte sobre o seu negócio…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn btn-primary" disabled={busy || !input.trim()} aria-label="Enviar"><Send size={16} /></button>
          </form>
        </>
      )}
    </section>
  );
}
