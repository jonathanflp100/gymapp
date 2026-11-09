import React, { useEffect, useState } from 'react';
import { Megaphone, Target, QrCode, ChevronRight } from 'lucide-react';
import { engagement } from '../../services/engagementApi';
import { useX } from '../../i18n/extraStrings';

/** Atalho no painel do professor com os números do dia. */
export const EngagementCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const x = useX();
  const [n, setN] = useState<{ ann: number; ch: number; chk: number } | null>(null);

  useEffect(() => {
    Promise.all([
      engagement.announcements().catch(() => []),
      engagement.challenges(true).catch(() => []),
      engagement.checkinStats().catch(() => ({ days: [], today: [] })),
    ]).then(([a, c, s]) => setN({ ann: a.length, ch: c.length, chk: s.today.length }));
  }, []);

  const Item: React.FC<{ icon: React.ReactNode; value?: number; label: string }> = ({ icon, value, label }) => (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-center">
      <div className="text-brand-primary flex justify-center">{icon}</div>
      <div className="text-lg font-black text-white tabular-nums">{value ?? '–'}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );

  return (
    <button type="button" onClick={onOpen} className="w-full text-left bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{x.engage.cardTitle}</h3>
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Item icon={<Megaphone className="w-4 h-4" />} value={n?.ann} label={x.engage.tabs.ann} />
        <Item icon={<Target className="w-4 h-4" />} value={n?.ch} label={x.engage.tabs.ch} />
        <Item icon={<QrCode className="w-4 h-4" />} value={n?.chk} label={x.engage.chkToday} />
      </div>
    </button>
  );
};
