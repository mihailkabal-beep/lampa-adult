import { MessageSquareText } from 'lucide-react';
import { useTask } from '../lib/store';
import { Choice, Explain, ModuleHeader, NextModule, TaskShell, TextArea, choiceState, cx, scoreMulti } from '../components/ui';

const DECODE = [
  {
    id: 'd1',
    msg: 'Зустріч перенесено.',
    options: [
      { id: 'a', t: 'Зустріч відбудеться, але в інший час або в іншому місці' },
      { id: 'b', t: 'Зустрічі не буде взагалі' },
      { id: 'c', t: 'Зустріч зупинили посередині й продовжать згодом' },
      { id: 'd', t: 'Зустріч уже відбулася раніше' },
    ],
    correct: 'a',
    why: '«Перенесено» означає, що подія відбудеться, але з новими параметрами. Таке повідомлення неповне без нового часу і місця — одержувач змушений перепитувати.',
  },
  {
    id: 'd2',
    msg: 'Зустріч скасовано.',
    options: [
      { id: 'a', t: 'Зустріч відбудеться пізніше' },
      { id: 'b', t: 'Зустріч не відбудеться, нового часу не призначено' },
      { id: 'c', t: 'Зустріч проведуть онлайн' },
      { id: 'd', t: 'Зустріч відбудеться без керівника' },
    ],
    correct: 'b',
    why: '«Скасовано» — подію відмінено повністю. Якщо планується нова дата, треба писати «перенесено на…», інакше люди не прийдуть.',
  },
  {
    id: 'd3',
    msg: 'Зустріч тимчасово призупинено.',
    options: [
      { id: 'a', t: 'Зустріч скасовано остаточно' },
      { id: 'b', t: 'Зустріч перенесено на завтра' },
      { id: 'c', t: 'Зустріч зупинено, вона відновиться після окремого сигналу; час відновлення поки невідомий' },
      { id: 'd', t: 'Можна розходитися додому' },
    ],
    correct: 'c',
    why: '«Призупинено» — пауза без визначеного кінця. Учасники мають залишатися на зв’язку й чекати сигналу про відновлення. Добре повідомлення одразу каже, коли буде наступне оновлення.',
  },
  {
    id: 'd4',
    msg: 'Інформацію отримано.',
    options: [
      { id: 'a', t: 'Повідомлення дійшло до адресата — і тільки це' },
      { id: 'b', t: 'Інформацію перевірено, вона правдива' },
      { id: 'c', t: 'Адресат погоджується і вже виконує' },
      { id: 'd', t: 'Інформацію передано всім іншим' },
    ],
    correct: 'a',
    why: '«Отримано» підтверджує лише доставку. Це не означає ні перевірку, ні згоду, ні виконання. Змішування цих статусів — типова причина хибних очікувань у команді.',
  },
  {
    id: 'd5',
    msg: 'Інформація перевіряється.',
    options: [
      { id: 'a', t: 'Інформація правдива, діяти негайно' },
      { id: 'b', t: 'Інформація хибна, ігнорувати' },
      { id: 'c', t: 'Повідомлення прийнято, але достовірність ще не підтверджено — не поширювати як факт' },
      { id: 'd', t: 'Канал зв’язку не працює' },
    ],
    correct: 'c',
    why: 'Статус «перевіряється» — проміжний. Поки немає підтвердження, повідомлення не можна поширювати як факт, але й не варто відкидати.',
  },
];

function DecodeTask() {
  const t = useTask<Record<string, string>>('m2.decode', {});
  const done = DECODE.every((d) => t.answer[d.id]);
  return (
    <TaskShell
      id="m2.decode"
      code="2.1"
      title="Розшифруй сигнал"
      intro="Ви отримали п’ять коротких повідомлень. Для кожного оберіть ТОЧНЕ значення — те, що повідомлення гарантує, а не те, що «мабуть мали на увазі»."
      canSubmit={done}
      submitHint="Оберіть значення для всіх п’яти повідомлень."
      onSubmit={() => {
        const decisions = DECODE.map((d) => ({ label: `«${d.msg}»`, ok: t.answer[d.id] === d.correct }));
        const n = decisions.filter((d) => d.ok).length;
        t.submit({
          score: n * 2,
          decisions,
          feedback: n === 5 ? 'Бездоганно: ви розрізняєте статуси повідомлень.' : `Правильно ${n} з 5. Перегляньте пояснення до позначених червоним.`,
        });
      }}
    >
      {DECODE.map((d, i) => (
        <div key={d.id} className="rounded-lg border border-ink-600 bg-ink-900/40 p-3">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-signal" />
            <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
            <span className="rounded-md bg-ink-700 px-2 py-1 font-mono text-sm text-white">{d.msg}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {d.options.map((o) => (
              <Choice
                key={o.id}
                selected={t.answer[d.id] === o.id}
                state={choiceState(o.id, t.answer[d.id] ? [t.answer[d.id]] : [], [d.correct], t.reveal)}
                disabled={t.locked}
                onClick={() => t.set({ ...t.answer, [d.id]: o.id })}
              >
                {o.t}
              </Choice>
            ))}
          </div>
          {t.reveal && <div className="mt-2"><Explain tone={t.answer[d.id] === d.correct ? 'good' : 'bad'}>{d.why}</Explain></div>}
        </div>
      ))}
    </TaskShell>
  );
}

