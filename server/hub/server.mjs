/**
 * GymApp Hub — servidor da academia.
 *
 * Fica ao lado do openGym (que guarda contas e treinos de cada aluno) e cuida do
 * que é da ACADEMIA: marca e configurações, equipe e papéis, fichas criadas pelo
 * professor, aulas coletivas e reservas, avaliações físicas, resumo dos treinos
 * para o professor e ranking.
 *
 * Sem dependências: só Node 20+. Dados em arquivos JSON na pasta DATA_DIR.
 * Login: reaproveita a sessão do openGym (o cookie é conferido em OPENGYM_URL/api/me).
 *
 * Variáveis:
 *   PORT=4000  DATA_DIR=/data  OPENGYM_URL=http://api:3000
 *   SETUP_CODE=...   código para ativar o administrador (dono) da academia
 *   GYM_NAME, GYM_COLOR, GYM_LANG (pt-BR|es-PY), GYM_CODE   valores iniciais da marca
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { generateVapidKeys, sendPush } from './webpush.mjs';

const PORT = Number(process.env.PORT || 4000);
const DATA_DIR = process.env.DATA_DIR || path.resolve('data');
const OPENGYM_URL = (process.env.OPENGYM_URL || 'http://localhost:3000').replace(/\/$/, '');
const SETUP_CODE = process.env.SETUP_CODE || '';
const MAX_BODY = 1_500_000; // 1,5 MB (logo em base64 cabe folgado)

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------------------------------------------------------------- armazenamento

const COLLECTIONS = ['settings', 'members', 'routines', 'classes', 'bookings', 'assessments', 'activity', 'announcements', 'checkins', 'challenges', 'secret', 'inventory', 'photos', 'push'];

const defaults = {
  settings: () => ({
    id: 'gym',
    name: process.env.GYM_NAME || 'Minha Academia',
    tagline: process.env.GYM_TAGLINE || 'Treine com a gente',
    logoUrl: '',
    primaryColor: process.env.GYM_COLOR || '#DC2626',
    secondaryColor: '#111827',
    accentColor: process.env.GYM_COLOR || '#EF4444',
    defaultLanguage: process.env.GYM_LANG === 'es-PY' ? 'es-PY' : 'pt-BR',
    whatsapp: '',
    address: '',
    gymCode: process.env.GYM_CODE || 'ACADEMIA',
    country: process.env.GYM_LANG === 'es-PY' ? 'PY' : 'BR',
    updatedAt: new Date().toISOString(),
  }),
  members: () => ({}),
  routines: () => [],
  classes: () => [],
  bookings: () => [],
  assessments: () => [],
  activity: () => [],
  announcements: () => [],
  checkins: () => [],
  challenges: () => [],
  secret: () => ({ key: crypto.randomBytes(32).toString('hex') }),
  // Equipamentos que a academia tem (null = mostrar o catálogo inteiro) e exercícios ocultos
  inventory: () => ({ kits: null, hidden: [] }),
  // fotos de evolução: só os dados; as imagens ficam em DATA_DIR/fotos/<aluno>/<id>.jpg
  photos: () => [],
  // notificações: chaves VAPID e inscrições dos aparelhos
  push: () => null,
};

const db = {};
for (const name of COLLECTIONS) {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    db[name] = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    db[name] = defaults[name]();
  }
}

const dirty = new Set();
// a chave do check-in é criada uma vez e guardada
if (!fs.existsSync(path.join(DATA_DIR, 'secret.json'))) setTimeout(() => save('secret'), 0);
let flushTimer = null;
function save(name) {
  dirty.add(name);
  if (!flushTimer) flushTimer = setTimeout(flush, 150);
}
function flush() {
  flushTimer = null;
  for (const name of dirty) {
    const file = path.join(DATA_DIR, `${name}.json`);
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db[name]));
    fs.renameSync(tmp, file); // troca atômica: nunca deixa arquivo pela metade
  }
  dirty.clear();
}
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    flush();
    process.exit(0);
  });
}

// ---------------------------------------------------------------- utilidades

const id = (prefix) => `${prefix}-${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isHex = (s) => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
};
const localDay = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  res.writeHead(status, {
    'Content-Type': isBuf ? headers['Content-Type'] || 'application/octet-stream' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(isBuf ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Arquivo grande demais'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------- autenticação (sessão do openGym)

const sessionCache = new Map(); // cookie -> { user, at }

async function currentUser(req) {
  const cookie = req.headers.cookie || '';
  if (!cookie) return null;
  const hit = sessionCache.get(cookie);
  if (hit && Date.now() - hit.at < 30_000) return hit.user;
  try {
    const r = await fetch(`${OPENGYM_URL}/api/me`, { headers: { cookie } });
    const user = r.ok ? (await r.json()).user : null;
    sessionCache.set(cookie, { user, at: Date.now() });
    if (sessionCache.size > 5000) sessionCache.delete(sessionCache.keys().next().value);
    return user;
  } catch {
    throw new HttpError(502, 'Servidor de contas indisponível');
  }
}

function hasOwner() {
  return Object.values(db.members).some((m) => m.role === 'owner');
}

/** Garante que o usuário logado existe como membro e devolve o membro. */
function touchMember(user) {
  let m = db.members[user.id];
  if (!m) {
    m = db.members[user.id] = {
      id: user.id,
      name: user.name,
      role: 'student',
      plan: 'Mensal',
      status: 'active',
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };
    save('members');
  } else {
    const now = Date.now();
    if (m.name !== user.name || now - Date.parse(m.lastSeen || 0) > 10 * 60_000) {
      m.name = user.name;
      m.lastSeen = new Date(now).toISOString();
      save('members');
    }
  }
  return m;
}

const isStaff = (m) => m && (m.role === 'owner' || m.role === 'teacher');

// ---------------------------------------------------------------- regras de negócio

