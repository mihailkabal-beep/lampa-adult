import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical, GraduationCap, Info, LogOut, MonitorPlay, Radio, Settings2, UserRound } from 'lucide-react';
import { moduleProgress, moduleScores, total, useApp } from './lib/store';
import { MODULES } from './lib/config';
import type { ModuleId } from './lib/types';
import { Btn, Tag, cx } from './components/ui';
import { TimerBadge } from './components/Timer';
import { SituationOverlay } from './components/SituationCards';
import Toaster from './components/Toaster';
import M1Intro from './modules/M1Intro';
import M2Signals from './modules/M2Signals';
import M3Brief from './modules/M3Brief';
import M4Protocol from './modules/M4Protocol';
import M5Simulation from './modules/M5Simulation';
import M6Final from './modules/M6Final';
import M7Reflection from './modules/M7Reflection';
import Results from './modules/Results';
import TeacherPanel from './modules/TeacherPanel';

const VIEWS: Record<ModuleId, () => JSX.Element> = {
  m1: M1Intro,
  m2: M2Signals,
  m3: M3Brief,
  m4: M4Protocol,
  m5: M5Simulation,
  m6: M6Final,
  m7: M7Reflection,
  results: Results,
};

function Landing() {
  const { patch } = useApp();
  const opts = [
    { role: 'student' as const, demo: false, icon: UserRound, t: 'Я студент', d: 'Проходжу операцію: виконую завдання, створюю протокол, надсилаю результат викладачу.' },
    { role: 'teacher' as const, demo: false, icon: GraduationCap, t: 'Я викладач', d: 'Керую етапами й таймером, показую ситуаційні картки, імпортую результати, виставляю бали.' },
    { role: 'teacher' as const, demo: true, icon: FlaskConical, t: 'Демо-режим', d: 'Перевірити весь функціонал самостійно: панель викладача + проходження студента + демо-учасники.' },
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping2 rounded-full bg-signal" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-signal" />
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-signal">Навчальна симуляція · онлайн-заняття</span>
      </div>
      <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
        ОПЕРАЦІЯ: <span className="text-signal">ЄДИНИЙ КАНАЛ</span>
      </h1>
      <p className="mt-3 max-w-2xl text-slate-300">Основи національного спротиву · «Індивідуальна тактика, сигнали та інформаційна взаємодія малої групи» · F3 «Комп’ютерні науки»</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {opts.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.t}
              type="button"
              onClick={() => patch({ role: o.role, demo: o.demo })}
              className="hud-corners group relative rounded-xl border border-ink-600 bg-ink-850/80 p-5 text-left transition hover:-translate-y-0.5 hover:border-signal"
            >
              <Icon className="h-7 w-7 text-signal" />
              <div className="mt-3 text-lg font-bold text-white">{o.t}</div>
              <p className="mt-1 text-sm text-slate-400">{o.d}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex gap-2 rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-slate-400">
        <Info className="h-4 w-4 shrink-0 text-info" />
        <span>
          Реєстрація не потрібна. Прогрес зберігається лише в цьому браузері (localStorage). Синхронізації між пристроями немає: результати студентів передаються викладачу файлом.
        </span>
      </div>
    </div>
  );
}