const AMBIG = [
  { id: 'a1', t: 'Збираємось там же, де минулого разу.', amb: true, why: 'Не всі знають або однаково пам’ятають «минулий раз».' },
  { id: 'a2', t: 'Зустріч о 14:30 у читальній залі, 2 поверх.', amb: false, why: 'Є час і точне місце.' },
  { id: 'a3', t: 'Скоро все буде нормально.', amb: true, why: '«Скоро» і «нормально» — без змісту для дії.' },
  { id: 'a4', t: 'Терміново всім туди!', amb: true, why: 'Куди? Кому саме? Чому? Створює паніку.' },
  { id: 'a5', t: 'Вихід Б відкрито з 10:15, прохід через головний хол.', amb: false, why: 'Конкретний об’єкт, час і маршрут.' },
  { id: 'a6', t: 'Зв’язок відновлено. Перевірив оператор Іван, 11:00.', amb: false, why: 'Є факт, джерело і час перевірки.' },
  { id: 'a7', t: 'Здається, щось сталося на першому поверсі.', amb: true, why: 'Припущення без фактів подається як новина.' },
];

function AmbiguityTask() {
  const t = useTask<Record<string, 'clear' | 'amb'>>('m2.ambig', {});
  const done = AMBIG.every((a) => t.answer[a.id]);
  return (
    <TaskShell
      id="m2.ambig"
      code="2.2"
      title="Детектор неоднозначності"
      intro="Позначте кожне повідомлення: чи можна за ним діяти без уточнень («однозначне»), чи воно допускає різні тлумачення («неоднозначне»)."
      canSubmit={done}
      submitHint="Позначте всі сім повідомлень."
      onSubmit={() => {
        const decisions = AMBIG.map((a) => ({ label: `«${a.t}»`, ok: (t.answer[a.id] === 'amb') === a.amb }));
        const n = decisions.filter((d) => d.ok).length;
        t.submit({ score: Math.round((n / AMBIG.length) * 2 * 2) / 2, decisions, feedback: `Правильно класифіковано ${n} з ${AMBIG.length}.` });
      }}
    >
      <div className="space-y-2">
        {AMBIG.map((a) => {
          const v = t.answer[a.id];
          const ok = v ? (v === 'amb') === a.amb : false;
          return (
            <div
              key={a.id}
              className={cx(
                'rounded-lg border p-3',
                t.reveal ? (ok ? 'border-signal/60' : 'border-alert/60') : 'border-ink-600',
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="flex-1 font-mono text-sm text-white">{a.t}</span>
                <div className="flex gap-2">
                  {(['clear', 'amb'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={t.locked}
                      onClick={() => t.set({ ...t.answer, [a.id]: k })}
                      className={cx(
                        'rounded-md border px-3 py-1.5 text-xs font-semibold transition',
                        v === k ? (k === 'clear' ? 'border-signal bg-signal/15 text-signal' : 'border-warn bg-warn/15 text-warn') : 'border-ink-500 text-slate-300 hover:border-slate-300',
                      )}
                    >
                      {k === 'clear' ? 'Однозначне' : 'Неоднозначне'}
                    </button>
                  ))}
                </div>
              </div>
              {t.reveal && (
                <p className="mt-2 text-xs text-slate-400">
                  <b className={a.amb ? 'text-warn' : 'text-signal'}>{a.amb ? 'Неоднозначне' : 'Однозначне'}:</b> {a.why}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </TaskShell>
  );
}

const ERR_OPTS = [
  { id: 'time', t: 'Новий час зустрічі' },
  { id: 'place', t: 'Точне місце («туди ж» — не місце)' },
  { id: 'sender', t: 'Хто відправник / джерело' },
  { id: 'stamp', t: 'Час складання повідомлення' },
  { id: 'emo', t: 'Більше емоційних слів, щоб усі звернули увагу' },
  { id: 'caps', t: 'Великі літери й знаки оклику' },
  { id: 'all', t: 'Повний список імен усіх учасників групи' },
];
const ERR_OK = ['time', 'place', 'sender', 'stamp'];

function ErrorTask() {
  const t = useTask<{ sel: string[]; fix: string }>('m2.error', { sel: [], fix: '' });
  const toggle = (id: string) => t.set({ ...t.answer, sel: t.answer.sel.includes(id) ? t.answer.sel.filter((x) => x !== id) : [...t.answer.sel, id] });
  return (
    <TaskShell
      id="m2.error"
      code="2.3"
      title="Знайди помилку в повідомленні"
      intro={
        <>
          До команди надійшло повідомлення:
          <div className="my-3 rounded-lg border border-alert/40 bg-alert/5 p-3 font-mono text-white">
            «ТЕРМІНОВО!!! Зустріч перенесено. Усім прийти туди ж. Передайте далі.»
          </div>
          Позначте, чого бракує, щоб повідомлення було придатним до дії, а потім перепишіть його правильно.
        </>
      }
      canSubmit={t.answer.sel.length > 0 && t.answer.fix.trim().length >= 20}
      submitHint="Позначте елементи й напишіть виправлене повідомлення (від 20 символів)."
      onSubmit={() => {
        const multi = scoreMulti(t.answer.sel, ERR_OK, ERR_OPTS.map((o) => o.id), 2);
        const fix = t.answer.fix;
        const hasTime = /\b\d{1,2}[:.]\d{2}\b/.test(fix);
        const notCaps = fix.replace(/[^A-ZА-ЯІЇЄҐ]/g, '').length < fix.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ]/g, '').length * 0.5;
        const fixPts = (hasTime ? 0.5 : 0) + (notCaps && fix.length >= 40 ? 0.5 : 0);
        t.submit({
          score: multi + fixPts,
          decisions: [
            ...ERR_OPTS.map((o) => ({ label: `«${o.t}»: ${ERR_OK.includes(o.id) ? 'бракує' : 'зайве'}`, ok: t.answer.sel.includes(o.id) === ERR_OK.includes(o.id) })),
            { label: 'Виправлене повідомлення містить точний час', ok: hasTime },
          ],
          feedback: `Аналіз: ${multi}/2 б. Виправлене повідомлення: ${fixPts}/1 б.${hasTime ? '' : ' У ньому немає точного часу (формат 14:30).'}`,
        });
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ERR_OPTS.map((o) => (
          <Choice key={o.id} multi selected={t.answer.sel.includes(o.id)} disabled={t.locked} state={choiceState(o.id, t.answer.sel, ERR_OK, t.reveal)} onClick={() => toggle(o.id)}>
            {o.t}
          </Choice>
        ))}
      </div>
      <TextArea
        label="Ваш виправлений варіант"
        value={t.answer.fix}
        disabled={t.locked}
        max={300}
        onChange={(v) => t.set({ ...t.answer, fix: v })}
        placeholder="Напр.: Зустріч команди перенесено на 15:00, ауд. 204 (2 поверх)…"
      />
      {t.reveal && (
        <Explain tone="info" title="Зразок">
          «Зустріч команди перенесено з 14:00 на 15:30, аудиторія 204 (2 поверх). Надіслала: координаторка Марія, 12:10. Підтвердіть отримання словом “ПРИЙНЯТО”.»
          Великі літери й «ТЕРМІНОВО!!!» не додають змісту — вони лише підвищують тривогу.
        </Explain>
      )}
    </TaskShell>
  );
}

export default function M2Signals() {
  return (
    <div>
      <ModuleHeader index={2} title="Один сигнал — різні значення" codename="DECODE" minutes={10} max={15}>
        У кризовій ситуації одне слово може змінити дії десятків людей. Навчіться читати повідомлення точно — так, як компілятор читає код: без «мабуть».
      </ModuleHeader>
      <div className="space-y-6">
        <DecodeTask />
        <AmbiguityTask />
        <ErrorTask />
      </div>
      <NextModule to="m3" />
    </div>
  );
}