function memberStats(memberId) {
  const list = db.activity.filter((a) => a.studentId === memberId);
  const since30 = Date.now() - 30 * 86_400_000;
  const days = [...new Set(list.map((a) => localDay(Date.parse(a.completedAt))))].sort();
  // sequência: dias seguidos terminando hoje ou ontem
  let streak = 0;
  if (days.length) {
    const set = new Set(days);
    let cursor = Date.now();
    if (!set.has(localDay(cursor))) cursor -= 86_400_000;
    while (set.has(localDay(cursor))) {
      streak++;
      cursor -= 86_400_000;
    }
  }
  const last = list.reduce((acc, a) => (!acc || a.completedAt > acc ? a.completedAt : acc), '');
  return {
    workouts30: list.filter((a) => Date.parse(a.completedAt) >= since30).length,
    totalWorkouts: list.length,
    streak,
    lastWorkoutAt: last || null,
  };
}

function publicMember(m) {
  return { ...m, stats: memberStats(m.id) };
}

function occurrences(date, userId) {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const now = Date.now();
  return db.classes
    .filter((c) => c.weekday === weekday && !c.archived)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((cls) => {
      const list = db.bookings.filter((b) => b.classId === cls.id && b.date === date);
      return {
        cls,
        date,
        booked: list.length,
        isBookedByMe: !!userId && list.some((b) => b.studentId === userId),
        isPast: new Date(`${date}T${cls.time}:00`).getTime() < now,
      };
    });
}

function cleanSettings(input, current) {
  const out = { ...current };
  for (const k of ['name', 'tagline', 'whatsapp', 'address']) {
    const v = str(input[k], k === 'address' ? 160 : 80);
    if (v !== undefined) out[k] = v;
  }
  const code = str(input.gymCode, 16);
  if (code !== undefined) out.gymCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '') || current.gymCode;
  for (const k of ['primaryColor', 'secondaryColor', 'accentColor']) if (isHex(input[k])) out[k] = input[k];
  if (input.defaultLanguage === 'pt-BR' || input.defaultLanguage === 'es-PY') {
    out.defaultLanguage = input.defaultLanguage;
    out.country = input.defaultLanguage === 'es-PY' ? 'PY' : 'BR';
  }
  if (typeof input.logoUrl === 'string') {
    if (input.logoUrl === '') out.logoUrl = '';
    else if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.logoUrl) && input.logoUrl.length < 1_000_000)
      out.logoUrl = input.logoUrl;
    else throw new HttpError(400, 'Logo inválida (use PNG, JPG ou WebP)');
  }
  if (!out.name) throw new HttpError(400, 'Informe o nome da academia');
  out.updatedAt = new Date().toISOString();
  return out;
}

// Campos avançados da ficha: tipo, técnica, aquecimento, bi-set, substituto e progressão
function cleanAdvanced(e) {
  const out = {};
  if (['reps', 'time', 'cardio'].includes(e.kind)) out.kind = e.kind;
  const dur = Number(e.durationSec) > 0 ? num(e.durationSec, 5, 7200) : undefined;
  if (dur) out.durationSec = dur;
  if (['normal', 'dropset', 'restpause'].includes(e.technique)) out.technique = e.technique;
  const wu = num(e.warmupSets, 0, 5);
  if (wu) out.warmupSets = wu;
  if (e.groupWithNext === true) out.groupWithNext = true;
  const alt = str(e.alternativeId, 60);
  if (alt) out.alternativeId = alt;
  if (['none', 'linear', 'double'].includes(e.progression)) out.progression = e.progression;
  const inc = Number(e.incrementKg) > 0 ? num(e.incrementKg, 0.25, 50) : undefined;
  if (inc) out.incrementKg = inc;
  return out;
}

function cleanRoutine(r, member) {
  if (!r || typeof r !== 'object') throw new HttpError(400, 'Ficha inválida');
  const name = str(r.name, 80);
  if (!name) throw new HttpError(400, 'Dê um nome à ficha');
  const exercises = Array.isArray(r.exercises) ? r.exercises.slice(0, 40) : [];
  return {
    id: str(r.id, 60) || id('rt'),
    name,
    description: str(r.description, 300) || '',
    category: str(r.category, 12) || 'FullBody',
    targetMuscleGroups: Array.isArray(r.targetMuscleGroups) ? r.targetMuscleGroups.slice(0, 12).map((m) => String(m).slice(0, 20)) : [],
    exercises: exercises.map((e, i) => ({
      id: str(e.id, 60) || `ex${i}`,
      exerciseId: str(e.exerciseId, 60) || '',
      sets: num(e.sets, 1, 20) ?? 3,
      reps: str(String(e.reps ?? '10'), 12),
      targetWeightKg: num(e.targetWeightKg, 0, 1000) ?? 0,
      restSeconds: num(e.restSeconds, 0, 900) ?? 90,
      notes: str(e.notes, 200) || undefined,
      ...cleanAdvanced(e),
    })),
    createdById: r.createdById || member.id,
    assignedStudentIds: Array.isArray(r.assignedStudentIds) ? r.assignedStudentIds.map(String).slice(0, 2000) : [],
    updatedAt: localDay(),
  };
}

function iconSvg(s) {
  const initials = s.name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'GA';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${s.primaryColor}"/><text x="256" y="300" font-family="Arial,Helvetica,sans-serif" font-size="190" font-weight="900" text-anchor="middle" fill="#fff">${initials}</text></svg>`;
}

// ---------------------------------------------------------------- rotas