function Header({ view, setView }: { view: 'lesson' | 'teacher'; setView: (v: 'lesson' | 'teacher') => void }) {
  const { state, patch, go } = useApp();
  const sum = total(moduleScores(state));
  const stressed = state.current === 'm5' || state.current === 'm6';
  const isTeacher = state.role === 'teacher';
  return (
    <header className="no-print sticky top-0 z-40 border-b border-ink-600/70 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <button type="button" onClick={() => setView('lesson')} className="flex items-center gap-2.5 text-left">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-signal/50 bg-ink-900">
            <Radio className="h-4 w-4 text-signal" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Операція</span>
            <span className="block text-sm font-black tracking-wide text-white">ЄДИНИЙ КАНАЛ</span>
          </span>
        </button>
        <div className={cx('hidden items-center gap-2 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider md:flex', stressed ? 'border-warn/50 text-warn' : 'border-signal/40 text-signal')}>
          <span className="relative flex h-2 w-2">
            <span className={cx('absolute inline-flex h-full w-full animate-ping2 rounded-full', stressed ? 'bg-warn' : 'bg-signal')} />
            <span className={cx('relative inline-flex h-2 w-2 rounded-full', stressed ? 'bg-warn' : 'bg-signal')} />
          </span>
          Канал: {stressed ? 'під загрозою' : 'стабільний'}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <TimerBadge t={state.timer} />
          <div className="rounded-lg border border-ink-600 px-2.5 py-1.5 font-mono text-sm text-white" title="Набрані бали">
            {sum}
            <span className="text-slate-500">/100</span>
          </div>
          {isTeacher && (
            <Btn size="sm" aria-label={view === 'teacher' ? 'Заняття' : 'Панель викладача'} variant={view === 'teacher' ? 'primary' : 'ghost'} onClick={() => setView(view === 'teacher' ? 'lesson' : 'teacher')}>
              {view === 'teacher' ? <MonitorPlay className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{view === 'teacher' ? 'Заняття' : 'Панель'}</span>
            </Btn>
          )}
          <Btn
            size="sm"
            variant="subtle"
            title="Змінити режим"
            aria-label="Змінити режим"
            onClick={() => {
              patch({ role: null, demo: false, card: null });
              setView('lesson');
            }}
          >
            <LogOut className="h-4 w-4" />
          </Btn>
        </div>
      </div>
      {view === 'lesson' && (
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 pb-2" aria-label="Модулі">
          <ol className="flex min-w-max gap-1">
            {MODULES.map((m, i) => {
              const locked = state.pacing === 'teacher' && i > state.openedUpTo && !isTeacher;
              const p = moduleProgress(state, m.id);
              const done = p.all > 0 && p.done === p.all;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => go(m.id)}
                    className={cx(
                      'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30',
                      state.current === m.id ? 'bg-signal text-ink-950' : 'text-slate-300 hover:bg-ink-800',
                    )}
                  >
                    <span className="font-mono">{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}</span>
                    {m.short}
                    {p.all > 0 && !done && p.done > 0 && <span className="font-mono text-[10px] opacity-70">{p.done}/{p.all}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </header>
  );
}

export default function App() {
  const { state, storageOk } = useApp();
  const [view, setView] = useState<'lesson' | 'teacher'>('lesson');

  useEffect(() => {
    if (state.role !== 'teacher' && view === 'teacher') setView('lesson');
  }, [state.role, view]);

  if (!state.role) return <Landing />;
  const View = VIEWS[state.current] ?? M1Intro;

  return (
    <div className="min-h-screen pb-[env(safe-area-inset-bottom)]">
      <Header view={view} setView={setView} />
      {!storageOk && (
        <div className="no-print border-b border-warn/40 bg-warn/10 px-4 py-2 text-center text-xs text-warn">
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" /> Браузер блокує локальне збереження (приватний режим?). Прогрес буде втрачено після закриття вкладки.
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {state.demo && (
          <div className="no-print mb-5 flex flex-wrap items-center gap-2">
            <Tag tone="warn">Демо-режим</Tag>
            <span className="text-xs text-slate-500">Доступні всі модулі, панель викладача, скидання окремих завдань і демо-учасники.</span>
          </div>
        )}
        {view === 'teacher' && state.role === 'teacher' ? <TeacherPanel onShowLesson={() => setView('lesson')} /> : <View key={state.current} />}
      </main>
      <footer className="no-print border-t border-ink-700 px-4 py-5 text-center text-xs text-slate-500">
        Навчальна цивільна симуляція · Дані зберігаються лише на цьому пристрої · Синхронізація між пристроями не підтримується
      </footer>
      <SituationOverlay />
      <Toaster />
    </div>
  );
}
