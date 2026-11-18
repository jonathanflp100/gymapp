import { useEffect, useState } from 'react';
import { Bot, Building2, Calculator, KanbanSquare, LayoutDashboard, LogOut, Menu, Settings as Cog, Wallet, X } from 'lucide-react';
import { backend } from './lib/backend';
import { StoreProvider, useStore } from './lib/store';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import GymsPage from './pages/GymsPage';
import FinancePage from './pages/FinancePage';
import CrmPage from './pages/CrmPage';
import AssistantPage from './pages/AssistantPage';
import EquityPage from './pages/EquityPage';
import SettingsPage from './pages/SettingsPage';

const NAV = [
  { id: 'visao', label: 'Visão geral', icon: LayoutDashboard, el: OverviewPage },
  { id: 'academias', label: 'Academias', icon: Building2, el: GymsPage },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet, el: FinancePage },
  { id: 'crm', label: 'CRM', icon: KanbanSquare, el: CrmPage },
  { id: 'assistente', label: 'Assistente', icon: Bot, el: AssistantPage },
  { id: 'valuation', label: 'Valuation e equity', icon: Calculator, el: EquityPage },
  { id: 'config', label: 'Configurações', icon: Cog, el: SettingsPage },
] as const;

const readRoute = () => {
  const r = location.hash.replace(/^#\/?/, '');
  return NAV.some((n) => n.id === r) ? r : 'visao';
};

export default function App() {
  const [user, setUser] = useState<{ email: string } | null | undefined>(undefined);
  useEffect(() => {
    backend.session().then(setUser).catch(() => setUser(null));
  }, []);
  if (user === undefined) return <div className="min-h-screen grid place-items-center text-slate-400 text-sm">Carregando…</div>;
  if (!user) return <LoginPage onLogin={setUser} />;
  return (
    <StoreProvider>
      <Shell email={user.email} onLogout={async () => { await backend.signOut(); setUser(null); }} />
    </StoreProvider>
  );
}

function Shell({ email, onLogout }: { email: string; onLogout: () => void }) {
  const { mode, error, clearError, db } = useStore();
  const [route, setRoute] = useState(readRoute);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const f = () => {
      setRoute(readRoute());
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  const Page = NAV.find((n) => n.id === route)!.el;

  const nav = (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = n.id === route;
        return (
          <a
            key={n.id}
            href={`#/${n.id}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} /> {n.label}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block border-r border-slate-800 bg-[#0a0f1c]">
        <div className="sticky top-0 h-screen flex flex-col gap-6 p-4">
        <Brand name={db.settings.companyName} />
        {nav}
        <div className="mt-auto text-xs text-slate-500 space-y-2">
          <div className="truncate" title={email}>{mode === 'demo' ? 'Modo demonstração' : email}</div>
          <button onClick={onLogout} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white">
            <LogOut size={14} /> Sair
          </button>
        </div>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-[#0a0f1c]/95 backdrop-blur px-4 py-3">
        <Brand name={db.settings.companyName} />
        <button onClick={() => setMenu(true)} className="p-2 rounded-lg text-slate-300 hover:bg-slate-800" aria-label="Abrir menu">
          <Menu size={20} />
        </button>
      </header>
      {menu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-[#0a0f1c] border-l border-slate-800 p-4 flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <Brand name={db.settings.companyName} />
              <button onClick={() => setMenu(false)} className="p-2 text-slate-400" aria-label="Fechar menu"><X size={18} /></button>
            </div>
            {nav}
            <button onClick={onLogout} className="mt-auto inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0">
        {mode === 'demo' && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-xs sm:text-sm px-4 py-2 text-center">
            Modo demonstração: os números são <strong>dados de exemplo</strong>. Ligue o Supabase para ver os dados reais.
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-200 text-sm px-4 py-2 flex justify-between gap-3">
            <span>{error}</span>
            <button onClick={clearError} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Page />
        </div>
      </main>
    </div>
  );
}

function Brand({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-600 font-black text-white">G</div>
      <div>
        <div className="font-bold text-white leading-tight">{name}</div>
        <div className="text-[11px] text-slate-500 leading-tight">Administração</div>
      </div>
    </div>
  );
}