const routes = [];
const route = (method, pattern, handler, opts = {}) => {
  const keys = [];
  const re = new RegExp(
    '^' + pattern.replace(/:([a-zA-Z]+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$'
  );
  routes.push({ method, re, keys, handler, ...opts });
};

// público
route('GET', '/api/hub/health', () => ({ ok: true }), { public: true });
route('GET', '/api/hub/settings', () => db.settings, { public: true });
route(
  'GET',
  '/api/hub/icon',
  (ctx, req, res) => {
    const s = db.settings;
    const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(s.logoUrl || '');
    if (m) return send(res, 200, Buffer.from(m[2], 'base64'), { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=300' });
    return send(res, 200, Buffer.from(iconSvg(s)), { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' });
  },
  { public: true, raw: true }
);
route(
  'GET',
  '/api/hub/manifest.webmanifest',
  (ctx, req, res) => {
    const s = db.settings;
    const type = /^data:(image\/[a-z]+)/.exec(s.logoUrl || '')?.[1] || 'image/svg+xml';
    send(
      res,
      200,
      {
        id: '/',
        name: s.name,
        short_name: s.name.slice(0, 12),
        description: s.tagline,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#090d16',
        theme_color: s.primaryColor,
        icons: [{ src: `/api/hub/icon?v=${Date.parse(s.updatedAt) || 1}`, sizes: '192x192 512x512', type, purpose: 'any' }],
      },
      { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=300' }
    );
  },
  { public: true, raw: true }
);

// sessão
route('GET', '/api/hub/me', ({ user, member }) => ({ user, member: publicMember(member), hasOwner: hasOwner() }));

route('POST', '/api/hub/claim', ({ member, body }) => {
  if (!SETUP_CODE) throw new HttpError(403, 'Ativação desligada neste servidor');
  if (hasOwner() && member.role !== 'owner') throw new HttpError(409, 'A academia já tem administrador');
  const a = Buffer.from(String(body.code || ''));
  const b = Buffer.from(SETUP_CODE);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(403, 'Código incorreto');
  member.role = 'owner';
  save('members');
  return { member: publicMember(member) };
});

// configurações
route('PUT', '/api/hub/settings', ({ member, body }) => {
  if (member.role !== 'owner') throw new HttpError(403, 'Só o administrador altera as configurações');
  db.settings = cleanSettings(body, db.settings);
  save('settings');
  return db.settings;
});

// equipe e alunos
route('GET', '/api/hub/members', ({ member }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe vê a lista de alunos');
  return Object.values(db.members).map(publicMember).sort((a, b) => a.name.localeCompare(b.name));
});
route('GET', '/api/hub/members/:id', ({ member, params }) => {
  if (!isStaff(member) && member.id !== params.id) throw new HttpError(403, 'Sem acesso');
  const m = db.members[params.id];
  if (!m) throw new HttpError(404, 'Aluno não encontrado');
  return publicMember(m);
});
route('PUT', '/api/hub/members/:id', ({ member, params, body }) => {
  const target = db.members[params.id];
  if (!target) throw new HttpError(404, 'Aluno não encontrado');
  const self = target.id === member.id;
  if (!isStaff(member) && !self) throw new HttpError(403, 'Sem acesso');
  // Perfil físico: o próprio aluno ou a equipe
  for (const k of ['heightCm', 'targetWeightKg']) {
    const v = num(body[k], 0, 400);
    if (v !== undefined) target[k] = v;
  }
  if (['M', 'F', 'O'].includes(body.gender)) target.gender = body.gender;
  // Administrativo: só a equipe
  if (isStaff(member)) {
    if (['Mensal', 'Trimestral', 'Semestral', 'Anual'].includes(body.plan)) target.plan = body.plan;
    if (['active', 'inactive'].includes(body.status)) target.status = body.status;
    const notes = str(body.notes, 500);
    if (notes !== undefined) target.notes = notes;
  }
  // Papel: só o dono, e o dono não se rebaixa sozinho
  if (body.role !== undefined) {
    if (member.role !== 'owner') throw new HttpError(403, 'Só o administrador muda papéis');
    if (!['student', 'teacher', 'owner'].includes(body.role)) throw new HttpError(400, 'Papel inválido');
    if (self && body.role !== 'owner') throw new HttpError(400, 'Promova outro administrador antes de sair do cargo');
    target.role = body.role;
  }
  save('members');
  return publicMember(target);
});

// fichas criadas pela equipe
route('GET', '/api/hub/routines', ({ member }) =>
  isStaff(member) ? db.routines : db.routines.filter((r) => r.assignedStudentIds.includes(member.id))
);
route('PUT', '/api/hub/routines', ({ member, body }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe cria fichas');
  const r = cleanRoutine(body, member);
  const i = db.routines.findIndex((x) => x.id === r.id);
  if (i >= 0) db.routines[i] = { ...r, createdById: db.routines[i].createdById };
  else db.routines.unshift(r);
  save('routines');
  return r;
});
route('DELETE', '/api/hub/routines/:id', ({ member, params }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe exclui fichas');
  db.routines = db.routines.filter((r) => r.id !== params.id);
  save('routines');
  return { ok: true };
});
route('POST', '/api/hub/routines/:id/assign', ({ member, params, body }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe atribui fichas');
  const r = db.routines.find((x) => x.id === params.id);
  if (!r) throw new HttpError(404, 'Ficha não encontrada');
  const ids = Array.isArray(body.studentIds) ? body.studentIds.map(String) : [];
  r.assignedStudentIds = [...new Set([...r.assignedStudentIds, ...ids])];
  save('routines');
  return r;
});

// aulas coletivas
route('GET', '/api/hub/classes', ({ member, query }) => {
  const date = isDay(query.get('date')) ? query.get('date') : localDay();
  return occurrences(date, member.id);
});
route('GET', '/api/hub/classes/mine', ({ member }) => {
  const now = Date.now();
  return db.bookings
    .filter((b) => b.studentId === member.id)
    .map((b) => {
      const cls = db.classes.find((c) => c.id === b.classId && !c.archived);
      if (!cls || new Date(`${b.date}T${cls.time}:00`).getTime() < now) return null;
      return {
        cls,
        date: b.date,
        booked: db.bookings.filter((x) => x.classId === cls.id && x.date === b.date).length,
        isBookedByMe: true,
        isPast: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.date + a.cls.time).localeCompare(b.date + b.cls.time));
});
route('POST', '/api/hub/classes', ({ member, body }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe cria aulas');
  const time = /^\d{2}:\d{2}$/.test(body.time) ? body.time : null;
  const weekday = num(body.weekday, 0, 6);
  const name = body.name && str(body.name['pt-BR'], 60);
  if (!time || weekday === undefined || !name) throw new HttpError(400, 'Preencha nome, dia e horário');
  const bi = (v, max) => ({ 'pt-BR': str(v?.['pt-BR'], max) || '', 'es-PY': str(v?.['es-PY'], max) || str(v?.['pt-BR'], max) || '' });
  const cls = {
    id: id('cl'),
    name: bi(body.name, 60),
    description: bi(body.description, 300),
    weekday: Math.round(weekday),
    time,
    durationMin: num(body.durationMin, 10, 240) ?? 50,
    teacherId: str(body.teacherId, 60) || member.id,
    teacherName: str(body.teacherName, 60) || member.name,
    room: bi(body.room, 40),
    capacity: Math.round(num(body.capacity, 1, 500) ?? 15),
    color: isHex(body.color) ? body.color : '#22c55e',
    intensity: [1, 2, 3].includes(body.intensity) ? body.intensity : 2,
  };
  db.classes.push(cls);
  save('classes');
  return cls;
});
route('DELETE', '/api/hub/classes/:id', ({ member, params }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe exclui aulas');
  const cls = db.classes.find((c) => c.id === params.id);
  if (cls) cls.archived = true; // mantém o histórico de presença
  db.bookings = db.bookings.filter((b) => !(b.classId === params.id && b.date >= localDay()));
  save('classes');
  save('bookings');
  return { ok: true };
});
route('GET', '/api/hub/classes/:id/attendees', ({ member, params, query }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe vê a lista de presença');
  const date = query.get('date');
  return db.bookings
    .filter((b) => b.classId === params.id && b.date === date)
    .map((b) => ({ id: b.studentId, name: db.members[b.studentId]?.name || '—', at: b.at }));
});
route('POST', '/api/hub/bookings', ({ member, body }) => {
  const cls = db.classes.find((c) => c.id === body.classId && !c.archived);
  if (!cls || !isDay(body.date)) throw new HttpError(404, 'Aula não encontrada');
  if (new Date(`${body.date}T12:00:00`).getDay() !== cls.weekday) throw new HttpError(400, 'Essa aula não acontece nesse dia');
  if (new Date(`${body.date}T${cls.time}:00`).getTime() < Date.now()) throw new HttpError(400, 'Essa aula já aconteceu');
  if (member.status === 'inactive') throw new HttpError(403, 'Matrícula inativa. Fale com a recepção.');
  const already = db.bookings.some((b) => b.classId === cls.id && b.date === body.date && b.studentId === member.id);
  if (already) return { ok: true };
  const count = db.bookings.filter((b) => b.classId === cls.id && b.date === body.date).length;
  if (count >= cls.capacity) return { ok: false, reason: 'full' };
  db.bookings.push({ classId: cls.id, date: body.date, studentId: member.id, at: new Date().toISOString() });
  save('bookings');
  return { ok: true };
});
route('DELETE', '/api/hub/bookings', ({ member, query }) => {
  const classId = query.get('classId');
  const date = query.get('date');
  db.bookings = db.bookings.filter((b) => !(b.classId === classId && b.date === date && b.studentId === member.id));
  save('bookings');
  return { ok: true };
});

// avaliações físicas
route('GET', '/api/hub/assessments', ({ member, query }) => {
  const studentId = query.get('studentId') || member.id;
  if (!isStaff(member) && studentId !== member.id) throw new HttpError(403, 'Sem acesso');
  return db.assessments.filter((a) => a.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date));
});
route('POST', '/api/hub/assessments', ({ member, body }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe registra avaliações');
  if (!db.members[body.studentId]) throw new HttpError(404, 'Aluno não encontrado');
  const f = (k, min, max) => num(body[k], min, max) ?? 0;
  const a = {
    id: id('as'),
    studentId: body.studentId,
    teacherId: member.id,
    teacherName: member.name,
    date: isDay(body.date) ? body.date : localDay(),
    weightKg: f('weightKg', 0, 400),
    bodyFatPct: f('bodyFatPct', 0, 80),
    muscleMassKg: f('muscleMassKg', 0, 200),
    waistCm: f('waistCm', 0, 300),
    hipCm: f('hipCm', 0, 300),
    chestCm: f('chestCm', 0, 300),
    armCm: f('armCm', 0, 100),
    thighCm: f('thighCm', 0, 150),
    restingHr: f('restingHr', 0, 250),
    notes: str(body.notes, 500) || undefined,
  };
  db.assessments.push(a);
  save('assessments');
  return a;
});

// resumo dos treinos (o aluno envia ao terminar; o professor acompanha)
const cleanActivity = (body, member) => ({
    id: str(body.id, 60) || id('wk'),
    studentId: member.id,
    routineId: str(body.routineId, 60),
    routineName: str(body.routineName, 100) || '—',
    startedAt: str(body.startedAt, 40) || new Date().toISOString(),
    completedAt: str(body.completedAt, 40) || new Date().toISOString(),
    durationMinutes: num(body.durationMinutes, 0, 600) ?? 0,
    totalVolumeKg: num(body.totalVolumeKg, 0, 1e7) ?? 0,
    totalSets: num(body.totalSets, 0, 500) ?? 0,
    muscleGroups: Array.isArray(body.muscleGroups) ? body.muscleGroups.slice(0, 12).map(String) : [],
    personalRecordsBroken: Array.isArray(body.personalRecordsBroken) ? body.personalRecordsBroken.slice(0, 20).map(String) : [],
    exercises: Array.isArray(body.exercises) ? body.exercises.slice(0, 40) : [],
  ...(body.manual === true ? { manual: true } : {}),
});
route('POST', '/api/hub/activity', ({ member, body }) => {
  const entry = cleanActivity(body, member);
  if (!db.activity.some((a) => a.id === entry.id && a.studentId === member.id)) {
    db.activity.push(entry);
    if (db.activity.length > 200_000) db.activity.splice(0, db.activity.length - 200_000);
    save('activity');
  }
  return { ok: true };
});
route('PUT', '/api/hub/activity/:id', ({ member, params, body }) => {
  const i = db.activity.findIndex((a) => a.id === params.id && a.studentId === member.id);
  if (i < 0) throw new HttpError(404, 'Treino não encontrado');
  db.activity[i] = cleanActivity({ ...body, id: params.id }, member);
  save('activity');
  return { ok: true };
});
route('DELETE', '/api/hub/activity/:id', ({ member, params }) => {
  db.activity = db.activity.filter((a) => !(a.id === params.id && a.studentId === member.id));
  save('activity');
  return { ok: true };
});
route('GET', '/api/hub/activity', ({ member, query }) => {
  const studentId = query.get('studentId') || member.id;
  if (!isStaff(member) && studentId !== member.id) throw new HttpError(403, 'Sem acesso');
  return db.activity
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 200);
});

// ranking do mês (frequência)
route('GET', '/api/hub/ranking', ({ member }) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const counts = new Map();
  for (const a of db.activity) {
    if (Date.parse(a.completedAt) < start) continue;
    const day = localDay(Date.parse(a.completedAt));
    if (!counts.has(a.studentId)) counts.set(a.studentId, new Set());
    counts.get(a.studentId).add(day);
  }
  const rows = [...counts.entries()]
    .map(([sid, days]) => ({ id: sid, name: db.members[sid]?.name || '—', days: days.size }))
    .filter((r) => db.members[r.id]?.role === 'student')
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));
  const staff = isStaff(member);
  return {
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    rows: rows.slice(0, 20).map((r, i) => ({
      position: i + 1,
      id: r.id,
      // alunos veem só o primeiro nome dos colegas
      name: staff || r.id === member.id ? r.name : r.name.split(' ')[0],
      days: r.days,
      isMe: r.id === member.id,
    })),
    me: (() => {
      const i = rows.findIndex((r) => r.id === member.id);
      return i >= 0 ? { position: i + 1, days: rows[i].days, total: rows.length } : null;
    })(),
  };
});

// painel da equipe
route('GET', '/api/hub/stats', ({ member }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Sem acesso');
  const students = Object.values(db.members).filter((m) => m.role === 'student');
  const stats = students.map((m) => ({ m, s: memberStats(m.id) }));
  const week = Date.now() - 7 * 86_400_000;
  const today = occurrences(localDay(), null);
  return {
    students: students.length,
    active7: stats.filter(({ s }) => s.lastWorkoutAt && Date.parse(s.lastWorkoutAt) >= week).length,
    atRisk: stats
      .filter(({ m, s }) => m.status === 'active' && (!s.lastWorkoutAt || Date.parse(s.lastWorkoutAt) < week))
      .map(({ m, s }) => ({ id: m.id, name: m.name, lastWorkoutAt: s.lastWorkoutAt, joinedAt: m.joinedAt }))
      .sort((a, b) => (a.lastWorkoutAt || '').localeCompare(b.lastWorkoutAt || ''))
      .slice(0, 30),
    workouts7: db.activity.filter((a) => Date.parse(a.completedAt) >= week).length,
    checkinsToday: db.checkins.filter((c) => c.date === localDay()).length,
    classesToday: today.length,
    bookedToday: today.reduce((n, o) => n + o.booked, 0),
    capacityToday: today.reduce((n, o) => n + o.cls.capacity, 0),
  };
});


// ---------------------------------------------------------------- relatório do mês (dono e equipe)

route('GET', '/api/hub/report', ({ member, query }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Sem acesso');
  const now = new Date();
  const month = /^\d{4}-\d{2}$/.test(query.get('month') || '') ? query.get('month') : localDay().slice(0, 7);
  const [y, mo] = month.split('-').map(Number);
  const start = new Date(y, mo - 1, 1).getTime();
  const end = Math.min(new Date(y, mo, 1).getTime(), now.getTime() + 86_400_000);
  const inMonth = (iso) => {
    const t = Date.parse(iso);
    return t >= start && t < end;
  };
  const students = Object.values(db.members).filter((m) => m.role === 'student');
  const active = students.filter((m) => m.status === 'active');
  const acts = db.activity.filter((a) => inMonth(a.completedAt) && db.members[a.studentId]?.role === 'student');
  const daysBy = new Map();
  const weekday = [0, 0, 0, 0, 0, 0, 0];
  for (const a of acts) {
    const d = localDay(Date.parse(a.completedAt));
    if (!daysBy.has(a.studentId)) daysBy.set(a.studentId, new Set());
    daysBy.get(a.studentId).add(d);
    weekday[new Date(Date.parse(a.completedAt)).getDay()]++;
  }
  const week = Date.now() - 7 * 86_400_000;
  const classCount = new Map();
  for (const b of db.bookings) if (b.date.startsWith(month)) classCount.set(b.classId, (classCount.get(b.classId) || 0) + 1);
  const busiest = weekday.indexOf(Math.max(...weekday));
  return {
    month,
    activeStudents: active.length,
    totalStudents: students.length,
    newStudents: students.filter((m) => m.joinedAt && inMonth(m.joinedAt)).length,
    trainedMonth: daysBy.size,
    totalWorkouts: acts.length,
    checkins: db.checkins.filter((c) => c.date.startsWith(month)).length,
    busiestWeekday: acts.length ? busiest : null,
    topStudents: [...daysBy.entries()]
      .map(([sid, days]) => ({ name: db.members[sid]?.name || '—', days: days.size }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5),
    atRisk: active
      .map((m) => ({ name: m.name, last: memberStats(m.id).lastWorkoutAt }))
      .filter((x) => !x.last || Date.parse(x.last) < week)
      .map((x) => ({ name: x.name, days: x.last ? Math.floor((Date.now() - Date.parse(x.last)) / 86_400_000) : null }))
      .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999))
      .slice(0, 10),
    classes: [...classCount.entries()]
      .map(([cid, n]) => ({ name: db.classes.find((c) => c.id === cid)?.name ?? '—', bookings: n }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5),
    challenges: db.challenges
      .filter((c) => c.month === month)
      .map((c) => ({ title: c.title, done: active.filter((m) => challengeProgress(c, m.id) >= c.target).length })),
  };
});

// ---------------------------------------------------------------- mural de avisos

route('GET', '/api/hub/announcements', () => {
  const now = new Date().toISOString();
  return db.announcements
    .filter((a) => !a.expiresAt || a.expiresAt >= now.slice(0, 10))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);
});
route('POST', '/api/hub/announcements', ({ member, body }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe publica avisos');
  const title = str(body.title, 80);
  if (!title) throw new HttpError(400, 'Escreva o título do aviso');
  const a = {
    id: id('av'),
    title,
    body: str(body.body, 600) || '',
    kind: ['info', 'promo', 'alert'].includes(body.kind) ? body.kind : 'info',
    pinned: !!body.pinned,
    expiresAt: isDay(body.expiresAt) ? body.expiresAt : null,
    authorName: member.name,
    createdAt: new Date().toISOString(),
  };
  db.announcements.unshift(a);
  save('announcements');
  // avisa no celular de todos (sem esperar o envio terminar)
  notify(null, { title: pickName(db.settings.name) || a.title, body: a.body ? `${a.title}: ${a.body}`.slice(0, 180) : a.title, tag: a.id, url: '/' }).catch(
    () => undefined
  );
  return a;
});
route('DELETE', '/api/hub/announcements/:id', ({ member, params }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe apaga avisos');
  db.announcements = db.announcements.filter((a) => a.id !== params.id);
  save('announcements');
  return { ok: true };
});

// ---------------------------------------------------------------- check-in por QR code

/** Código do dia (muda à meia-noite). Quem não está na academia não tem como saber. */
function checkinCode(day = localDay()) {
  return crypto.createHmac('sha256', db.secret.key).update(`checkin:${day}`).digest('base64url').slice(0, 10);
}

route('GET', '/api/hub/checkin/code', ({ member }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe abre o modo recepção');
  const today = localDay();
  return { code: checkinCode(today), date: today, count: db.checkins.filter((c) => c.date === today).length };
});
route('POST', '/api/hub/checkin', ({ member, body }) => {
  const today = localDay();
  const given = Buffer.from(String(body.code || ''));
  const expected = Buffer.from(checkinCode(today));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected))
    throw new HttpError(400, 'QR code inválido ou de outro dia. Leia o QR da recepção de novo.');
  if (member.status === 'inactive') throw new HttpError(403, 'Matrícula inativa. Fale com a recepção.');
  const already = db.checkins.find((c) => c.studentId === member.id && c.date === today);
  if (already) return { ok: true, already: true, at: already.at };
  const c = { studentId: member.id, date: today, at: new Date().toISOString() };
  db.checkins.push(c);
  save('checkins');
  return { ok: true, already: false, at: c.at };
});
route('GET', '/api/hub/checkins', ({ member, query }) => {
  const studentId = query.get('studentId') || member.id;
  if (!isStaff(member) && studentId !== member.id) throw new HttpError(403, 'Sem acesso');
  return db.checkins
    .filter((c) => c.studentId === studentId)
    .map((c) => ({ date: c.date, at: c.at }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 400);
});
route('GET', '/api/hub/checkins/stats', ({ member }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Sem acesso');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = localDay(Date.now() - i * 86_400_000);
    days.push({ date: d, count: db.checkins.filter((c) => c.date === d).length });
  }
  const today = localDay();
  return {
    days,
    today: db.checkins
      .filter((c) => c.date === today)
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((c) => ({ id: c.studentId, name: db.members[c.studentId]?.name || '—', at: c.at })),
  };
});

