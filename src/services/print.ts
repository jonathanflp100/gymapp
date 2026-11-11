/**
 * Impressão: monta uma página A4 limpa e abre a janela de imprimir do sistema
 * (no celular e no computador dá para "Salvar como PDF" ou mandar no WhatsApp).
 * Usa um iframe escondido para funcionar também no app instalado e sem internet.
 */
import type { BrandConfig, Exercise, Routine } from '../types';

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function printHtml(body: string, title: string, brand: BrandConfig) {
  const color = /^#[0-9a-f]{3,8}$/i.test(brand.primaryColor) ? brand.primaryColor : '#DC2626';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid ${color}; padding-bottom: 10px; margin-bottom: 14px; }
  header img { height: 44px; max-width: 120px; object-fit: contain; }
  header .gym { font-size: 18px; font-weight: 800; }
  header .sub { color: #64748b; font-size: 11px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  h2 { font-size: 14px; margin: 18px 0 6px; color: ${color}; text-transform: uppercase; letter-spacing: .06em; }
  .meta { color: #475569; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1.5px solid #cbd5e1; padding: 6px 6px; }
  td { border-bottom: 1px solid #e2e8f0; padding: 7px 6px; vertical-align: top; }
  td.n { width: 22px; color: #94a3b8; font-weight: 700; }
  td.c { text-align: center; white-space: nowrap; }
  .tag { display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 1px 5px; border-radius: 4px; background: #fee2e2; color: #991b1b; margin-left: 4px; }
  .grp td { background: #f8fafc; }
  .log { width: 26px; height: 18px; border: 1px solid #cbd5e1; border-radius: 3px; display: inline-block; margin-right: 2px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
  .kpi b { display: block; font-size: 22px; }
  .kpi span { color: #64748b; font-size: 10px; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  footer { margin-top: 18px; color: #94a3b8; font-size: 10px; text-align: center; }
</style></head><body>
<header>
  ${brand.logoUrl ? `<img src="${esc(brand.logoUrl)}" alt="">` : ''}
  <div><div class="gym">${esc(brand.name)}</div><div class="sub">${esc(brand.tagline || '')}</div></div>
</header>
${body}
</body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    try {
      frame.contentWindow!.focus();
      frame.contentWindow!.print();
    } finally {
      // devolve o foco ao app (para o Esc e o teclado voltarem a funcionar)
      window.focus();
      setTimeout(() => frame.remove(), 60_000);
    }
  };
  // espera a logo carregar (se houver) antes de imprimir
  const img = doc.querySelector('img');
  if (img && !img.complete) {
    img.onload = img.onerror = () => go();
    setTimeout(go, 2500);
  } else setTimeout(go, 150);
}

interface RoutineStrings {
  printSheet: string;
  student: string;
  teacher: string;
  colEx: string;
  colSets: string;
  colReps: string;
  colLoad: string;
  colRest: string;
  colNotes: string;
  biset: string;
  warmupSet: string;
  tech: Record<string, string>;
  kind: Record<string, string>;
  secShort: string;
  minShort: string;
  printedAt: (d: string) => string;
}

export function routineSheetHtml(
  routine: Routine,
  exercises: Exercise[],
  lang: 'pt-BR' | 'es-PY',
  s: RoutineStrings,
  who?: { student?: string; teacher?: string }
): string {
  const name = (id: string) => {
    const e = exercises.find((x) => x.id === id);
    return e ? e.name[lang] || e.name['pt-BR'] : id;
  };
  const rows = routine.exercises
    .map((e, i) => {
      const grouped = e.groupWithNext || (i > 0 && routine.exercises[i - 1].groupWithNext);
      const tags = [
        grouped ? s.biset : '',
        e.technique && e.technique !== 'normal' ? s.tech[e.technique] : '',
        e.warmupSets ? `${e.warmupSets}× ${s.warmupSet}` : '',
      ]
        .filter(Boolean)
        .map((t) => `<span class="tag">${esc(t)}</span>`)
        .join('');
      const reps =
        e.kind === 'cardio'
          ? `${Math.round((e.durationSec ?? 0) / 60)} ${s.minShort}`
          : e.kind === 'time'
            ? `${e.durationSec ?? 30}${s.secShort}`
            : esc(e.reps);
      const boxes = '<span class="log"></span>'.repeat(Math.min(e.sets, 6));
      return `<tr class="${grouped ? 'grp' : ''}">
        <td class="n">${i + 1}</td>
        <td><b>${esc(name(e.exerciseId))}</b>${tags}${e.alternativeId ? `<div style="color:#64748b;font-size:10px">⇄ ${esc(name(e.alternativeId))}</div>` : ''}</td>
        <td class="c">${e.kind === 'cardio' ? '—' : e.sets}</td>
        <td class="c">${reps}</td>
        <td class="c">${e.targetWeightKg ? `${e.targetWeightKg} kg` : '—'}</td>
        <td class="c">${e.restSeconds ? `${e.restSeconds}${s.secShort}` : '—'}</td>
        <td>${esc(e.notes ?? '')}<div style="margin-top:4px">${e.kind === 'cardio' ? '' : boxes}</div></td>
      </tr>`;
    })
    .join('');
  const date = new Date().toLocaleDateString(lang);
  return `<h1>${esc(routine.name)}</h1>
<div class="meta">${esc(s.printSheet)} ${esc(routine.category)}${routine.description ? ` · ${esc(routine.description)}` : ''}
${who?.student ? `<br>${esc(s.student)}: <b>${esc(who.student)}</b>` : ''}${who?.teacher ? ` · ${esc(s.teacher)}: ${esc(who.teacher)}` : ''}</div>
<table><thead><tr><th></th><th>${esc(s.colEx)}</th><th>${esc(s.colSets)}</th><th>${esc(s.colReps)}</th><th>${esc(s.colLoad)}</th><th>${esc(s.colRest)}</th><th>${esc(s.colNotes)}</th></tr></thead>
<tbody>${rows}</tbody></table>
<footer>${esc(s.printedAt(date))}</footer>`;
}
