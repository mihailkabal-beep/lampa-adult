import { useMemo, useRef, useState } from 'react';
import {
  BarChart3, ChevronRight, Eye, EyeOff, FileDown, FileUp, Gauge, Layers, MonitorPlay, Pause, Play, Plus, RotateCcw, Square, Timer as TimerIcon, Trash2, Trophy, Users,
} from 'lucide-react';
import { moduleScores, total, useApp } from '../lib/store';
import { MODULES, SCORED, rankFor } from '../lib/config';
import { buildExport, downloadFile, parseImported, participantKey } from '../lib/export';
import type { ExportedResult, ModuleId, ScoredModule } from '../lib/types';
import { CARDS } from '../components/SituationCards';
import { TimerBadge, remainingOf } from '../components/Timer';
import { Btn, Panel, Tag, cx } from '../components/ui';
import { toast } from '../components/Toaster';

interface Row {
  key: string;
  name: string;
  group: string;
  team: string;
  auto: Record<ScoredModule, number>;
  imported?: ExportedResult;
  local?: boolean;
}

function demoResults(): ExportedResult[] {
  const people = [
    ['Демо: Анна К.', '31', 'Вузол-1'], ['Демо: Богдан Л.', '31', 'Вузол-1'], ['Демо: Віра М.', '32', 'Пакет-7'],
    ['Демо: Гліб Н.', '32', 'Пакет-7'], ['Демо: Дарина О.', '41', 'Сигнал-3'], ['Демо: Єгор П.', '41', 'Сигнал-3'],
  ];
  const wrongPool = ['Ситуація А: «Негайно поширити повідомлення в усі чати» — недоречно', '«Інформацію отримано»', 'Порядок уточнення суперечливої інформації', 'Звернення: Коли наступне оновлення / час', 'Резервний канал: «Ще один месенджер через той самий Wi‑Fi» — недоречно'];
  return people.map(([name, group, team], i) => {
    const k = 0.55 + ((i * 37) % 40) / 100;
    const modules = { m2: Math.round(15 * k), m3: Math.round(10 * k), m4: Math.round(25 * Math.min(1, k + 0.1)), m5: Math.round(25 * k), m6: Math.round(20 * k), m7: 5 } as Record<ScoredModule, number>;
    return {
      app: 'operation-yedynyi-kanal', v: 1, exportedAt: Date.now() - i * 1000, profile: { name, group, team }, modules,
      total: Object.values(modules).reduce((a, b) => a + b, 0),
      decisions: wrongPool.slice(0, 1 + (i % 4)).map((label) => ({ task: 'демо', label, ok: false })).concat([{ task: 'демо', label: 'Перевірка джерела', ok: true }]),
      protocol: null, reflection: {},
    };
  });
}

