import React, { useEffect, useRef, useState } from 'react';

/**
 * Animação do movimento de cada exercício: um boneco de perfil fazendo o gesto,
 * com o equipamento desenhado (barra, halter, banco, polia, barra fixa...).
 * Desenho próprio, sem imagens de terceiros.
 *
 * Cada padrão tem duas poses: A (início) e B (contração). O ciclo é
 * A→B em 1 s (força), pausa, B→A em 2 s (volta controlada), pausa.
 */

type P = [number, number];

interface Pose {
  hip: P;
  /** inclinação do tronco: 0 = em pé, + para frente, - para trás, ±90 = deitado */
  t: number;
  /** ombros levantados (encolhimento), em px para cima */
  lift?: number;
  // Braço: ângulos (0 = para baixo, + para frente) OU alvo da mão
  u?: number;
  f?: number;
  hand?: P;
  handRel?: P; // relativo ao ombro
  handHip?: P; // relativo ao quadril
  // Perna: ângulos OU alvo do pé
  h?: number;
  k?: number;
  foot?: P;
  // Segunda perna (afundo, coice)
  h2?: number;
  k2?: number;
  foot2?: P;
  /** pé apoiado na ponta (graus) */
  toe?: number;
}

type Prop =
  | { kind: 'barbell'; at: 'hand' | 'shoulder' }
  | { kind: 'dumbbell' }
  | { kind: 'bench'; x: number; y: number; w: number; h?: number }
  | { kind: 'incline'; from: P; to: P }
  | { kind: 'cable'; anchor: P; to?: 'hand' | 'ankle' }
  | { kind: 'bar'; y: number }
  | { kind: 'dipbars' }
  | { kind: 'seat'; x: number; y: number; w: number }
  | { kind: 'pad'; at: 'shin' | 'foot' }
  | { kind: 'platform' };

interface Pattern {
  a: Pose;
  b: Pose;
  props?: Prop[];
  /** braço/perna de trás em transparência (dá profundidade) */
  depth?: boolean;
  /** isometria: só respira, sem repetição */
  hold?: boolean;
}

const L = { torso: 40, neck: 13, upper: 22, fore: 20, thigh: 30, shin: 28, foot: 11 };
const GROUND = 132;
const rad = (d: number) => (d * Math.PI) / 180;
const down = (a: number): P => [Math.sin(rad(a)), Math.cos(rad(a))];
const up = (a: number): P => [Math.sin(rad(a)), -Math.cos(rad(a))];
const add = (p: P, v: P, s = 1): P => [p[0] + v[0] * s, p[1] + v[1] * s];

/** Cinemática inversa de dois segmentos: devolve a articulação do meio. side: +1/-1 escolhe para onde dobra. */
function ik(root: P, target: P, a: number, b: number, side: number): P {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(a - b) + 0.01), a + b - 0.01);
  const base = Math.atan2(dy, dx);
  const alpha = Math.acos((a * a + d * d - b * b) / (2 * a * d));
  const ang = base + side * alpha;
  return [root[0] + a * Math.cos(ang), root[1] + a * Math.sin(ang)];
}

const STAND: Pose = { hip: [95, 74], t: 0, foot: [97, GROUND], handRel: [2, 41] };

