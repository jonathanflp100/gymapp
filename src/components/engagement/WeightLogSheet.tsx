import React, { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { api } from '../../services/api';
import { useX } from '../../i18n/extraStrings';
import { Sheet, useToast } from '../common/ui';

/** Botão + formulário para o aluno registrar o peso do dia e ajustar a meta. */
export const WeightLogButton: React.FC<{
  studentId: string;
  currentKg: number;
  targetKg: number;
  onSaved: () => void;
}> = ({ studentId, currentKg, targetKg, onSaved }) => {
  const x = useX();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (open) {
      setWeight(currentKg ? String(currentKg) : '');
      setTarget(targetKg ? String(targetKg) : '');
    }
  }, [open, currentKg, targetKg]);

  const parse = (v: string) => Number(v.replace(',', '.'));
  const w = parse(weight);
  const tg = parse(target);
  const valid = w >= 20 && w <= 400 && (!target || (tg >= 20 && tg <= 400));

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await api.logWeight(studentId, Math.round(w * 10) / 10);
      if (target && tg !== targetKg) await api.updateStudent(studentId, { targetWeightKg: Math.round(tg * 10) / 10 });
      setOpen(false);
      showToast(x.weight.saved);
      onSaved();
    } catch (e) {
      showToast(String((e as Error).message || e), 'warn');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-lg font-black text-white tabular-nums focus:outline-none focus:border-brand-primary';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-primary-subtle border border-brand-primary/30 text-sm font-black text-white"
      >
        <Scale className="w-4 h-4 text-brand-primary" />
        {x.weight.log}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={<h3 className="text-base font-black text-white">{x.weight.title}</h3>}>
        <div className="space-y-3">
          <div>
            <label htmlFor="w-today" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {x.weight.current}
            </label>
            <input id="w-today" inputMode="decimal" className={field} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <label htmlFor="w-target" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              {x.weight.target}
            </label>
            <input id="w-target" inputMode="decimal" className={field} value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={save}
            className="w-full py-3 rounded-2xl bg-brand-primary text-white text-sm font-black disabled:opacity-50"
          >
            {x.weight.save}
          </button>
        </div>
      </Sheet>
      {toast}
    </>
  );
};
