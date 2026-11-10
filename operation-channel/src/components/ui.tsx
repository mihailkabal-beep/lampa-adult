import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronRight, CircleAlert, Info, Lock, RotateCcw, Send, X } from 'lucide-react';
import { moduleProgress, useApp } from '../lib/store';
import { MODULES, TASKS } from '../lib/config';
import type { ModuleId } from '../lib/types';
import type { TaskResult } from '../lib/types';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'subtle' | 'warn';
export function Btn({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-signal text-ink-950 hover:bg-[#5cf0d6] shadow-[0_0_24px_-6px_rgba(46,230,197,.7)]',
    ghost: 'border border-ink-500 text-slate-200 hover:border-signal hover:text-signal bg-ink-900/40',
    danger: 'border border-alert/60 text-alert hover:bg-alert/10',
    warn: 'bg-warn text-ink-950 hover:brightness-110',
    subtle: 'text-slate-300 hover:text-white hover:bg-ink-700/60',
  };
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3.5 text-base' }[size];
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/70 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        v[variant],
        s,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  icon,
  right,
  children,
  className,
  tone = 'default',
}: {
  title?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'alert' | 'warn' | 'signal';
}) {
  const border = { default: 'border-ink-600/70', alert: 'border-alert/50', warn: 'border-warn/50', signal: 'border-signal/50' }[tone];
  return (
    <section className={cx('hud-corners relative rounded-xl border bg-ink-850/80 backdrop-blur-sm', border, className)}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-600/60 px-4 py-3 sm:px-5">
          <h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            {icon}
            {title}
          </h3>
          {right}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function Tag({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'good' | 'bad' | 'warn' | 'info'; className?: string }) {
  const t = {
    default: 'border-ink-500 text-slate-300',
    good: 'border-signal/60 text-signal bg-signal/10',
    bad: 'border-alert/60 text-alert bg-alert/10',
    warn: 'border-warn/60 text-warn bg-warn/10',
    info: 'border-info/60 text-info bg-info/10',
  }[tone];
  return <span className={cx('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider', t, className)}>{children}</span>;
}

export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'missed' | 'neutral';

export function Choice({
  selected,
  state = 'idle',
  multi,
  disabled,
  onClick,
  children,
  sub,
}: {
  selected: boolean;
  state?: ChoiceState;
  multi?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  sub?: ReactNode;
}) {
  const ring =
    state === 'correct'
      ? 'border-signal bg-signal/10'
      : state === 'wrong'
        ? 'border-alert bg-alert/10'
        : state === 'missed'
          ? 'border-warn border-dashed bg-warn/5'
          : selected
            ? 'border-info bg-info/10'
            : 'border-ink-600 bg-ink-900/60 hover:border-ink-500 hover:bg-ink-800';
  const mark =
    state === 'correct' ? (
      <Check className="h-4 w-4 text-signal" />
    ) : state === 'wrong' ? (
      <X className="h-4 w-4 text-alert" />
    ) : selected ? (
      <Check className="h-4 w-4 text-info" />
    ) : null;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'group flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm text-slate-100 transition disabled:cursor-default',
        ring,
      )}
    >
      <span
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border',
          multi ? 'rounded' : 'rounded-full',
          selected ? 'border-info' : 'border-ink-500',
        )}
      >
        {mark}
      </span>
      <span className="flex-1">
        <span className="block leading-snug">{children}</span>
        {sub && <span className="mt-1 block text-xs text-slate-400">{sub}</span>}
      </span>
      {state === 'missed' && <Tag tone="warn">пропущено</Tag>}
    </button>
  );
}