// ---------------------------------------------------------------- desafios do mês

const monthOf = (iso) => String(iso).slice(0, 7);

function challengeProgress(ch, studentId) {
  if (ch.metric === 'checkins') return db.checkins.filter((c) => c.studentId === studentId && monthOf(c.date) === ch.month).length;
  if (ch.metric === 'classes')
    return db.bookings.filter(
      (b) => b.studentId === studentId && monthOf(b.date) === ch.month && b.date <= localDay()
    ).length;
  // treinos: dias diferentes com treino registrado
  return new Set(
    db.activity.filter((a) => a.studentId === studentId && monthOf(localDay(Date.parse(a.completedAt))) === ch.month)
      .map((a) => localDay(Date.parse(a.completedAt)))
  ).size;
}

// ------------------------------------------------------------------ Equipamentos da academia

const KITS = ['barbell', 'smith', 'dumbbell', 'kettlebell', 'cable', 'machine', 'band', 'suspension', 'ball', 'plate', 'cardio', 'mobility', 'bodyweight', 'other'];
route('GET', '/api/hub/inventory', ({ member }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Sem acesso');
  return db.inventory;
});
route('PUT', '/api/hub/inventory', ({ member, body }) => {
  if (member.role !== 'owner') throw new HttpError(403, 'Só o administrador muda os equipamentos');
  const inv = { ...db.inventory };
  if (body.kits === null) inv.kits = null;
  else if (Array.isArray(body.kits)) inv.kits = [...new Set(body.kits.filter((k) => KITS.includes(k)))];
  if (Array.isArray(body.hidden)) {
    inv.hidden = [...new Set(body.hidden.filter((h) => typeof h === 'string' && h.length <= 40))].slice(0, 8000);
  }
  db.inventory = inv;
  save('inventory');
  return inv;
});

