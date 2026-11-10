import { useTask } from '../lib/store';
import { ModuleHeader, NextModule, TaskShell, TextArea, cx } from '../components/ui';

const QS = [
  { id: 'q1', q: 'Що є найважливішим для ефективної комунікації малої групи?', chips: ['Чіткі ролі', 'Однозначні повідомлення', 'Підтвердження отримання', 'Довіра', 'Резервний канал'], pts: 2 },
  { id: 'q2', q: 'Чому неперевірена інформація може бути небезпечною?', chips: ['Викликає паніку', 'Змушує діяти хибно', 'Руйнує довіру до каналу', 'Нею можна маніпулювати'], pts: 2 },
  { id: 'q3', q: 'Який елемент створеного протоколу ви вважаєте найважливішим?', chips: ['Ролі', 'Умовні сигнали', 'Шаблон повідомлення', 'Правила', 'Резервний канал'], pts: 1 },
];

type A = { chips: Record<string, string[]>; text: Record<string, string> };

export default function M7Reflection() {
  const t = useTask<A>('m7.reflect', { chips: {}, text: {} });
  const filled = QS.filter((q) => (t.answer.text[q.id] ?? '').trim().length >= 20).length;
  return (
    <div>
      <ModuleHeader index={7} title="Рефлексія" codename="DEBRIEF" minutes={5} max={5}>
        Немає правильних чи неправильних відповідей. Оберіть ключові ідеї та поясніть власними словами — бали нараховуються за повноту думки.
      </ModuleHeader>
      <TaskShell
        id="m7.reflect"
        code="7"
        title="Три запитання після операції"
        canSubmit={filled === 3}
        submitHint="Дайте розгорнуту відповідь (від 20 символів) на кожне запитання."
        submitLabel="Завершити рефлексію"
        onSubmit={() => {
          let score = 0;
          for (const q of QS) {
            const txt = (t.answer.text[q.id] ?? '').trim();
            const chip = (t.answer.chips[q.id] ?? []).length > 0;
            score += txt.length >= 60 || (txt.length >= 20 && chip) ? q.pts : q.pts / 2;
          }
          t.submit({ score, decisions: [], feedback: 'Дякуємо за чесну рефлексію. Ваші відповіді потраплять у звіт для викладача.' });
        }}
      >
        {QS.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-ink-600 bg-ink-900/40 p-4">
            <p className="mb-3 font-semibold text-white">
              {i + 1}. {q.q}
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {q.chips.map((c) => {
                const sel = (t.answer.chips[q.id] ?? []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={t.locked}
                    onClick={() => {
                      const cur = t.answer.chips[q.id] ?? [];
                      t.set({ ...t.answer, chips: { ...t.answer.chips, [q.id]: sel ? cur.filter((x) => x !== c) : [...cur, c] } });
                    }}
                    className={cx('rounded-full border px-3 py-1 text-xs transition', sel ? 'border-signal bg-signal/15 text-signal' : 'border-ink-500 text-slate-300 hover:border-slate-300')}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <TextArea value={t.answer.text[q.id] ?? ''} disabled={t.locked} max={500} rows={3} onChange={(v) => t.set({ ...t.answer, text: { ...t.answer.text, [q.id]: v } })} placeholder="Ваша відповідь…" />
          </div>
        ))}
      </TaskShell>
      <NextModule to="results" />
    </div>
  );
}
