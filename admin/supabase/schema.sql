-- =====================================================================
-- GymApp · Painel administrativo — banco no Supabase (plano gratuito)
-- Como usar: Supabase → SQL Editor → New query → cole TUDO → Run.
-- Pode rodar de novo sem medo: o script só cria o que ainda não existe.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- quem pode entrar
create table if not exists admins (
  email text primary key,
  created_at timestamptz not null default now()
);

-- true quando o usuário logado está na tabela admins
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- ---------------------------------------------------------------- academias (clientes)
create table if not exists gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  country text not null check (country in ('BR', 'PY')),
  plan text not null default 'saas' check (plan in ('saas', 'licenca')),
  status text not null default 'teste' check (status in ('teste', 'ativa', 'atrasada', 'cancelada')),
  monthly_fee numeric not null default 0,
  currency text not null check (currency in ('BRL', 'PYG')),
  owner_name text not null default '',
  phone text not null default '',
  started_at date not null default current_date,
  canceled_at date,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  notes text not null default '',
  students int not null default 0,
  active_students int not null default 0,
  workouts30d int not null default 0,
  checkins30d int not null default 0,
  last_report_at timestamptz
);

-- histórico dos resumos diários (para gráficos futuros)
create table if not exists gym_metrics (
  gym_id uuid not null references gyms(id) on delete cascade,
  day date not null,
  students int not null default 0,
  active_students int not null default 0,
  workouts30d int not null default 0,
  checkins30d int not null default 0,
  app_version text,
  primary key (gym_id, day)
);

-- ---------------------------------------------------------------- financeiro
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('entrada', 'saida')),
  category text not null,
  description text not null default '',
  amount numeric not null check (amount >= 0),
  currency text not null check (currency in ('BRL', 'PYG')),
  country text not null check (country in ('BR', 'PY', 'GERAL')),
  gym_id uuid references gyms(id) on delete set null
);
create index if not exists transactions_date on transactions(date);

-- ---------------------------------------------------------------- CRM
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  gym_name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  city text not null default '',
  country text not null check (country in ('BR', 'PY')),
  stage text not null default 'lead' check (stage in ('lead', 'contato', 'demo', 'proposta', 'negociacao', 'ganho', 'perdido')),
  plan text not null default 'saas' check (plan in ('saas', 'licenca')),
  value numeric not null default 0,
  source text not null default '',
  students int not null default 0,
  next_action text not null default '',
  next_action_date date,
  lost_reason text,
  gym_id uuid references gyms(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  date timestamptz not null default now(),
  kind text not null check (kind in ('nota', 'ligacao', 'whatsapp', 'reuniao', 'demo', 'proposta', 'etapa')),
  text text not null default ''
);
create index if not exists lead_activities_lead on lead_activities(lead_id);

-- ---------------------------------------------------------------- configurações (uma linha só)
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
);
insert into settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------- segurança: só administradores
alter table admins enable row level security;
alter table gyms enable row level security;
alter table gym_metrics enable row level security;
alter table transactions enable row level security;
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['gyms', 'gym_metrics', 'transactions', 'leads', 'lead_activities', 'settings'] loop
    execute format('drop policy if exists "so_admin" on %I', t);
    execute format('create policy "so_admin" on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;
drop policy if exists "ve_a_si_mesmo" on admins;
create policy "ve_a_si_mesmo" on admins for select to authenticated using (is_admin());

-- ---------------------------------------------------------------- resumo diário vindo do servidor de cada academia
-- O servidor chama esta função com o código (token) da academia. Ela só aceita números.
create or replace function report_metrics(gym_token text, payload jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  select id into g from gyms where token = gym_token and status <> 'cancelada';
  if g is null then return false; end if;
  update gyms set
    students = greatest(0, coalesce((payload ->> 'students')::int, 0)),
    active_students = greatest(0, coalesce((payload ->> 'activeStudents')::int, 0)),
    workouts30d = greatest(0, coalesce((payload ->> 'workouts30d')::int, 0)),
    checkins30d = greatest(0, coalesce((payload ->> 'checkins30d')::int, 0)),
    last_report_at = now()
  where id = g;
  insert into gym_metrics (gym_id, day, students, active_students, workouts30d, checkins30d, app_version)
  values (g, current_date,
    greatest(0, coalesce((payload ->> 'students')::int, 0)),
    greatest(0, coalesce((payload ->> 'activeStudents')::int, 0)),
    greatest(0, coalesce((payload ->> 'workouts30d')::int, 0)),
    greatest(0, coalesce((payload ->> 'checkins30d')::int, 0)),
    left(payload ->> 'version', 20))
  on conflict (gym_id, day) do update set
    students = excluded.students, active_students = excluded.active_students,
    workouts30d = excluded.workouts30d, checkins30d = excluded.checkins30d, app_version = excluded.app_version;
  return true;
end $$;

revoke all on function report_metrics(text, jsonb) from public;
grant execute on function report_metrics(text, jsonb) to anon, authenticated;
grant execute on function is_admin() to authenticated;

-- ---------------------------------------------------------------- PASSO FINAL
-- Troque pelo SEU e-mail (o mesmo que você vai criar em Authentication → Users):
-- insert into admins (email) values ('seu-email@exemplo.com');