export const PATTERNS: Record<string, Pattern> = {
  bench: {
    a: { hip: [118, 84], t: -90, hand: [80, 38], h: 62, k: -8 },
    b: { hip: [118, 84], t: -90, hand: [80, 72], h: 62, k: -8 },
    props: [{ kind: 'bench', x: 50, y: 88, w: 80 }, { kind: 'barbell', at: 'hand' }],
  },
  skull: {
    a: { hip: [118, 84], t: -90, u: 172, f: 172, h: 62, k: -8 },
    b: { hip: [118, 84], t: -90, u: 172, f: 262, h: 62, k: -8 },
    props: [{ kind: 'bench', x: 50, y: 88, w: 80 }, { kind: 'barbell', at: 'hand' }],
  },
  incline: {
    a: { hip: [112, 92], t: -58, hand: [86, 30], h: 75, k: -5 },
    b: { hip: [112, 92], t: -58, hand: [78, 64], h: 75, k: -5 },
    props: [{ kind: 'incline', from: [116, 98], to: [78, 74] }, { kind: 'bench', x: 100, y: 96, w: 26 }, { kind: 'dumbbell' }],
  },
  fly: {
    a: { hip: [92, 74], t: 8, u: -75, f: -60, foot: [94, GROUND] },
    b: { hip: [92, 74], t: 8, u: 85, f: 95, foot: [94, GROUND] },
    props: [{ kind: 'cable', anchor: [30, 26] }],
    depth: true,
  },
  pushup: {
    a: { hip: [93, 104], t: 66, hand: [130, GROUND - 2], h: -66, k: -66 },
    b: { hip: [96, 116], t: 78, hand: [130, GROUND - 2], h: -78, k: -78 },
    depth: true,
  },
  dip: {
    a: { hip: [100, 72], t: 8, hand: [104, 74], h: 18, k: -95 },
    b: { hip: [100, 94], t: 22, hand: [104, 74], h: 18, k: -95 },
    props: [{ kind: 'dipbars' }],
  },
  pulldown: {
    a: { hip: [92, 100], t: -6, hand: [104, 18], h: 88, k: 0 },
    b: { hip: [92, 100], t: -12, handRel: [10, 6], h: 88, k: 0 },
    props: [{ kind: 'seat', x: 74, y: 102, w: 34 }, { kind: 'cable', anchor: [104, -6] }],
  },
  seatedrow: {
    a: { hip: [78, 104], t: 10, hand: [118, 72], h: 82, k: 82 },
    b: { hip: [78, 104], t: -8, handRel: [12, 22], h: 82, k: 82 },
    props: [{ kind: 'seat', x: 58, y: 106, w: 36 }, { kind: 'cable', anchor: [168, 96] }],
  },
  bentrow: {
    a: { hip: [82, 80], t: 68, handRel: [2, 41], foot: [97, GROUND] },
    b: { hip: [82, 80], t: 68, handRel: [-12, 20], foot: [97, GROUND] },
    props: [{ kind: 'barbell', at: 'hand' }],
  },
  dbrow: {
    a: { hip: [82, 80], t: 72, handRel: [2, 41], foot: [97, GROUND] },
    b: { hip: [82, 80], t: 72, handRel: [-14, 18], foot: [97, GROUND] },
    props: [{ kind: 'bench', x: 106, y: 86, w: 46 }, { kind: 'dumbbell' }],
  },
  pullup: {
    a: { hip: [100, 88], t: 4, hand: [102, 8], h: 18, k: -80 },
    b: { hip: [100, 58], t: 8, hand: [102, 8], h: 18, k: -80 },
    props: [{ kind: 'bar', y: 8 }],
  },
  straightpull: {
    a: { hip: [92, 74], t: 18, u: 150, f: 150, foot: [96, GROUND] },
    b: { hip: [92, 74], t: 18, u: -8, f: -8, foot: [96, GROUND] },
    props: [{ kind: 'cable', anchor: [158, -6] }],
  },
  ohp: {
    a: { hip: [95, 100], t: -4, handRel: [9, -2], h: 88, k: 0 },
    b: { hip: [95, 100], t: -4, handRel: [3, -41], h: 88, k: 0 },
    props: [{ kind: 'seat', x: 74, y: 102, w: 36 }, { kind: 'dumbbell' }],
    depth: true,
  },
  raise: {
    a: { hip: [95, 74], t: 0, u: 6, f: 8, foot: [97, GROUND] },
    b: { hip: [95, 74], t: 0, u: 88, f: 92, foot: [97, GROUND] },
    props: [{ kind: 'dumbbell' }],
    depth: true,
  },
  cableraise: {
    a: { hip: [95, 74], t: 0, u: 6, f: 8, foot: [97, GROUND] },
    b: { hip: [95, 74], t: 0, u: 88, f: 92, foot: [97, GROUND] },
    props: [{ kind: 'cable', anchor: [62, 126] }],
  },
  facepull: {
    a: { hip: [94, 74], t: -6, hand: [131, 30], foot: [96, GROUND] },
    b: { hip: [94, 74], t: -6, handRel: [10, -16], foot: [96, GROUND] },
    props: [{ kind: 'cable', anchor: [170, 24] }],
  },
  shrug: {
    a: { ...STAND, lift: 0 },
    b: { ...STAND, lift: -6 },
    props: [{ kind: 'barbell', at: 'hand' }],
  },
  curl: {
    a: { hip: [95, 74], t: 0, u: 4, f: 6, foot: [97, GROUND] },
    b: { hip: [95, 74], t: 0, u: 8, f: 150, foot: [97, GROUND] },
    props: [{ kind: 'barbell', at: 'hand' }],
  },
  dbcurl: {
    a: { hip: [95, 74], t: 0, u: 4, f: 6, foot: [97, GROUND] },
    b: { hip: [95, 74], t: 0, u: 8, f: 150, foot: [97, GROUND] },
    props: [{ kind: 'dumbbell' }],
    depth: true,
  },
  preacher: {
    a: { hip: [88, 100], t: 10, u: 50, f: 60, h: 88, k: 0 },
    b: { hip: [88, 100], t: 10, u: 50, f: 165, h: 88, k: 0 },
    props: [{ kind: 'seat', x: 70, y: 102, w: 34 }, { kind: 'incline', from: [106, 62], to: [126, 82] }, { kind: 'barbell', at: 'hand' }],
  },
  pushdown: {
    a: { hip: [95, 74], t: 6, u: 6, f: 135, foot: [97, GROUND] },
    b: { hip: [95, 74], t: 6, u: 6, f: 4, foot: [97, GROUND] },
    props: [{ kind: 'cable', anchor: [126, -6] }],
  },
  overheadext: {
    a: { hip: [95, 100], t: -2, u: 176, f: 178, h: 88, k: 0 },
    b: { hip: [95, 100], t: -2, u: 176, f: 330, h: 88, k: 0 },
    props: [{ kind: 'seat', x: 74, y: 102, w: 36 }, { kind: 'dumbbell' }],
  },
  squat: {
    a: { hip: [95, 74], t: 0, foot: [97, GROUND], handRel: [-6, -2] },
    b: { hip: [78, 101], t: 40, foot: [97, GROUND], handRel: [-6, -2] },
    props: [{ kind: 'barbell', at: 'shoulder' }],
  },
  legpress: {
    a: { hip: [70, 104], t: -55, foot: [126, 62], handHip: [10, -2] },
    b: { hip: [70, 104], t: -55, foot: [98, 82], handHip: [10, -2] },
    props: [{ kind: 'incline', from: [72, 110], to: [40, 86] }, { kind: 'platform' }],
  },
  lunge: {
    a: { hip: [94, 74], t: 2, foot: [114, GROUND], foot2: [74, GROUND], handRel: [2, 41] },
    b: { hip: [94, 99], t: 4, foot: [114, GROUND], foot2: [66, GROUND], handRel: [2, 41] },
    props: [{ kind: 'dumbbell' }],
  },
  split: {
    a: { hip: [96, 78], t: 6, foot: [118, GROUND], foot2: [58, 104], handRel: [2, 41] },
    b: { hip: [92, 100], t: 10, foot: [118, GROUND], foot2: [58, 104], handRel: [2, 41] },
    props: [{ kind: 'bench', x: 36, y: 106, w: 30 }, { kind: 'dumbbell' }],
  },
  legext: {
    a: { hip: [80, 100], t: -6, h: 90, k: 2, handHip: [6, 6] },
    b: { hip: [80, 100], t: -6, h: 90, k: 86, handHip: [6, 6] },
    props: [{ kind: 'seat', x: 62, y: 102, w: 40 }, { kind: 'pad', at: 'foot' }],
  },
  legcurl: {
    a: { hip: [80, 100], t: -6, h: 90, k: 86, handHip: [6, 6] },
    b: { hip: [80, 100], t: -6, h: 90, k: -12, handHip: [6, 6] },
    props: [{ kind: 'seat', x: 62, y: 102, w: 40 }, { kind: 'pad', at: 'foot' }],
  },
  rdl: {
    a: { hip: [95, 74], t: 0, foot: [97, GROUND], handRel: [3, 41] },
    b: { hip: [80, 80], t: 74, foot: [97, GROUND], handRel: [1, 41] },
    props: [{ kind: 'barbell', at: 'hand' }],
  },
  hipthrust: {
    a: { hip: [96, 118], t: -64, foot: [122, GROUND], handHip: [0, -7] },
    b: { hip: [98, 92], t: -95, foot: [122, GROUND], handHip: [0, -7] },
    props: [{ kind: 'bench', x: 34, y: 100, w: 30, h: 32 }, { kind: 'barbell', at: 'hand' }],
  },
  kickback: {
    a: { hip: [95, 76], t: 28, handRel: [18, 30], foot: [100, GROUND], h2: 4, k2: 0 },
    b: { hip: [95, 76], t: 28, handRel: [18, 30], foot: [100, GROUND], h2: -62, k2: -55 },
    props: [{ kind: 'cable', anchor: [160, 126], to: 'ankle' }],
  },
  calf: {
    a: { hip: [95, 74], t: 0, h: 0, k: 0, handRel: [2, 41], toe: 0 },
    b: { hip: [95, 66], t: 0, h: 0, k: 0, handRel: [2, 41], toe: 42 },
    props: [{ kind: 'barbell', at: 'shoulder' }],
  },
  crunch: {
    a: { hip: [90, 98], t: 8, h: 0, k: -90, handRel: [5, -11] },
    b: { hip: [90, 98], t: 78, h: 0, k: -90, handRel: [5, -11] },
    props: [{ kind: 'cable', anchor: [128, -6] }],
  },
  plank: {
    a: { hip: [90, 112], t: 76, u: 0, f: 90, h: -76, k: -76 },
    b: { hip: [90, 110], t: 75, u: 0, f: 90, h: -75, k: -75 },
    hold: true,
  },
  legraise: {
    a: { hip: [100, 90], t: 0, hand: [100, 8], h: 2, k: 2 },
    b: { hip: [100, 90], t: -6, hand: [100, 8], h: 88, k: 92 },
    props: [{ kind: 'bar', y: 8 }],
  },
};

