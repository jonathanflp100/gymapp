import { useState } from 'react';
import { Database, Download, RotateCcw, Save, Server } from 'lucide-react';
import { useStore } from '../lib/store';
import { Field, PageHeader } from '../components/ui';
import { fmtBrl } from '../lib/format';

export default function SettingsPage() {
  const { db, saveSettings, mode, reset } = useStore();
  const [s, setS] = useState(db.settings);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => { setS({ ...s, [k]: v }); setSaved(false); };

  const backup = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gymapp-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader title="Configurações" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="card p-4 sm:p-5">
          <h2 className="font-semibold text-white mb-4">Empresa e contas</h2>
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); saveSettings(s); setSaved(true); }}>
            <Field label="Nome da empresa"><input className="field" value={s.companyName} onChange={(e) => set('companyName', e.target.value)} /></Field>
            <Field label="Cotação: quantos guaranis vale R$ 1"><input className="field num" type="number" min={1} step="0.01" value={s.fxPygPerBrl} onChange={(e) => set('fxPygPerBrl', Number(e.target.value))} /></Field>
            <Field label="Dinheiro em caixa hoje (R$)"><input className="field num" type="number" min={0} step={100} value={s.cashBrl} onChange={(e) => set('cashBrl', Number(e.target.value))} /></Field>
            <Field label="Modelo do Gemini"><input className="field" value={s.geminiModel} onChange={(e) => set('geminiModel', e.target.value)} /></Field>
            <p className="sm:col-span-2 text-xs text-slate-500">
              Gs. 550.000 = {fmtBrl(550000 / (s.fxPygPerBrl || 1), true)} com essa cotação. O caixa serve para o assistente calcular quantos meses o dinheiro aguenta se der prejuízo.
            </p>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button className="btn btn-primary"><Save size={16} /> Salvar</button>
              {saved && <span className="text-sm text-emerald-300">Salvo.</span>}
            </div>
          </form>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="font-semibold text-white mb-2 inline-flex items-center gap-2"><Database size={18} /> Banco de dados</h2>
          {mode === 'demo' ? (
            <>
              <p className="text-sm text-slate-300 mb-3">
                Agora o painel está em <strong>modo demonstração</strong>: os dados ficam só neste navegador. Para usar com dados reais, crie o banco gratuito no Supabase e coloque <code className="text-sky-300">VITE_SUPABASE_URL</code> e <code className="text-sky-300">VITE_SUPABASE_ANON_KEY</code> no Cloudflare (passo a passo no README da pasta <code>admin</code>).
              </p>
              {reset && (
                <button className="btn btn-ghost" onClick={() => confirm('Voltar para os dados de exemplo? O que você mudou aqui será perdido.') && reset()}>
                  <RotateCcw size={16} /> Restaurar dados de exemplo
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-300 mb-3">Conectado ao Supabase. Só e-mails cadastrados na tabela <code>admins</code> conseguem entrar.</p>
          )}
          <div className="mt-4">
            <button className="btn btn-ghost" onClick={backup}><Download size={16} /> Baixar cópia de tudo (JSON)</button>
          </div>
        </section>

        <section className="card p-4 sm:p-5 xl:col-span-2">
          <h2 className="font-semibold text-white mb-2 inline-flex items-center gap-2"><Server size={18} /> Resumo automático das academias</h2>
          <p className="text-sm text-slate-300 mb-3">
            O servidor de cada academia pode mandar, uma vez por dia, um resumo só com números (alunos, alunos ativos, treinos e check-ins dos últimos 30 dias). Nenhum nome ou dado de aluno sai do servidor. Coloque estas variáveis no servidor da academia:
          </p>
          <pre className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-sky-200 overflow-x-auto">{`ADMIN_SUPABASE_URL=https://SEU-PROJETO.supabase.co
ADMIN_SUPABASE_ANON_KEY=sua-chave-anon-publica
ADMIN_GYM_TOKEN=(o código que aparece na ficha da academia, em Academias)`}</pre>
        </section>
      </div>
    </>
  );
}