route('GET', '/api/hub/challenges', ({ member }) => {
  const month = localDay().slice(0, 7);
  const students = Object.values(db.members).filter((m) => m.role === 'student');
  return db.challenges
    .filter((c) => c.month >= month)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((c) => {
      const progress = challengeProgress(c, member.id);
      const out = { ...c, progress: Math.min(progress, c.target), done: progress >= c.target };
      if (isStaff(member)) {
        const done = students.filter((s) => challengeProgress(c, s.id) >= c.target);
        out.completedBy = done.map((s) => ({ id: s.id, name: s.name }));
        out.participants = students.filter((s) => challengeProgress(c, s.id) > 0).length;
      }
      return out;
    });
});
route('POST', '/api/hub/challenges', ({ member, body }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe cria desafios');
  const ptTitle = str(body.title?.['pt-BR'], 60);
  if (!ptTitle) throw new HttpError(400, 'Dê um nome ao desafio');
  const target = Math.round(num(body.target, 1, 31) ?? 0);
  if (!target) throw new HttpError(400, 'Defina a meta');
  const c = {
    id: id('ds'),
    title: { 'pt-BR': ptTitle, 'es-PY': str(body.title?.['es-PY'], 60) || ptTitle },
    reward: { 'pt-BR': str(body.reward?.['pt-BR'], 80) || '', 'es-PY': str(body.reward?.['es-PY'], 80) || str(body.reward?.['pt-BR'], 80) || '' },
    metric: ['workouts', 'checkins', 'classes'].includes(body.metric) ? body.metric : 'workouts',
    target,
    month: /^\d{4}-\d{2}$/.test(body.month) ? body.month : localDay().slice(0, 7),
    createdAt: new Date().toISOString(),
  };
  db.challenges.push(c);
  save('challenges');
  return c;
});
route('DELETE', '/api/hub/challenges/:id', ({ member, params }) => {
  if (!isStaff(member)) throw new HttpError(403, 'Só a equipe apaga desafios');
  db.challenges = db.challenges.filter((c) => c.id !== params.id);
  save('challenges');
  return { ok: true };
});