/** Exercício → padrão de movimento. */
const BY_EXERCISE: Record<string, string> = {
  'ex-bench-press': 'bench',
  'ex-close-grip-bench': 'bench',
  'ex-incline-dumbbell-press': 'incline',
  'ex-cable-crossover': 'fly',
  'ex-chest-fly-machine': 'fly',
  'ex-pushup': 'pushup',
  'ex-dips-chest': 'dip',
  'ex-lat-pulldown': 'pulldown',
  'ex-seated-cable-row': 'seatedrow',
  'ex-barbell-row': 'bentrow',
  'ex-pullup': 'pullup',
  'ex-dumbbell-row': 'dbrow',
  'ex-straight-arm-pulldown': 'straightpull',
  'ex-overhead-press': 'ohp',
  'ex-lateral-raise': 'raise',
  'ex-front-raise-cable': 'cableraise',
  'ex-face-pull': 'facepull',
  'ex-shrug': 'shrug',
  'ex-barbell-curl': 'curl',
  'ex-hammer-curl': 'dbcurl',
  'ex-preacher-curl': 'preacher',
  'ex-incline-dumbbell-curl': 'dbcurl',
  'ex-triceps-rope-pushdown': 'pushdown',
  'ex-skull-crusher': 'skull',
  'ex-overhead-triceps-extension': 'overheadext',
  'ex-squat': 'squat',
  'ex-leg-press-45': 'legpress',
  'ex-leg-extension': 'legext',
  'ex-bulgarian-split-squat': 'split',
  'ex-walking-lunges': 'lunge',
  'ex-lying-leg-curl': 'legcurl',
  'ex-seated-leg-curl': 'legcurl',
  'ex-romanian-deadlift': 'rdl',
  'ex-hip-thrust': 'hipthrust',
  'ex-cable-glute-kickback': 'kickback',
  'ex-standing-calf-raise': 'calf',
  'ex-seated-calf-raise': 'calf',
  'ex-cable-crunch': 'crunch',
  'ex-plank': 'plank',
  'ex-hanging-leg-raise': 'legraise',
};

