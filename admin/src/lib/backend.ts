// Camada de dados: o mesmo painel funciona em dois modos.
//  - demo: dados de exemplo guardados no navegador (localStorage). Não precisa de login.
//  - supabase: banco de verdade (plano gratuito do Supabase) com login só para administradores.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { buildSeed } from './seed';
import { DEFAULT_SETTINGS } from './defaults';
import type { Db, Row, Settings, Table } from './types';

export interface Backend {
  mode: 'demo' | 'supabase';
  session(): Promise<{ email: string } | null>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  load(): Promise<Db>;
  upsert<T extends Table>(table: T, row: Row<T>): Promise<void>;
  remove(table: Table, id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  /** Só no modo demonstração: volta aos dados de exemplo. */
  reset?(): Promise<Db>;
}

// ------------------------------------------------------------------ modo demonstração

const KEY = 'gymadmin.demo.v1';
const SESSION = 'gymadmin.demo.session';

function demoBackend(): Backend {
  let cache: Db | null = null;
  const read = (): Db => {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Db;
        parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        return (cache = parsed);
      }
    } catch {}
    cache = buildSeed();
    write();
    return cache;
  };
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {}
  };
  return {
    mode: 'demo',
    async session() {
      try {
        return localStorage.getItem(SESSION) ? { email: 'demonstracao' } : null;
      } catch {
        return null;
      }
    },
    async signIn() {
      try {
        localStorage.setItem(SESSION, '1');
      } catch {}
    },
    async signOut() {
      try {
        localStorage.removeItem(SESSION);
      } catch {}
    },
    async load() {
      return structuredClone(read());
    },
    async upsert(table, row) {
      const db = read();
      const list = db[table] as { id: string }[];
      const i = list.findIndex((x) => x.id === row.id);
      if (i >= 0) list[i] = structuredClone(row);
      else list.push(structuredClone(row));
      write();
    },
    async remove(table, id) {
      const db = read();
      (db[table] as { id: string }[]) = (db[table] as { id: string }[]).filter((x) => x.id !== id);
      if (table === 'leads') db.activities = db.activities.filter((a) => a.leadId !== id);
      write();
    },
    async saveSettings(s) {
      read().settings = { ...s };
      write();
    },
    async reset() {
      cache = buildSeed();
      write();
      return structuredClone(cache);
    },
  };
}

// ------------------------------------------------------------------ Supabase

const TABLES: Record<Table, string> = {
  gyms: 'gyms',
  transactions: 'transactions',
  leads: 'leads',
  activities: 'lead_activities',
};

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function toDb(row: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  // vazio vira null nas colunas de data e de ligação (o Postgres não aceita '' nelas)
  const nullable = (k: string) => k.endsWith('At') || k.endsWith('Date') || k === 'gymId';
  for (const [k, v] of Object.entries(row)) out[toSnake(k)] = v === undefined || (v === '' && nullable(k)) ? null : v;
  return out;
}
function fromDb<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null) continue;
    out[toCamel(k)] = typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) && (k === 'amount' || k === 'value' || k === 'monthly_fee') ? Number(v) : v;
  }
  return out as T;
}

function supabaseBackend(url: string, key: string): Backend {
  const sb: SupabaseClient = createClient(url, key, { auth: { persistSession: true } });
  const check = <R extends { error: { message: string } | null }>(r: R) => {
    if (r.error) throw new Error(r.error.message);
    return r;
  };
  return {
    mode: 'supabase',
    async session() {
      const { data } = await sb.auth.getSession();
      return data.session?.user?.email ? { email: data.session.user.email } : null;
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
      const ok = await sb.rpc('is_admin');
      if (ok.error || ok.data !== true) {
        await sb.auth.signOut();
        throw new Error('Este usuário não é administrador. Cadastre o e-mail na tabela "admins".');
      }
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async load() {
      const [g, t, l, a, s] = await Promise.all([
        sb.from('gyms').select('*').order('started_at'),
        sb.from('transactions').select('*').order('date'),
        sb.from('leads').select('*').order('created_at'),
        sb.from('lead_activities').select('*').order('date'),
        sb.from('settings').select('data').eq('id', 1).maybeSingle(),
      ]);
      for (const r of [g, t, l, a, s]) check(r);
      const rows = (r: { data: unknown }) => ((r.data ?? []) as Record<string, unknown>[]).map((x) => fromDb(x));
      return {
        gyms: rows(g),
        transactions: rows(t),
        leads: rows(l),
        activities: rows(a),
        settings: { ...DEFAULT_SETTINGS, ...((s.data as { data?: Settings } | null)?.data ?? {}) },
      } as Db;
    },
    async upsert(table, row) {
      check(await sb.from(TABLES[table]).upsert(toDb(row)));
    },
    async remove(table, id) {
      check(await sb.from(TABLES[table]).delete().eq('id', id));
    },
    async saveSettings(s) {
      check(await sb.from('settings').upsert({ id: 1, data: s }));
    },
  };
}

// ------------------------------------------------------------------

const URL_ = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const KEY_ = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backend: Backend = URL_ && KEY_ ? supabaseBackend(URL_, KEY_) : demoBackend();

// exportado para os testes
export const _internals = { toDb, fromDb, toSnake, toCamel };