function TimerControls() {
  const { state, patch } = useApp();
  const t = state.timer;
  const rem = remainingOf(t);
  const set = (label: string, minutes: number, start: boolean) =>
    patch({ timer: { label, duration: minutes * 60, endAt: start ? Date.now() + minutes * 60_000 : null, remaining: minutes * 60 } });
  return (
    <Panel title="Таймер" icon={<TimerIcon className="h-4 w-4 text-signal" />}>
      <div className="flex flex-wrap items-center gap-3">
        <TimerBadge t={t} big />
        <div className="flex flex-wrap gap-2">
          {t.endAt ? (
            <Btn variant="warn" onClick={() => patch({ timer: { ...t, endAt: null, remaining: rem } })}>
              <Pause className="h-4 w-4" /> Пауза
            </Btn>
          ) : (
            <Btn onClick={() => patch({ timer: { ...t, endAt: Date.now() + (rem || t.duration) * 1000, remaining: rem || t.duration } })}>
              <Play className="h-4 w-4" /> Старт
            </Btn>
          )}
          <Btn variant="ghost" onClick={() => patch({ timer: { ...t, endAt: null, remaining: t.duration } })}>
            <Square className="h-4 w-4" /> Стоп / скинути
          </Btn>
          <Btn variant="ghost" onClick={() => patch({ timer: t.endAt ? { ...t, endAt: t.endAt + 60_000 } : { ...t, remaining: t.remaining + 60 } })}>
            <Plus className="h-4 w-4" /> 1 хв
          </Btn>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[1, 3, 5, 10, 15, 20].map((m) => (
          <button key={m} type="button" onClick={() => set(`Таймер ${m} хв`, m, false)} className="rounded-md border border-ink-500 px-2.5 py-1 font-mono text-xs text-slate-300 hover:border-signal hover:text-signal">
            {m} хв
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Пресет лише встановлює час; натисніть «Старт». Завершення таймера не блокує відповіді — бали за швидкість не нараховуються.</p>
    </Panel>
  );
}

export default function TeacherPanel({ onShowLesson }: { onShowLesson: () => void }) {
  const { state, patch, update, go, resetAll } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const curIdx = MODULES.findIndex((m) => m.id === state.current);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const localKey = `${state.profile.name}|${state.profile.group}|${state.profile.team}`.toLowerCase();
    const alreadyImported = state.imported.some((e) => participantKey(e) === localKey);
    if ((Object.keys(state.results).length || state.profile.name) && !alreadyImported) {
      out.push({ key: 'local', name: state.profile.name || 'Цей пристрій', group: state.profile.group, team: state.profile.team || '—', auto: moduleScores({ ...state, manual: {} }), local: true });
    }
    for (const e of state.imported) out.push({ key: participantKey(e), name: e.profile.name, group: e.profile.group, team: e.profile.team || '—', auto: e.modules, imported: e });
    return out;
  }, [state]);

  const scoreOf = (r: Row) => {
    const m = state.manual[r.key] ?? {};
    const s = {} as Record<ScoredModule, number>;
    for (const k of SCORED) s[k] = typeof m[k] === 'number' ? (m[k] as number) : r.auto[k] ?? 0;
    return s;
  };

  const teams = useMemo(() => {
    const map = new Map<string, { team: string; members: number; sum: number }>();
    for (const r of rows) {
      const key = r.team.trim().toLowerCase() || '—';
      const t = map.get(key) ?? { team: r.team, members: 0, sum: 0 };
      t.members++;
      t.sum += total(scoreOf(r));
      map.set(key, t);
    }
    return [...map.values()].map((t) => ({ ...t, avg: Math.round((t.sum / t.members) * 10) / 10 })).sort((a, b) => b.avg - a.avg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, state.manual]);

  const mistakes = useMemo(() => {
    const cnt = new Map<string, number>();
    const all = [...state.imported.map((e) => e.decisions), rows.some((r) => r.local) ? buildExport(state).decisions : []];
    for (const list of all) for (const d of list) if (!d.ok) cnt.set(d.label, (cnt.get(d.label) ?? 0) + 1);
    return [...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [state, rows]);

  const avg = rows.length ? Math.round((rows.reduce((a, r) => a + total(scoreOf(r)), 0) / rows.length) * 10) / 10 : 0;

  const startStage = (id: ModuleId, i: number) => {
    const m = MODULES[i];
    update((s) => ({
      ...s,
      current: id,
      openedUpTo: Math.max(s.openedUpTo, i),
      timer: m.minutes ? { label: m.short, duration: m.minutes * 60, endAt: Date.now() + m.minutes * 60_000, remaining: m.minutes * 60 } : s.timer,
    }));
    toast(`Етап «${m.short}» запущено${m.minutes ? `, таймер ${m.minutes} хв` : ''}`);
  };
  const endStage = (i: number) => {
    update((s) => ({ ...s, timer: { ...s.timer, endAt: null, remaining: 0 }, openedUpTo: Math.max(s.openedUpTo, Math.min(i + 1, MODULES.length - 1)) }));
    toast(`Етап «${MODULES[i].short}» завершено`);
  };

  const onImport = async (files: FileList | null) => {
    if (!files?.length) return;
    let ok = 0;
    let bad = 0;
    const list: ExportedResult[] = [];
    for (const f of Array.from(files)) {
      try {
        const e = parseImported(await f.text());
        if (e) {
          list.push(e);
          ok++;
        } else bad++;
      } catch {
        bad++;
      }
    }
    update((s) => {
      const map = new Map(s.imported.map((e) => [participantKey(e), e]));
      for (const e of list) map.set(participantKey(e), e);
      return { ...s, imported: [...map.values()] };
    });
    toast(`Імпортовано: ${ok}${bad ? `, відхилено: ${bad} (не той формат)` : ''}`, bad === 0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportCsv = () => {
    const head = ['Ім’я', 'Група', 'Команда', ...MODULES.filter((m) => m.max && m.id !== 'results').map((m) => `${m.short} (${m.max})`), 'Разом'];
    const lines = [head, ...rows.map((r) => { const s = scoreOf(r); return [r.name, r.group, r.team, ...SCORED.map((k) => String(s[k])), String(total(s))]; })];
    const csv = '﻿' + lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    downloadFile('results_operation_yedynyi_kanal.csv', csv, 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Командний пункт викладача</div>
          <h2 className="text-3xl font-bold text-white">Панель керування заняттям</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Керуйте етапами й таймером на цьому екрані (його можна демонструвати в Teams / Meet). Студенти працюють у своїх браузерах і надсилають файли результатів — імпортуйте їх нижче.
          </p>
        </div>
        <Btn onClick={onShowLesson}>
          <MonitorPlay className="h-4 w-4" /> Екран заняття
        </Btn>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Етапи заняття · 90 хв" icon={<Layers className="h-4 w-4 text-signal" />}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-400">Темп:</span>
            {(['free', 'teacher'] as const).map((p) => (
              <button key={p} type="button" onClick={() => patch({ pacing: p, openedUpTo: p === 'teacher' ? curIdx : MODULES.length - 1, simRevealed: p === 'teacher' ? 1 : 3 })} className={cx('rounded-md border px-3 py-1 text-xs font-semibold', state.pacing === p ? 'border-signal bg-signal/10 text-signal' : 'border-ink-500 text-slate-300')}>
                {p === 'free' ? 'Вільний перехід' : 'Етапи відкриває викладач'}
              </button>
            ))}
          </div>
          <ul className="space-y-1.5">
            {MODULES.map((m, i) => {
              const opened = state.pacing === 'free' || i <= state.openedUpTo;
              return (
                <li key={m.id} className={cx('flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2', state.current === m.id ? 'border-signal/70 bg-signal/5' : 'border-ink-600')}>
                  <span className="w-6 font-mono text-xs text-signal">{i + 1}</span>
                  <span className="min-w-[11rem] flex-1">
                    <span className="block text-sm font-semibold text-white">{m.title}</span>
                    <span className="font-mono text-[11px] text-slate-500">{m.minutes ? `${m.minutes} хв` : '—'}{m.max && m.id !== 'results' ? ` · ${m.max} б.` : ''} · {opened ? 'відкрито' : 'закрито'}</span>
                  </span>
                  <Btn size="sm" variant="subtle" onClick={() => { go(m.id); onShowLesson(); }} title="Показати на екрані">
                    <Eye className="h-3.5 w-3.5" />
                  </Btn>
                  {m.minutes > 0 && (
                    <>
                      <Btn size="sm" variant="ghost" onClick={() => startStage(m.id, i)}>
                        <Play className="h-3.5 w-3.5" /> Запуск
                      </Btn>
                      <Btn size="sm" variant="subtle" onClick={() => endStage(i)} title="Завершити етап">
                        <Square className="h-3.5 w-3.5" />
                      </Btn>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-6">
          <TimerControls />
          <Panel title="Перебіг симуляції та відповіді" icon={<Gauge className="h-4 w-4 text-signal" />}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Btn variant={state.showAnswers ? 'warn' : 'ghost'} onClick={() => patch({ showAnswers: !state.showAnswers })}>
                  {state.showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {state.showAnswers ? 'Сховати правильні відповіді' : 'Показати правильні відповіді'}
                </Btn>
                <span className="text-xs text-slate-500">Підсвічує правильні варіанти в усіх завданнях на цьому екрані.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-ink-600/60 pt-3">
                <span className="text-sm text-slate-300">Симуляція: відкрито {state.pacing === 'teacher' ? state.simRevealed : 3} з 3 ситуацій</span>
                <Btn
                  size="sm"
                  disabled={state.pacing === 'teacher' && state.simRevealed >= 3}
                  onClick={() => {
                    if (state.pacing !== 'teacher') {
                      patch({ pacing: 'teacher', openedUpTo: Math.max(curIdx, 4), simRevealed: 1 });
                      toast('Увімкнено керований темп: відкрито ситуацію А');
                    } else {
                      patch({ simRevealed: state.simRevealed + 1 });
                      toast(`Відкрито ситуацію ${'АБВ'[state.simRevealed]}`);
                    }
                  }}
                >
                  Показати наступну ситуацію <ChevronRight className="h-4 w-4" />
                </Btn>
                {state.pacing === 'teacher' && (
                  <Btn size="sm" variant="subtle" onClick={() => patch({ simRevealed: 1 })}>
                    <RotateCcw className="h-3.5 w-3.5" /> З початку (А)
                  </Btn>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Ситуаційні картки (для демонстрації екрана)" icon={<MonitorPlay className="h-4 w-4 text-signal" />}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.id} type="button" onClick={() => patch({ card: c.id })} className="flex items-start gap-3 rounded-lg border border-ink-600 bg-ink-900/50 p-3 text-left transition hover:border-signal">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
                <span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{c.tag}</span>
                  <span className="font-semibold text-white">{c.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel
        title={`Результати учасників · ${rows.length}`}
        icon={<Users className="h-4 w-4 text-signal" />}
        right={
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept=".json,application/json" multiple className="hidden" onChange={(e) => onImport(e.target.files)} />
            <Btn size="sm" onClick={() => fileRef.current?.click()}>
              <FileUp className="h-4 w-4" /> Імпорт файлів
            </Btn>
            <Btn size="sm" variant="ghost" disabled={!rows.length} onClick={exportCsv}>
              <FileDown className="h-4 w-4" /> CSV
            </Btn>
            {state.demo && (
              <Btn size="sm" variant="ghost" onClick={() => update((s) => ({ ...s, imported: [...s.imported.filter((e) => !e.profile.name.startsWith('Демо')), ...demoResults()] }))}>
                <Plus className="h-4 w-4" /> Демо-учасники
              </Btn>
            )}
          </div>
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">
            Поки немає результатів. Студенти завершують операцію → «Файл результату (.json)» → надсилають у чат заняття. Ви завантажуєте файли й імпортуєте їх тут (можна кілька одночасно).
            {state.demo && ' У демо-режимі натисніть «Демо-учасники», щоб побачити, як виглядає таблиця.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <tr className="text-left">
                  <th className="pb-2">Учасник</th>
                  <th className="pb-2">Команда</th>
                  {SCORED.map((k) => (
                    <th key={k} className="pb-2 text-center">{MODULES.find((m) => m.id === k)!.short}</th>
                  ))}
                  <th className="pb-2 text-center">Разом</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = scoreOf(r);
                  const tot = total(s);
                  const isEd = editing === r.key;
                  return (
                    <tr key={r.key} className="border-t border-ink-600/60">
                      <td className="py-2 pr-2">
                        <div className="font-semibold text-white">{r.name}</div>
                        <div className="text-xs text-slate-500">гр. {r.group || '—'} {r.local && '· цей пристрій'}</div>
                      </td>
                      <td className="py-2 pr-2 text-slate-300">{r.team}</td>
                      {SCORED.map((k) => {
                        const max = MODULES.find((m) => m.id === k)!.max;
                        const manual = typeof state.manual[r.key]?.[k] === 'number';
                        return (
                          <td key={k} className="py-2 text-center">
                            {isEd ? (
                              <input
                                type="number"
                                min={0}
                                max={max}
                                step={0.5}
                                className="field w-16 px-1 py-1 text-center"
                                value={s[k]}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const v = raw === '' ? undefined : Math.max(0, Math.min(max, Number(raw)));
                                  update((st) => ({ ...st, manual: { ...st.manual, [r.key]: { ...st.manual[r.key], [k]: v } } }));
                                }}
                              />
                            ) : (
                              <span className={cx('font-mono', manual ? 'text-info' : 'text-slate-200')}>{s[k]}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 text-center font-mono font-bold text-white">{tot}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Btn size="sm" variant={isEd ? 'primary' : 'subtle'} onClick={() => setEditing(isEd ? null : r.key)}>
                            {isEd ? 'Готово' : 'Бали'}
                          </Btn>
                          {isEd && state.manual[r.key] && (
                            <Btn size="sm" variant="subtle" title="Повернути автоматичні бали" onClick={() => update((st) => { const m = { ...st.manual }; delete m[r.key]; return { ...st, manual: m }; })}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Btn>
                          )}
                          {r.imported && (
                            <Btn size="sm" variant="subtle" title="Видалити" onClick={() => update((st) => ({ ...st, imported: st.imported.filter((e) => participantKey(e) !== r.key) }))}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">Сині бали — виставлені вручну. Ручна оцінка має пріоритет над автоматичною.</p>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Рейтинг команд" icon={<Trophy className="h-4 w-4 text-warn" />}>
          {teams.length === 0 ? (
            <p className="text-sm text-slate-400">Рейтинг з’явиться після імпорту результатів.</p>
          ) : (
            <ol className="space-y-2">
              {teams.map((t, i) => (
                <li key={t.team + i} className="flex items-center gap-3">
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm font-bold', i === 0 ? 'bg-warn text-ink-950' : 'bg-ink-700 text-slate-300')}>{i + 1}</span>
                  <span className="flex-1">
                    <span className="block font-semibold text-white">{t.team}</span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-ink-700">
                      <span className="block h-full rounded-full bg-signal" style={{ width: `${t.avg}%` }} />
                    </span>
                  </span>
                  <span className="text-right font-mono text-sm text-white">
                    {t.avg}
                    <span className="block text-[10px] text-slate-500">{t.members} учасн.</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Підсумки заняття" icon={<BarChart3 className="h-4 w-4 text-signal" />}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-ink-600 p-3">
              <div className="text-2xl font-black text-white">{rows.length}</div>
              <div className="text-xs text-slate-400">учасників</div>
            </div>
            <div className="rounded-lg border border-ink-600 p-3">
              <div className="text-2xl font-black text-white">{avg}</div>
              <div className="text-xs text-slate-400">середній бал</div>
            </div>
            <div className="rounded-lg border border-ink-600 p-3">
              <div className="text-2xl font-black text-white">{teams.length}</div>
              <div className="text-xs text-slate-400">команд</div>
            </div>
          </div>
          {rows.length > 0 && <p className="mt-3 text-sm text-slate-300">Середній рівень: <b className="text-white">{rankFor(avg).title}</b></p>}
          <div className="mt-4">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">Найчастіші помилки — обговоріть на рефлексії</div>
            {mistakes.length === 0 ? (
              <p className="text-sm text-slate-500">Немає даних.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {mistakes.map(([label, n]) => (
                  <li key={label} className="flex gap-2">
                    <Tag tone="bad">×{n}</Tag>
                    <span className="text-slate-300">{label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Скидання" tone="alert">
        <div className="flex flex-wrap gap-2">
          <Btn variant="danger" onClick={() => { if (window.confirm('Скинути прогрес на цьому пристрої? Імпортовані результати збережуться.')) { resetAll(true); toast('Прогрес скинуто'); } }}>
            <RotateCcw className="h-4 w-4" /> Скинути прогрес заняття
          </Btn>
          <Btn variant="danger" onClick={() => { if (window.confirm('Видалити ВСЕ, включно з імпортованими результатами і ручними балами?')) { resetAll(false); toast('Усі дані видалено'); } }}>
            <Trash2 className="h-4 w-4" /> Видалити всі дані
          </Btn>
        </div>
      </Panel>
    </div>
  );
}
