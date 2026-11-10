import { useEffect, useState } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import type { TimerState } from '../lib/types';
import { cx } from './ui';

export function remainingOf(t: TimerState, now = Date.now()) {
  return t.endAt ? Math.max(0, Math.ceil((t.endAt - now) / 1000)) : t.remaining;
}

export function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const i = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(i);
  }, [active]);
  return now;
}

export function TimerBadge({ t, big }: { t: TimerState; big?: boolean }) {
  const now = useNow(!!t.endAt);
  const rem = remainingOf(t, now);
  const running = !!t.endAt && rem > 0;
  const over = !!t.endAt && rem === 0;
  const low = running && rem <= 60;
  return (
    <div
      className={cx(
        'flex items-center gap-2 rounded-lg border font-mono',
        big ? 'px-4 py-3 text-4xl' : 'px-2.5 py-1.5 text-sm',
        over ? 'animate-blink border-alert text-alert' : low ? 'border-warn text-warn' : running ? 'border-signal/60 text-signal' : 'border-ink-600 text-slate-400',
      )}
      title={t.label}
      role="timer"
      aria-label={`Таймер: ${t.label}`}
    >
      <TimerIcon className={big ? 'h-8 w-8' : 'h-4 w-4'} />
      <span className="tabular-nums">{over ? 'ЧАС!' : fmt(rem)}</span>
      {!big && <span className="hidden max-w-[120px] truncate text-[10px] uppercase tracking-wider text-slate-500 lg:inline">{t.label}{!t.endAt && rem > 0 ? ' · пауза' : ''}</span>}
    </div>
  );
}