// ---------------------------------------------------------------- Notificações no celular (web push)

const PUSH_TEXT = {
  'pt-BR': {
    classSoon: (name, time) => [`Sua aula de ${name} é às ${time}`, 'Sua vaga está reservada. Bom treino!'],
    idle: (n) => [`Faz ${n} dias que você não treina`, 'Bora voltar? Sua ficha está esperando no app.'],
    test: ['Tudo certo!', 'Você vai receber os avisos da academia aqui.'],
  },
  'es-PY': {
    classSoon: (name, time) => [`Tu clase de ${name} es a las ${time}`, 'Tu lugar está reservado. ¡Buen entrenamiento!'],
    idle: (n) => [`Hace ${n} días que no entrenás`, '¿Volvemos? Tu rutina te espera en la app.'],
    test: ['¡Todo listo!', 'Vas a recibir los avisos del gimnasio acá.'],
  },
};
const pushLang = () => (db.settings.defaultLanguage === 'es-PY' ? 'es-PY' : 'pt-BR');
const pickName = (n) => (typeof n === 'string' ? n : n?.[pushLang()] || n?.['pt-BR'] || '');

function pushStore() {
  if (!db.push || !db.push.keys) {
    db.push = { keys: generateVapidKeys(), subs: [], sent: {} };
    save('push');
  }
  db.push.subs ??= [];
  db.push.sent ??= {};
  return db.push;
}

