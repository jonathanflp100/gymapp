import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { illustrationFor, illustrationCount } from './exerciseIllustrations';

const file = (url: string) => 'public' + url;

test('exercícios principais do app têm ilustração com as duas poses', () => {
  for (const id of ['ex-bench-press', 'ex-lat-pulldown', 'ex-squat', 'ex-leg-press-45', 'ex-hammer-curl', 'ex-romanian-deadlift']) {
    const art = illustrationFor(id);
    assert.ok(art, id);
    assert.ok(art.peak, id);
  }
});

test('catálogo (og-) e isometria com pose única', () => {
  assert.equal(illustrationFor('og-0025')?.id, 'bench-press');
  const plank = illustrationFor('ex-plank');
  assert.ok(plank && !plank.peak);
  assert.equal(illustrationFor('og-99999'), null);
  assert.equal(illustrationFor('custom-xyz'), null);
});

test('todo arquivo de imagem referenciado existe', () => {
  assert.ok(illustrationCount() > 300);
  for (const n of Array.from({ length: 10000 }, (_, i) => String(i).padStart(4, '0'))) {
    const art = illustrationFor('og-' + n);
    if (!art) continue;
    assert.ok(existsSync(file(art.start)), art.start);
    if (art.peak) assert.ok(existsSync(file(art.peak)), art.peak);
  }
});
