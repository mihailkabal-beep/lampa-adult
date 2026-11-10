import { useRef } from 'react';
import { Award, CheckCircle2, ClipboardCopy, Download, Printer, RotateCcw, XCircle } from 'lucide-react';
import { moduleScores, total, useApp } from '../lib/store';
import { MODULES, TASKS, rankFor } from '../lib/config';
import { buildExport, copyText, downloadFile, printElement, resultToText, safeName } from '../lib/export';
import { Btn, Explain, Panel, Tag, cx } from '../components/ui';
import { toast } from '../components/Toaster';
import type { ScoredModule } from '../lib/types';

export default function Results() {
  const { state, resetAll, go } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const scores = moduleScores(state);
  const sum = total(scores);
  const rank = rankFor(sum);
  const decisions = Object.entries(state.results).flatMap(([id, r]) => r.decisions.map((d) => ({ ...d, task: TASKS[id]?.title ?? id })));
  const good = decisions.filter((d) => d.ok);
  const bad = decisions.filter((d) => !d.ok);
  const doneTasks = Object.keys(state.results).length;
  const allTasks = Object.keys(TASKS).length;
  const R = 52;
  const C = 2 * Math.PI * R;

  const weakest = (Object.keys(scores) as ScoredModule[])
    .map((m) => ({ m, ratio: scores[m] / MODULES.find((x) => x.id === m)!.max }))
    .sort((a, b) => a.ratio - b.ratio)[0];

  return (
    <div>
      <div ref={ref} className="space-y-6">
        <div className="animate-rise">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">REPORT · Підсумок операції</div>
          <h2 className="text-3xl font-bold text-white">Операцію «Єдиний канал» завершено</h2>
          <p className="mt-1 text-slate-400">
            {state.profile.name || 'Учасник'} · група {state.profile.group || '—'} · команда «{state.profile.team || '—'}»
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3 h-44 w-44">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r={R} stroke="#1b2840" strokeWidth="10" fill="none" />
                  <circle cx="60" cy="60" r={R} stroke={sum >= 75 ? '#2ee6c5' : sum >= 50 ? '#ffb547' : '#ff5d6c'} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - sum / 100)} style={{ transition: 'stroke-dashoffset 1s' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-black text-white">{sum}</div>
                  <div className="font-mono text-xs text-slate-400">з 100 · {Math.round(sum)}%</div>
                </div>
              </div>
              <Award className="h-6 w-6 text-signal" />
              <div className="mt-1 text-lg font-bold text-white">{rank.title}</div>
              <p className="mt-1 text-sm text-slate-400">{rank.note}</p>
              <div className="mt-3 font-mono text-xs text-slate-500">
                Виконано завдань: {doneTasks} / {allTasks}
              </div>
            </div>
          </Panel>

          <Panel title="Бали за модулями">
            <div className="space-y-3">
              {MODULES.filter((m) => m.max && m.id !== 'results').map((m) => {
                const v = scores[m.id as ScoredModule];
                const manual = typeof state.manual.local?.[m.id as ScoredModule] === 'number';
                return (
                  <button key={m.id} type="button" onClick={() => go(m.id)} className="block w-full text-left">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-200">
                        {m.short} {manual && <Tag tone="info">оцінка викладача</Tag>}
                      </span>
                      <span className="font-mono text-white">
                        {v} / {m.max}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                      <div className={cx('h-full rounded-full', v / m.max >= 0.75 ? 'bg-signal' : v / m.max >= 0.5 ? 'bg-warn' : 'bg-alert')} style={{ width: `${(v / m.max) * 100}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
            {weakest && weakest.ratio < 0.75 && (
              <div className="mt-4">
                <Explain tone="warn" title="Зона розвитку">
                  Найменший результат — «{MODULES.find((x) => x.id === weakest.m)!.title}». Перегляньте пояснення до помилкових рішень цього модуля.
                </Explain>
              </div>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel title={`Правильні рішення · ${good.length}`} icon={<CheckCircle2 className="h-4 w-4 text-signal" />}>
            <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {good.length === 0 && <li className="text-slate-500">Поки немає.</li>}
              {good.map((d, i) => (
                <li key={i} className="flex gap-2 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                  {d.label}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={`Помилкові рішення · ${bad.length}`} icon={<XCircle className="h-4 w-4 text-alert" />}>
            <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {bad.length === 0 && <li className="text-slate-500">Помилок немає.</li>}
              {bad.map((d, i) => (
                <li key={i} className="flex gap-2 text-slate-300">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alert" />
                  {d.label}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Надіслати результат викладачу" className="no-print mt-6">
        <p className="mb-4 text-sm text-slate-300">
          Застосунок працює без сервера, тож результат передається файлом. Завантажте файл і надішліть його в чат заняття (Teams / Meet) —
          викладач імпортує його у свою панель. Або скопіюйте короткий текстовий звіт.
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn
            onClick={() => {
              const e = buildExport(state);
              const ok = downloadFile(`result_${safeName(state.profile.team)}_${safeName(state.profile.name)}.json`, JSON.stringify(e, null, 2), 'application/json');
              toast(ok ? 'Файл результату завантажено' : 'Не вдалося створити файл', ok);
            }}
          >
            <Download className="h-4 w-4" /> Файл результату (.json)
          </Btn>
          <Btn
            variant="ghost"
            onClick={async () => {
              const ok = await copyText(resultToText(buildExport(state)));
              toast(ok ? 'Звіт скопійовано — вставте його в чат' : 'Не вдалося скопіювати', ok);
            }}
          >
            <ClipboardCopy className="h-4 w-4" /> Копіювати текстовий звіт
          </Btn>
          <Btn variant="ghost" onClick={() => printElement(ref.current)}>
            <Printer className="h-4 w-4" /> Друк / PDF
          </Btn>
          <Btn
            variant="danger"
            onClick={() => {
              if (window.confirm('Почати операцію заново? Увесь прогрес на цьому пристрої буде видалено.')) {
                resetAll();
                toast('Прогрес скинуто');
              }
            }}
          >
            <RotateCcw className="h-4 w-4" /> Пройти заново
          </Btn>
        </div>
      </Panel>
    </div>
  );
}
