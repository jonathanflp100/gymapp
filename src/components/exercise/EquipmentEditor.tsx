import React, { useEffect, useMemo, useState } from 'react';
import { Check, Save } from 'lucide-react';
import type { Exercise } from '../../types';
import { api } from '../../services/api';
import { KITS, kitOf, saveInventory, useInventory, available } from '../../services/inventory';
import { useLanguage } from '../../i18n/LanguageContext';
import { useX } from '../../i18n/extraStrings';

/** Lista de equipamentos com quantos exercícios cada um libera. Só o administrador edita. */
export const EquipmentEditor: React.FC<{ canEdit: boolean; onSaved?: (msg: string) => void }> = ({ canEdit, onSaved }) => {
  const x = useX();
  const { language } = useLanguage();
  const inv = useInventory();
  const [all, setAll] = useState<Exercise[]>([]);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getExercises().then(setAll);
  }, []);

  // começa com o que está salvo; sem configuração, tudo marcado
  useEffect(() => {
    setDraft(inv.kits ?? [...KITS]);
  }, [inv.kits]);

  const perKit = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of all) if (e.source === 'catalogue') c[kitOf(e)] = (c[kitOf(e)] ?? 0) + 1;
    return c;
  }, [all]);

  const fmt = (n: number) => n.toLocaleString(language);
  const chosen = draft ?? [];
  const availableCount = useMemo(
    () => all.filter((e) => available(e, { kits: chosen, hidden: inv.hidden })).length,
    [all, chosen, inv.hidden]
  );
  const dirty = JSON.stringify([...chosen].sort()) !== JSON.stringify([...(inv.kits ?? KITS)].sort()) || inv.kits === null;

  const toggle = (k: string) => setDraft(chosen.includes(k) ? chosen.filter((c) => c !== k) : [...chosen, k]);

  const save = async () => {
    setBusy(true);
    try {
      await saveInventory({ kits: chosen });
      onSaved?.(x.inv.saved);
    } catch (e) {
      onSaved?.(String((e as Error).message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="equipment-editor">
      <div className="rounded-2xl bg-slate-950 border border-slate-800 px-3 py-2.5">
        <div className="text-sm font-black text-white tabular-nums">{x.inv.count(fmt(availableCount), fmt(all.length))}</div>
        {inv.kits === null && <div className="text-[11px] text-amber-400/90 mt-0.5">{x.inv.notSet}</div>}
        {inv.hidden.length > 0 && <div className="text-[11px] text-slate-500 mt-0.5">{x.inv.hiddenCount(inv.hidden.length)}</div>}
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <button type="button" onClick={() => setDraft([...KITS])} className="text-[11px] font-bold text-brand-primary">
            {x.inv.all}
          </button>
          <span className="text-slate-700">·</span>
          <button type="button" onClick={() => setDraft([])} className="text-[11px] font-bold text-slate-400">
            {x.inv.none}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-1.5">
        {KITS.map((k) => {
          const on = chosen.includes(k);
          return (
            <button
              key={k}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={!canEdit}
              onClick={() => toggle(k)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${
                on ? 'bg-brand-primary-subtle border-brand-primary/40' : 'bg-slate-950 border-slate-800'
              } disabled:cursor-default`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                  on ? 'bg-brand-primary border-transparent' : 'border-slate-600'
                }`}
              >
                {on && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              <span className={`flex-1 text-xs font-bold ${on ? 'text-white' : 'text-slate-400'}`}>{x.inv.kits[k]}</span>
              <span className="text-[10px] text-slate-500 tabular-nums">{fmt(perKit[k] ?? 0)}</span>
            </button>
          );
        })}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="w-full py-3 rounded-2xl bg-brand-primary text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Save className="w-4 h-4" />
          {x.inv.save}
        </button>
      )}
    </div>
  );
};
