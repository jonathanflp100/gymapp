import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { backend } from './backend';
import type { Db, Row, Settings, Table } from './types';

interface Store {
  db: Db;
  mode: 'demo' | 'supabase';
  upsert<T extends Table>(table: T, row: Row<T>): Promise<void>;
  remove(table: Table, id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  reload(): Promise<void>;
  reset?: () => Promise<void>;
  error: string;
  clearError(): void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setDb(await backend.load());
    } catch (e) {
      setError(`Não consegui carregar os dados: ${(e as Error).message}`);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);

  const upsert = useCallback(async <T extends Table>(table: T, row: Row<T>) => {
    // atualiza a tela na hora; se o banco recusar, avisa e recarrega
    setDb((d) => {
      if (!d) return d;
      const list = d[table] as unknown as { id: string }[];
      const i = list.findIndex((x) => x.id === row.id);
      const next = i >= 0 ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row];
      return { ...d, [table]: next };
    });
    try {
      await backend.upsert(table, row);
    } catch (e) {
      setError(`Não salvou: ${(e as Error).message}`);
      reload();
    }
  }, [reload]);

  const remove = useCallback(async (table: Table, id: string) => {
    setDb((d) => {
      if (!d) return d;
      const next = { ...d, [table]: (d[table] as { id: string }[]).filter((x) => x.id !== id) };
      if (table === 'leads') next.activities = d.activities.filter((a) => a.leadId !== id);
      return next;
    });
    try {
      await backend.remove(table, id);
    } catch (e) {
      setError(`Não apagou: ${(e as Error).message}`);
      reload();
    }
  }, [reload]);

  const saveSettings = useCallback(async (s: Settings) => {
    setDb((d) => (d ? { ...d, settings: s } : d));
    try {
      await backend.saveSettings(s);
    } catch (e) {
      setError(`Não salvou as configurações: ${(e as Error).message}`);
    }
  }, []);

  const value = useMemo<Store | null>(
    () =>
      db && {
        db,
        mode: backend.mode,
        upsert,
        remove,
        saveSettings,
        reload,
        reset: backend.reset ? async () => setDb(await backend.reset!()) : undefined,
        error,
        clearError: () => setError(''),
      },
    [db, upsert, remove, saveSettings, reload, error],
  );

  if (!value)
    return (
      <div className="min-h-screen grid place-items-center text-slate-400 text-sm">
        {error || 'Carregando dados…'}
      </div>
    );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
