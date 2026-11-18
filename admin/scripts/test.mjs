// Roda os testes (*.test.ts) com o node:test, compilando com o rolldown do Vite.
import { build } from 'rolldown';
import { readdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const files = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.test.ts')) files.push(p);
  }
};
walk('src');
const out = mkdtempSync(join(tmpdir(), 'gymapp-test-'));
const outs = [];
for (const f of files) {
  const file = join(out, f.replace(/[\\/]/g, '_').replace(/\.ts$/, '.mjs'));
  await build({ input: f, platform: 'node', external: [/^node:/], output: { file, format: 'esm' }, logLevel: 'silent' });
  outs.push(file);
}
const r = spawnSync(process.execPath, ['--test', ...outs], { stdio: 'inherit' });
process.exit(r.status ?? 1);
