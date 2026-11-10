import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, ModuleId, Protocol, ScoredModule, TaskResult } from './types';
import { MODULES, SCORED, STORAGE_KEY, TASKS } from './config';

export const ROLE_KEYS = [
  { key: 'coordinator', label: 'Координатор', hint: 'Приймає рішення, ставить пріоритети, затверджує повідомлення для всіх.' },
  { key: 'operator', label: 'Оператор зв’язку', hint: 'Підтримує канали, передає та підтверджує повідомлення, перемикає на резерв.' },
  { key: 'analyst', label: 'Аналітик', hint: 'Перевіряє джерела, порівнює дані, оцінює достовірність.' },
  { key: 'observer', label: 'Спостерігач', hint: 'Фіксує, що відбувається на місці, повідомляє факти без припущень.' },
  { key: 'recorder', label: 'Реєстратор', hint: 'Веде журнал: час, відправник, зміст, статус підтвердження.' },
];

export const SIGNAL_KEYS = [
  { key: 'received', label: 'Інформацію отримано' },
  { key: 'clarify', label: 'Потрібне уточнення' },
  { key: 'checking', label: 'Інформація перевіряється' },
  { key: 'down', label: 'Канал тимчасово недоступний' },
  { key: 'help', label: 'Потрібна допомога' },
];

export function emptyProtocol(): Protocol {
  return {
    teamName: '',
    members: ['', '', ''],
    roles: {},
    signals: SIGNAL_KEYS.map((s) => ({ key: s.key, code: '', form: 'Текст', meaning: '' })),
    template: '',
    rules: ['', '', ''],
    backupChannel: '',
    backupTrigger: '',
    backupCheck: '',
    savedAt: null,
  };
}

export function initialState(): AppState {
  return {
    v: 3,
    role: null,
    demo: false,
    started: false,
    profile: { name: '', group: '', team: '' },
    current: 'm1',
    answers: {},
    results: {},
    manual: {},
    showAnswers: false,
    pacing: 'free',
    openedUpTo: MODULES.length - 1,
    simRevealed: 3,
    timer: { label: 'Таймер', duration: 5 * 60, endAt: null, remaining: 5 * 60 },
    card: null,
    imported: [],
    protocol: emptyProtocol(),
  };
}

function loadState(): { state: AppState; storageOk: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: initialState(), storageOk: true };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || parsed.v !== 3) return { state: initialState(), storageOk: true };
    const base = initialState();
    return {
      state: { ...base, ...parsed, protocol: { ...base.protocol, ...(parsed.protocol ?? {}) }, card: null },
      storageOk: true,
    };
  } catch {
    return { state: initialState(), storageOk: false };
  }
}

interface Ctx {
  state: AppState;
  storageOk: boolean;
  update: (fn: (s: AppState) => AppState) => void;
  patch: (p: Partial<AppState>) => void;
  setAnswer: (id: string, value: unknown) => void;
  submit: (id: string, r: Omit<TaskResult, 'max' | 'at'>) => void;
  resetTask: (id: string) => void;
  go: (m: ModuleId) => void;
  resetAll: (keepImported?: boolean) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const loaded = useRef(loadState());
  const [state, setState] = useState<AppState>(loaded.current.state);
  const [storageOk, setStorageOk] = useState(loaded.current.storageOk);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        if (!storageOk) setStorageOk(true);
      } catch {
        setStorageOk(false);
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [state, storageOk]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);
  const patch = useCallback((p: Partial<AppState>) => setState((s) => ({ ...s, ...p })), []);
  const setAnswer = useCallback(
    (id: string, value: unknown) => setState((s) => (s.results[id] ? s : { ...s, answers: { ...s.answers, [id]: value } })),
    [],
  );
  const submit = useCallback((id: string, r: Omit<TaskResult, 'max' | 'at'>) => {
    const max = TASKS[id]?.max ?? 0;
    setState((s) => ({
      ...s,
      results: { ...s.results, [id]: { ...r, score: Math.max(0, Math.min(max, Math.round(r.score * 10) / 10)), max, at: Date.now() } },
    }));
  }, []);
  const resetTask = useCallback(
    (id: string) =>
      setState((s) => {
        const results = { ...s.results };
        const answers = { ...s.answers };
        delete results[id];
        delete answers[id];
        return { ...s, results, answers };
      }),
    [],
  );
  const go = useCallback((m: ModuleId) => {
    setState((s) => ({ ...s, current: m }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const resetAll = useCallback(
    (keepImported = true) =>
      setState((s) => {
        const manual = { ...s.manual };
        delete manual.local;
        return { ...initialState(), role: s.role, demo: s.demo, imported: keepImported ? s.imported : [], manual: keepImported ? manual : {} };
      }),
    [],
  );

  const value = useMemo(
    () => ({ state, storageOk, update, patch, setAnswer, submit, resetTask, go, resetAll }),
    [state, storageOk, update, patch, setAnswer, submit, resetTask, go, resetAll],
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp поза AppProvider');
  return c;
}

/** Стан окремого завдання: чернетка відповіді, результат, чи показувати правильні відповіді. */
export function useTask<T>(id: string, initial: T) {
  const { state, setAnswer, submit, resetTask } = useApp();
  const answer = (state.answers[id] as T | undefined) ?? initial;
  const result = state.results[id];
  const reveal = !!result || state.showAnswers;
  return {
    answer,
    set: (v: T) => setAnswer(id, v),
    result,
    locked: !!result,
    reveal,
    submit: (r: Omit<TaskResult, 'max' | 'at'>) => submit(id, r),
    reset: () => resetTask(id),
  };
}

export function autoModuleScore(results: AppState['results'], m: ScoredModule) {
  let sum = 0;
  for (const [id, r] of Object.entries(results)) if (TASKS[id]?.module === m) sum += r.score;
  const max = MODULES.find((x) => x.id === m)!.max;
  return Math.min(max, Math.round(sum * 10) / 10);
}

export function moduleScores(state: AppState, key = 'local') {
  const out = {} as Record<ScoredModule, number>;
  for (const m of SCORED) {
    const manual = state.manual[key]?.[m];
    out[m] = typeof manual === 'number' ? manual : autoModuleScore(state.results, m);
  }
  return out;
}

export function total(scores: Record<ScoredModule, number>) {
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0) * 10) / 10;
}

export function moduleProgress(state: AppState, m: ModuleId) {
  const ids = Object.keys(TASKS).filter((id) => TASKS[id].module === m);
  if (!ids.length) return { done: 0, all: 0 };
  return { done: ids.filter((id) => state.results[id]).length, all: ids.length };
}