/** Exercícios criados pela academia: escolhe pelo grupo muscular e equipamento. */
const BY_MUSCLE: Record<string, string> = {
  chest: 'bench',
  back: 'pulldown',
  shoulders: 'ohp',
  biceps: 'dbcurl',
  triceps: 'pushdown',
  quads: 'squat',
  hamstrings: 'rdl',
  glutes: 'hipthrust',
  calves: 'calf',
  abs: 'crunch',
  forearms: 'dbcurl',
  traps: 'shrug',
};

export function patternFor(exerciseId: string, muscleGroup?: string): string {
  return BY_EXERCISE[exerciseId] ?? (muscleGroup && BY_MUSCLE[muscleGroup]) ?? 'curl';
}

// ---------------------------------------------------------------- pose → esqueleto

const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
const lerpP = (a: P, b: P, s: number): P => [lerp(a[0], b[0], s), lerp(a[1], b[1], s)];

function mix(a: Pose, b: Pose, s: number): Pose {
  const out: Pose = { hip: lerpP(a.hip, b.hip, s), t: lerp(a.t, b.t, s), lift: lerp(a.lift ?? 0, b.lift ?? 0, s) };
  const keys: (keyof Pose)[] = ['u', 'f', 'h', 'k', 'h2', 'k2', 'toe'];
  for (const k of keys) if (a[k] !== undefined && b[k] !== undefined) (out as any)[k] = lerp(a[k] as number, b[k] as number, s);
  const pts: (keyof Pose)[] = ['hand', 'handRel', 'handHip', 'foot', 'foot2'];
  for (const k of pts) if (a[k] && b[k]) (out as any)[k] = lerpP(a[k] as P, b[k] as P, s);
  return out;
}