/** Envia para todos os aparelhos dos membros escolhidos (ou de todos). */
async function notify(memberIds, data) {
  const store = pushStore();
  const targets = store.subs.filter((x) => !memberIds || memberIds.includes(x.memberId));
  const icon = '/api/hub/icon';
  const results = await Promise.all(
    targets.map((sub) => sendPush(sub, { icon, ...data }, store.keys, process.env.PUSH_SUBJECT || 'mailto:suporte@gymapp.local'))
  );
  const gone = new Set(targets.filter((_, i) => results[i] === 'gone').map((x) => x.endpoint));
  if (gone.size) {
    store.subs = store.subs.filter((x) => !gone.has(x.endpoint));
    save('push');
  }
  return results.filter((r) => r === 'ok').length;
}

route('GET', '/api/hub/push/key', () => ({ publicKey: pushStore().keys.publicKey }));
route('POST', '/api/hub/push/subscribe', ({ member, body }) => {
  const sub = body.subscription || {};
  const endpoint = str(sub.endpoint, 1000);
  if (!/^https:\/\//.test(endpoint || '') || !sub.keys?.p256dh || !sub.keys?.auth) throw new HttpError(400, 'Inscrição inválida');
  const store = pushStore();
  store.subs = store.subs.filter((x) => x.endpoint !== endpoint);
  store.subs.push({
    memberId: member.id,
    endpoint,
    keys: { p256dh: str(sub.keys.p256dh, 200), auth: str(sub.keys.auth, 100) },
    createdAt: new Date().toISOString(),
  });
  // limite de aparelhos por pessoa
  const mine = store.subs.filter((x) => x.memberId === member.id);
  if (mine.length > 5) store.subs = store.subs.filter((x) => x !== mine[0]);
  save('push');
  return { ok: true };
});
route('POST', '/api/hub/push/unsubscribe', ({ member, body }) => {
  const store = pushStore();
  store.subs = store.subs.filter((x) => !(x.memberId === member.id && x.endpoint === body.endpoint));
  save('push');
  return { ok: true };
});
route('POST', '/api/hub/push/test', async ({ member }) => {
  const [title, text] = PUSH_TEXT[pushLang()].test;
  const sent = await notify([member.id], { title, body: text, tag: 'test' });
  return { sent };
});

/** Lembretes automáticos: aula em ~1 hora e aluno sumido (às 18h). Roda a cada 5 minutos. */
async function pushScheduler() {
  if (!db.push?.subs?.length) return;
  const store = pushStore();
  const now = new Date();
  const today = localDay();
  const T = PUSH_TEXT[pushLang()];
  // limpa marcações de dias anteriores
  for (const k of Object.keys(store.sent)) if (!k.includes(today)) delete store.sent[k];

  // 1) aula começando entre 45 e 75 minutos
  for (const o of occurrences(today, null)) {
    const start = new Date(`${today}T${o.cls.time}:00`).getTime();
    const mins = (start - now.getTime()) / 60_000;
    if (mins < 45 || mins > 75) continue;
    const key = `class:${o.cls.id}:${today}`;
    if (store.sent[key]) continue;
    store.sent[key] = 1;
    const ids = db.bookings.filter((b) => b.classId === o.cls.id && b.date === today).map((b) => b.studentId);
    if (ids.length) {
      const [title, text] = T.classSoon(pickName(o.cls.name), o.cls.time);
      await notify(ids, { title, body: text, tag: key, url: '/' });
    }
  }

  // 2) aluno sumido: no 5º, 10º e 20º dia sem treinar, às 18h
  if (now.getHours() === 18 && !store.sent[`idle:${today}`]) {
    store.sent[`idle:${today}`] = 1;
    for (const m of Object.values(db.members)) {
      if (m.role !== 'student' || m.status !== 'active') continue;
      const last = memberStats(m.id).lastWorkoutAt;
      if (!last) continue;
      const days = Math.floor((Date.now() - Date.parse(last)) / 86_400_000);
      if ([5, 10, 20].includes(days)) {
        const [title, text] = T.idle(days);
        await notify([m.id], { title, body: text, tag: 'idle', url: '/' });
      }
    }
  }
  save('push');
}
setInterval(() => pushScheduler().catch((e) => console.error('push', e)), 5 * 60_000).unref();

// ---------------------------------------------------------------- Fotos de evolução

const PHOTO_DIR = path.join(DATA_DIR, 'fotos');
const MAX_PHOTOS = 60;
const photoFile = (p) => path.join(PHOTO_DIR, p.studentId.replace(/[^\w-]/g, '_'), `${p.id}.jpg`);
const canSeeStudent = (member, studentId) => member.id === studentId || isStaff(member);

route('GET', '/api/hub/photos', ({ member, query }) => {
  const studentId = query.get('studentId') || member.id;
  if (!canSeeStudent(member, studentId)) throw new HttpError(403, 'Sem acesso');
  return db.photos
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ id, date, studentId: sid }) => ({ id, date, studentId: sid, url: `/api/hub/photos/${id}` }));
});
route(
  'GET',
  '/api/hub/photos/:id',
  ({ member, params }, req, res) => {
    const p = db.photos.find((x) => x.id === params.id);
    if (!p || !canSeeStudent(member, p.studentId)) throw new HttpError(404, 'Foto não encontrada');
    const buf = fs.readFileSync(photoFile(p));
    send(res, 200, buf, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' });
  },
  { raw: true }
);
route('POST', '/api/hub/photos', ({ member, body }) => {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''));
  if (!m) throw new HttpError(400, 'Envie a foto em JPEG');
  const buf = Buffer.from(m[1], 'base64');
  // confere a assinatura do JPEG (FF D8 FF) para não guardar outro tipo de arquivo
  if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) throw new HttpError(400, 'Arquivo de imagem inválido');
  const mine = db.photos.filter((p) => p.studentId === member.id);
  if (mine.length >= MAX_PHOTOS) throw new HttpError(400, `Limite de ${MAX_PHOTOS} fotos: apague alguma antiga`);
  const p = { id: id('ph'), studentId: member.id, date: isDay(body.date) ? body.date : localDay(), createdAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(photoFile(p)), { recursive: true });
  fs.writeFileSync(photoFile(p), buf);
  db.photos.push(p);
  save('photos');
  return { id: p.id, date: p.date, studentId: p.studentId, url: `/api/hub/photos/${p.id}` };
});
route('DELETE', '/api/hub/photos/:id', ({ member, params }) => {
  const p = db.photos.find((x) => x.id === params.id);
  if (!p || p.studentId !== member.id) throw new HttpError(404, 'Foto não encontrada');
  try {
    fs.unlinkSync(photoFile(p));
  } catch {
    /* arquivo já não existe */
  }
  db.photos = db.photos.filter((x) => x.id !== p.id);
  save('photos');
  return { ok: true };
});

