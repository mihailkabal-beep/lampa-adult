import type { ReactNode } from 'react';
import { useTask } from '../lib/store';
import { TASKS } from '../lib/config';
import { Choice, Explain, TaskShell, choiceState, scoreMulti } from './ui';

export interface Opt {
  id: string;
  t: string;
  /** Наслідок рішення — показується після відповіді. */
  effect?: string;
  partial?: number; // частка балу для одиночного вибору (0..1)
}

export function ChoiceTask({
  id,
  code,
  title,
  intro,
  options,
  correct,
  multi,
  why,
  cols = 1,
}: {
  id: string;
  code: string;
  title: string;
  intro?: ReactNode;
  options: Opt[];
  correct: string[];
  multi?: boolean;
  why: ReactNode;
  cols?: 1 | 2;
}) {
  const t = useTask<string[]>(id, []);
  const max = TASKS[id].max;
  const toggle = (oid: string) => {
    if (multi) t.set(t.answer.includes(oid) ? t.answer.filter((x) => x !== oid) : [...t.answer, oid]);
    else t.set([oid]);
  };
  const selectedEffects = options.filter((o) => t.answer.includes(o.id) && o.effect);
  return (
    <TaskShell
      id={id}
      code={code}
      title={title}
      intro={intro}
      canSubmit={t.answer.length > 0}
      submitHint={multi ? 'Оберіть один або кілька варіантів.' : 'Оберіть варіант.'}
      onSubmit={() => {
        let score: number;
        if (multi) score = scoreMulti(t.answer, correct, options.map((o) => o.id), max);
        else {
          const o = options.find((x) => x.id === t.answer[0]);
          score = correct.includes(t.answer[0]) ? max : (o?.partial ?? 0) * max;
        }
        const decisions = multi
          ? options.map((o) => ({ label: `${title}: «${o.t}» — ${correct.includes(o.id) ? 'доречно' : 'недоречно'}`, ok: t.answer.includes(o.id) === correct.includes(o.id) }))
          : [{ label: `${title}: «${options.find((o) => o.id === t.answer[0])?.t ?? ''}»`, ok: correct.includes(t.answer[0]) }];
        t.submit({ score, decisions });
      }}
    >
      <div className={cols === 2 ? 'grid gap-2 sm:grid-cols-2' : 'grid gap-2'}>
        {options.map((o) => (
          <Choice key={o.id} multi={multi} selected={t.answer.includes(o.id)} disabled={t.locked} state={choiceState(o.id, t.answer, correct, t.reveal)} onClick={() => toggle(o.id)}>
            {o.t}
          </Choice>
        ))}
      </div>
      {t.locked && selectedEffects.length > 0 && (
        <div className="space-y-2">
          {selectedEffects.map((o) => (
            <Explain key={o.id} tone={correct.includes(o.id) ? 'good' : 'bad'} title={`Наслідок: «${o.t}»`}>
              {o.effect}
            </Explain>
          ))}
        </div>
      )}
      {t.reveal && <Explain tone="info" title="Розбір">{why}</Explain>}
    </TaskShell>
  );
}