interface Skeleton {
  hip: P;
  shoulder: P;
  head: P;
  elbow: P;
  hand: P;
  knee: P;
  ankle: P;
  toe: P;
  knee2?: P;
  ankle2?: P;
  toe2?: P;
}

function leg(hip: P, h?: number, k?: number, foot?: P, toeDeg = 0) {
  let knee: P;
  let ankle: P;
  if (foot) {
    // joelho dobra para frente (+x) quando o pé está abaixo do quadril
    const side = foot[0] < hip[0] - 6 ? 1 : -1;
    knee = ik(hip, foot, L.thigh, L.shin, foot[1] > hip[1] ? side : -side);
    ankle = add(knee, [(foot[0] - knee[0]), (foot[1] - knee[1])], L.shin / Math.max(1, Math.hypot(foot[0] - knee[0], foot[1] - knee[1])));
  } else {
    knee = add(hip, down(h ?? 0), L.thigh);
    ankle = add(knee, down(k ?? 0), L.shin);
  }
  const toe = add(ankle, [Math.cos(rad(toeDeg)), Math.sin(rad(toeDeg))], L.foot);
  return { knee, ankle, toe };
}

function skeleton(p: Pose): Skeleton {
  const hip = p.hip;
  const shoulder0 = add(hip, up(p.t), L.torso);
  const shoulder: P = [shoulder0[0], shoulder0[1] + (p.lift ?? 0)];
  const head = add(shoulder0, up(p.t), L.neck);
  head[1] += (p.lift ?? 0) * 0.4;

  let elbow: P;
  let hand: P;
  const target = p.hand ?? (p.handRel ? add(shoulder, p.handRel) : p.handHip ? add(hip, p.handHip) : undefined);
  if (target) {
    // cotovelo dobra para trás/baixo
    elbow = ik(shoulder, target, L.upper, L.fore, target[0] >= shoulder[0] ? 1 : -1);
    const dir: P = [target[0] - elbow[0], target[1] - elbow[1]];
    hand = add(elbow, dir, L.fore / Math.max(1, Math.hypot(dir[0], dir[1])));
  } else {
    elbow = add(shoulder, down(p.u ?? 0), L.upper);
    hand = add(elbow, down(p.f ?? 0), L.fore);
  }

  // pé na ponta: o tornozelo sobe; compensa no quadril via pose
  const l1 = leg(hip, p.h, p.k, p.foot, p.toe ?? 0);
  const out: Skeleton = { hip, shoulder, head, elbow, hand, ...l1 };
  if (p.h2 !== undefined || p.foot2) {
    const l2 = leg(hip, p.h2, p.k2, p.foot2);
    out.knee2 = l2.knee;
    out.ankle2 = l2.ankle;
    out.toe2 = l2.toe;
  }
  return out;
}