// ---------------------------------------------------------------- servidor

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://hub');
  const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
  if (!r) return send(res, 404, { error: 'Não encontrado' });
  try {
    const m = r.re.exec(url.pathname);
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const ctx = { params, query: url.searchParams, body: {} };
    if (req.method !== 'GET') {
      // proteção contra envio de outro site
      const origin = req.headers.origin;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      // compara só o nome do servidor (proxies podem tirar ou trocar a porta)
      if (origin && host && new URL(origin).hostname !== String(host).split(',')[0].trim().replace(/:\d+$/, ''))
        throw new HttpError(403, 'Origem não permitida');
      if (req.method === 'POST' || req.method === 'PUT') ctx.body = await readBody(req);
    }
    if (!r.public) {
      const user = await currentUser(req);
      if (!user) throw new HttpError(401, 'Faça login');
      ctx.user = user;
      ctx.member = touchMember(user);
    }
    const out = await r.handler(ctx, req, res);
    if (!r.raw) send(res, 200, out);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    if (!res.headersSent) send(res, status, { error: status === 500 ? 'Erro interno' : err.message });
  }
});

server.listen(PORT, () => {
  console.log(`GymApp Hub ouvindo na porta ${PORT} · dados em ${DATA_DIR} · contas em ${OPENGYM_URL}`);
  if (!SETUP_CODE) console.log('Aviso: SETUP_CODE vazio — ninguém consegue se ativar como administrador.');
});
