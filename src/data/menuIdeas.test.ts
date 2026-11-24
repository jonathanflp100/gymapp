import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_IDEAS, SWAPS, TIPS, menuOfTheDay } from './menuIdeas';

test('30 ideias de cardápio: 15 para ganhar massa e 15 para emagrecer', () => {
  assert.equal(MENU_IDEAS.length, 30);
  assert.equal(MENU_IDEAS.filter((m) => m.goal === 'gain').length, 15);
  assert.equal(MENU_IDEAS.filter((m) => m.goal === 'lose').length, 15);
  assert.equal(new Set(MENU_IDEAS.map((m) => m.id)).size, 30);
});

test('tudo em português e espanhol, sem texto vazio', () => {
  for (const m of MENU_IDEAS) {
    for (const k of ['title', 'breakfast', 'lunch', 'snack', 'dinner'] as const) {
      assert.ok(m[k]['pt-BR'].trim().length > 2, `${m.id} ${k} pt`);
      assert.ok(m[k]['es-PY'].trim().length > 2, `${m.id} ${k} es`);
    }
    assert.ok(m.tags.length >= 1);
  }
  for (const s of SWAPS) assert.ok(s.from['es-PY'] && s.to['es-PY'] && s.from['pt-BR'] && s.to['pt-BR']);
  assert.ok(TIPS.gain.length >= 3 && TIPS.lose.length >= 3);
});

test('a sugestão do dia muda a cada dia e respeita o objetivo', () => {
  const d1 = menuOfTheDay('gain', new Date(2026, 10, 19));
  const d2 = menuOfTheDay('gain', new Date(2026, 10, 20));
  assert.equal(d1.goal, 'gain');
  assert.notEqual(d1.id, d2.id);
  assert.equal(menuOfTheDay('lose', new Date(2026, 10, 19)).goal, 'lose');
  // 15 dias seguidos passam por todas as ideias do objetivo
  const seen = new Set(Array.from({ length: 15 }, (_, i) => menuOfTheDay('lose', new Date(2026, 10, 1 + i)).id));
  assert.equal(seen.size, 15);
});