// ---------------------------------------------------------------- desenho

const W = 'rgba(255,255,255,0.95)';
const EQ = 'rgba(255,255,255,0.55)';

function Limb({ pts, w = 6, opacity = 1 }: { pts: P[]; w?: number; opacity?: number }) {
  return (
    <polyline
      points={pts.map((p) => p.join(',')).join(' ')}
      fill="none"
      stroke={W}
      strokeOpacity={opacity}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Props({ props, s, accent }: { props: Prop[]; s: Skeleton; accent: string }) {
  return (
    <>
      {props.map((pr, i) => {
        switch (pr.kind) {
          case 'bench':
            return (
              <g key={i}>
                <rect x={pr.x} y={pr.y} width={pr.w} height={6} rx={2} fill={EQ} />
                <rect x={pr.x + 6} y={pr.y + 6} width={4} height={(pr.h ?? GROUND - pr.y) - 6} fill={EQ} opacity={0.7} />
                <rect x={pr.x + pr.w - 10} y={pr.y + 6} width={4} height={(pr.h ?? GROUND - pr.y) - 6} fill={EQ} opacity={0.7} />
              </g>
            );
          case 'incline':
            return <line key={i} x1={pr.from[0]} y1={pr.from[1]} x2={pr.to[0]} y2={pr.to[1]} stroke={EQ} strokeWidth={7} strokeLinecap="round" />;
          case 'seat':
            return (
              <g key={i}>
                <rect x={pr.x} y={pr.y} width={pr.w} height={6} rx={2} fill={EQ} />
                <rect x={pr.x + pr.w / 2 - 2} y={pr.y + 6} width={4} height={GROUND - pr.y - 6} fill={EQ} opacity={0.7} />
              </g>
            );
          case 'bar':
            return <line key={i} x1={55} y1={pr.y} x2={150} y2={pr.y} stroke={EQ} strokeWidth={4} strokeLinecap="round" />;
          case 'dipbars':
            return (
              <g key={i}>
                <line x1={s.hand[0] - 16} y1={s.hand[1] + 3} x2={s.hand[0] + 16} y2={s.hand[1] + 3} stroke={EQ} strokeWidth={4} strokeLinecap="round" />
                <line x1={s.hand[0] + 12} y1={s.hand[1] + 3} x2={s.hand[0] + 12} y2={GROUND} stroke={EQ} strokeWidth={3} opacity={0.6} />
              </g>
            );
          case 'cable': {
            const end = pr.to === 'ankle' ? s.ankle2 ?? s.ankle : s.hand;
            return (
              <g key={i}>
                <line x1={pr.anchor[0]} y1={pr.anchor[1]} x2={end[0]} y2={end[1]} stroke={EQ} strokeWidth={1.5} strokeDasharray="3 2" />
                <circle cx={pr.anchor[0]} cy={pr.anchor[1]} r={4} fill="none" stroke={EQ} strokeWidth={2} />
              </g>
            );
          }
          case 'platform': {
            const t = s.toe;
            return <line key={i} x1={t[0] - 10} y1={t[1] - 16} x2={t[0] + 12} y2={t[1] + 14} stroke={EQ} strokeWidth={6} strokeLinecap="round" />;
          }
          case 'pad': {
            const p = s.ankle;
            return <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={accent} stroke={W} strokeWidth={1.5} />;
          }
          default:
            return null;
        }
      })}
    </>
  );
}

/** Pesos na mão/ombro: desenhados por cima do corpo. */
function Weights({ props, s, accent }: { props: Prop[]; s: Skeleton; accent: string }) {
  return (
    <>
      {props.map((pr, i) => {
        if (pr.kind === 'barbell') {
          const p = pr.at === 'shoulder' ? s.shoulder : s.hand;
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={11} fill={accent} stroke={W} strokeWidth={2} />
              <circle cx={p[0]} cy={p[1]} r={3} fill={W} />
            </g>
          );
        }
        if (pr.kind === 'dumbbell') {
          const p = s.hand;
          return (
            <g key={i} transform={`translate(${p[0]},${p[1]})`}>
              <rect x={-9} y={-2} width={18} height={4} rx={1} fill={W} />
              <rect x={-11} y={-6} width={5} height={12} rx={1.5} fill={accent} stroke={W} strokeWidth={1.2} />
              <rect x={6} y={-6} width={5} height={12} rx={1.5} fill={accent} stroke={W} strokeWidth={1.2} />
            </g>
          );
        }
        return null;
      })}
    </>
  );
}

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** Fase 0..1 do ciclo: A→B 1 s, pausa 0,25 s, B→A 2 s, pausa 0,35 s. */
function phase(ms: number, hold: boolean): number {
  if (hold) return (Math.sin((ms / 1600) * Math.PI) + 1) / 2;
  const T = 3600;
  const t = ms % T;
  if (t < 1000) return ease(t / 1000);
  if (t < 1250) return 1;
  if (t < 3250) return 1 - ease((t - 1250) / 2000);
  return 0;
}

export const MovementAnimation: React.FC<{
  exerciseId: string;
  muscleGroup?: string;
  playing: boolean;
  accent: string;
  onRep?: () => void;
  /** fase fixa (0..1), para prévias estáticas */
  still?: number;
  patternOverride?: string;
}> = ({ exerciseId, muscleGroup, playing, accent, onRep, still, patternOverride }) => {
  const pattern = PATTERNS[patternOverride && PATTERNS[patternOverride] ? patternOverride : patternFor(exerciseId, muscleGroup)];
  const [s, setS] = useState(() => (still ?? 0));
  const start = useRef<number | null>(null);
  const elapsed = useRef(0);
  const lastRep = useRef(0);

  useEffect(() => {
    if (still !== undefined || !playing) {
      start.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (start.current === null) start.current = now - elapsed.current;
      elapsed.current = now - start.current;
      setS(phase(elapsed.current, !!pattern.hold));
      const rep = Math.floor(elapsed.current / 3600);
      if (!pattern.hold && rep > lastRep.current) {
        lastRep.current = rep;
        onRep?.();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, pattern, still, onRep]);

  const sk = skeleton(mix(pattern.a, pattern.b, still ?? s));
  const props = pattern.props ?? [];
  const back: P = [3, -2]; // membro de trás, levemente deslocado

  return (
    <svg viewBox="0 -12 200 150" className="w-full h-full" role="img" aria-label="Animação do movimento">
      <line x1={10} y1={GROUND + 1} x2={190} y2={GROUND + 1} stroke="white" strokeOpacity={0.22} strokeWidth={2} />
      <Props props={props} s={sk} accent={accent} />

      {/* membros de trás */}
      {pattern.depth && (
        <Limb pts={[add(sk.shoulder, back), add(sk.elbow, back), add(sk.hand, back)]} w={5} opacity={0.4} />
      )}
      {sk.knee2 && sk.ankle2 && sk.toe2 && <Limb pts={[sk.hip, sk.knee2, sk.ankle2, sk.toe2]} w={6} opacity={0.55} />}

      {/* corpo */}
      <Limb pts={[sk.hip, sk.knee, sk.ankle, sk.toe]} w={6.5} />
      <Limb pts={[sk.hip, sk.shoulder]} w={8} />
      <circle cx={sk.head[0]} cy={sk.head[1]} r={8} fill={W} />
      <Limb pts={[sk.shoulder, sk.elbow, sk.hand]} w={5.5} />

      <Weights props={props} s={sk} accent={accent} />
    </svg>
  );
};