export function Explain({ tone = 'info', title, children }: { tone?: 'good' | 'bad' | 'info' | 'warn'; title?: ReactNode; children: ReactNode }) {
  const c = {
    good: 'border-signal/50 bg-signal/5 text-signal',
    bad: 'border-alert/50 bg-alert/5 text-alert',
    warn: 'border-warn/50 bg-warn/5 text-warn',
    info: 'border-info/50 bg-info/5 text-info',
  }[tone];
  const Icon = tone === 'good' ? Check : tone === 'bad' ? X : tone === 'warn' ? CircleAlert : Info;
  return (
    <div className={cx('animate-rise rounded-lg border px-3 py-2.5 text-sm', c)}>
      <div className="flex gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-slate-200">
          {title && <div className={cx('mb-0.5 font-semibold')}>{title}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ScoreBadge({ r }: { r: TaskResult }) {
  const ratio = r.max ? r.score / r.max : 0;
  const tone = ratio >= 0.85 ? 'good' : ratio >= 0.5 ? 'warn' : 'bad';
  return (
    <Tag tone={tone}>
      {r.score} / {r.max} б.
    </Tag>
  );
}

/** Обгортка завдання: номер, умова, кнопка «Надіслати рішення», результат. */
export function TaskShell({
  id,
  code,
  title,
  intro,
  children,
  canSubmit,
  onSubmit,
  submitHint,
  submitLabel = 'Надіслати рішення',
  after,
}: {
  id: string;
  code: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  canSubmit: boolean;
  onSubmit: () => void;
  submitHint?: string;
  submitLabel?: string;
  after?: ReactNode;
}) {
  const { state, resetTask } = useApp();
  const r = state.results[id];
  const max = TASKS[id]?.max ?? 0;
  const canReset = state.role === 'teacher' || state.demo;
  return (
    <Panel
      title={
        <>
          <span className="text-signal">{code}</span>
          <span className="normal-case tracking-normal text-slate-100">{title}</span>
        </>
      }
      right={r ? <ScoreBadge r={r} /> : <Tag>до {max} б.</Tag>}
      tone={r ? 'signal' : 'default'}
      className="animate-rise"
    >
      {intro && <div className="mb-4 text-sm leading-relaxed text-slate-300">{intro}</div>}
      {state.showAnswers && !r && (
        <div className="mb-3">
          <Tag tone="warn">Викладач увімкнув показ правильних відповідей</Tag>
        </div>
      )}
      <div className="space-y-3">{children}</div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-600/50 pt-4">
        {!r ? (
          <>
            <Btn onClick={onSubmit} disabled={!canSubmit}>
              <Send className="h-4 w-4" /> {submitLabel}
            </Btn>
            {!canSubmit && submitHint && <span className="text-xs text-slate-400">{submitHint}</span>}
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-signal">
              <Lock className="h-3.5 w-3.5" /> Рішення зафіксовано
            </span>
            {canReset && (
              <Btn variant="subtle" size="sm" onClick={() => resetTask(id)}>
                <RotateCcw className="h-3.5 w-3.5" /> Скинути завдання
              </Btn>
            )}
          </>
        )}
      </div>
      {r?.feedback && (
        <div className="mt-3">
          <Explain tone={r.score / r.max >= 0.85 ? 'good' : r.score / r.max >= 0.5 ? 'warn' : 'bad'} title="Зворотний зв’язок">
            {r.feedback}
          </Explain>
        </div>
      )}
      {after}
    </Panel>
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  max,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  max?: number;
  label?: ReactNode;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>}
      <textarea
        className="field min-h-[3rem] resize-y"
        rows={rows}
        value={value}
        disabled={disabled}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {max && <span className="mt-1 block text-right font-mono text-[11px] text-slate-500">{value.length} / {max}</span>}
    </label>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  disabled,
  label,
  max = 120,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: ReactNode;
  max?: number;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>}
      <input className="field" value={value} disabled={disabled} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Select({
  value,
  onChange,
  options,
  disabled,
  placeholder = '— оберіть —',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <select className={cx('field', className)} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Упорядкування списку кнопками (працює на сенсорних екранах без перетягування). */
export function OrderList<T extends { id: string; text: string }>({
  items,
  onChange,
  disabled,
  correctOrder,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  disabled?: boolean;
  correctOrder?: string[];
}) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ol className="space-y-2">
      {items.map((it, i) => {
        const ok = correctOrder ? correctOrder[i] === it.id : undefined;
        return (
          <li
            key={it.id}
            className={cx(
              'flex items-center gap-2 rounded-lg border bg-ink-900/70 px-2 py-2 text-sm',
              ok === undefined ? 'border-ink-600' : ok ? 'border-signal/70' : 'border-alert/70',
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-700 font-mono text-xs text-signal">{i + 1}</span>
            <span className="flex-1 text-slate-100">{it.text}</span>
            {correctOrder && !ok && (
              <span className="hidden font-mono text-[11px] text-warn sm:inline">→ місце {correctOrder.indexOf(it.id) + 1}</span>
            )}
            {!disabled && (
              <span className="flex shrink-0 gap-1">
                <button type="button" aria-label="Вгору" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md border border-ink-500 p-1.5 text-slate-300 hover:border-signal hover:text-signal disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Вниз" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded-md border border-ink-500 p-1.5 text-slate-300 hover:border-signal hover:text-signal disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Meter({ label, value, tone = 'signal' }: { label: string; value: number; tone?: 'signal' | 'alert' | 'warn' | 'info' }) {
  const v = Math.max(0, Math.min(100, value));
  const bar = { signal: 'bg-signal', alert: 'bg-alert', warn: 'bg-warn', info: 'bg-info' }[tone];
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[11px] uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{Math.round(v)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-700">
        <div className={cx('h-full rounded-full transition-all duration-700', bar)} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function ModuleHeader({ index, title, codename, minutes, max, children }: { index: number; title: string; codename: string; minutes: number; max?: number; children?: ReactNode }) {
  return (
    <div className="mb-6 animate-rise">
      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
        <span className="text-signal">Модуль {index}</span>
        <span>· {codename}</span>
        {minutes > 0 && <span>· {minutes} хв</span>}
        {!!max && <span>· до {max} балів</span>}
      </div>
      <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      {children && <div className="mt-3 max-w-3xl text-slate-300">{children}</div>}
    </div>
  );
}

/** Підрахунок для завдань із множинним вибором: +1 за правильний вибір, −1 за хибний, нормалізовано до max. */
export function scoreMulti(selected: string[], correct: string[], all: string[], max: number) {
  let hits = 0;
  let wrong = 0;
  for (const id of all) {
    const s = selected.includes(id);
    const c = correct.includes(id);
    if (s && c) hits++;
    if (s && !c) wrong++;
  }
  const raw = Math.max(0, hits - wrong) / correct.length;
  return Math.round(raw * max * 2) / 2;
}

export function choiceState(id: string, selected: string[], correct: string[], reveal: boolean): ChoiceState {
  if (!reveal) return 'idle';
  const s = selected.includes(id);
  const c = correct.includes(id);
  if (s && c) return 'correct';
  if (s && !c) return 'wrong';
  if (!s && c) return 'missed';
  return 'neutral';
}

export function shuffle<T>(arr: T[], seed: number) {
  const a = arr.slice();
  let x = seed;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function NextModule({ to }: { to: ModuleId }) {
  const { state, go } = useApp();
  const cur = MODULES.find((m) => m.id === state.current);
  const next = MODULES.find((m) => m.id === to)!;
  const idx = MODULES.findIndex((m) => m.id === to);
  const prog = moduleProgress(state, state.current);
  const locked = state.pacing === 'teacher' && idx > state.openedUpTo && state.role !== 'teacher';
  return (
    <div className="mt-8 flex flex-col items-start justify-between gap-3 rounded-xl border border-ink-600 bg-ink-900/60 p-4 sm:flex-row sm:items-center">
      <div className="text-sm text-slate-400">
        {prog.all > 0 && (
          <>
            {cur?.short}: виконано <b className="text-white">{prog.done}</b> з {prog.all} завдань.{' '}
            {prog.done < prog.all && <span className="text-warn">Невиконані завдання можна повернутися й завершити пізніше.</span>}
          </>
        )}
      </div>
      <Btn onClick={() => go(to)} disabled={locked}>
        {locked ? <Lock className="h-4 w-4" /> : null}
        {to === 'results' ? 'До підсумку операції' : `Далі: ${next.short}`} <ChevronRight className="h-4 w-4" />
      </Btn>
      {locked && <span className="text-xs text-slate-500">Наступний етап відкриє викладач.</span>}
    </div>
  );
}
