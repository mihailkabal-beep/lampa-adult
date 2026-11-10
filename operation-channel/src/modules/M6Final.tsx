import { CheckCircle2, ChevronLeft, ChevronRight, Flag, Play, Siren } from 'lucide-react';
import { useApp, useTask } from '../lib/store';
import { ChoiceTask } from '../components/ChoiceTask';
import { Btn, Explain, ModuleHeader, NextModule, OrderList, Panel, Select, Tag, TaskShell, TextArea, cx, shuffle } from '../components/ui';

const PEOPLE = [
  { id: 'admin', t: 'Ірина — адміністраторка центру, знає всі приміщення й має доступ до гучномовця' },
  { id: 'it', t: 'Тарас — студент-ІТшник, волонтер, налаштовує резервний зв’язок' },
  { id: 'guard', t: 'Олег — охоронець на вході, бачить, хто заходить і виходить' },
  { id: 'teacher', t: 'Наталя — методистка, уважна до деталей, веде документацію' },
  { id: 'nurse', t: 'Віктор — фельдшер медпункту, спокійно перевіряє факти' },
];
const ROLES = [
  { value: 'coordinator', label: 'Координатор' },
  { value: 'operator', label: 'Оператор зв’язку' },
  { value: 'analyst', label: 'Аналітик' },
  { value: 'observer', label: 'Спостерігач' },
  { value: 'recorder', label: 'Реєстратор' },
];
// Допустимі (обґрунтовані) варіанти для кожної особи
const ROLE_OK: Record<string, string[]> = {
  admin: ['coordinator'],
  it: ['operator'],
  guard: ['observer'],
  teacher: ['recorder', 'analyst'],
  nurse: ['analyst', 'recorder'],
};

function Step1() {
  const t = useTask<Record<string, string>>('m6.s1', {});
  const used = Object.values(t.answer).filter(Boolean);
  const dup = used.length !== new Set(used).size;
  return (
    <TaskShell
      id="m6.s1"
      code="6.1"
      title="Визначте ролі учасників"
      intro="Розподіліть п’ять ролей між людьми, які опинилися в центрі. Кожна роль — одна людина."
      canSubmit={PEOPLE.every((p) => t.answer[p.id]) && !dup}
      submitHint={dup ? 'Ролі не повинні повторюватися.' : 'Призначте ролі всім п’ятьом.'}
      onSubmit={() => {
        const decisions = PEOPLE.map((p) => ({ label: `${p.t.split(' — ')[0]} → ${ROLES.find((r) => r.value === t.answer[p.id])?.label}`, ok: ROLE_OK[p.id].includes(t.answer[p.id]) }));
        const n = decisions.filter((d) => d.ok).length;
        t.submit({ score: Math.max(0, n - 1), decisions, feedback: `Обґрунтованих призначень: ${n} з 5.` });
      }}
    >
      {PEOPLE.map((p) => (
        <div key={p.id} className={cx('grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_220px] sm:items-center', t.reveal ? (ROLE_OK[p.id].includes(t.answer[p.id]) ? 'border-signal/60' : 'border-alert/60') : 'border-ink-600')}>
          <div className="text-sm text-slate-200">{p.t}</div>
          <Select value={t.answer[p.id] ?? ''} disabled={t.locked} onChange={(v) => t.set({ ...t.answer, [p.id]: v })} options={ROLES} />
          {t.reveal && <div className="text-xs text-slate-400 sm:col-span-2">Обґрунтовано: {ROLE_OK[p.id].map((r) => ROLES.find((x) => x.value === r)!.label).join(' або ')}</div>}
        </div>
      ))}
    </TaskShell>
  );
}

const ALG = [
  { id: 'obs', text: 'Спостерігач фіксує факт і передає оператору за шаблоном' },
  { id: 'reg', text: 'Реєстратор записує повідомлення в журнал (час, джерело, статус)' },
  { id: 'ana', text: 'Аналітик перевіряє та присвоює рівень достовірності' },
  { id: 'coord', text: 'Координатор ухвалює рішення, що і кому повідомити' },
  { id: 'op', text: 'Оператор передає повідомлення адресатам' },
  { id: 'ack', text: 'Адресати підтверджують отримання, реєстратор оновлює статус' },
];

function Step2() {
  const t = useTask<{ id: string; text: string }[]>('m6.s2', shuffle(ALG, 23));
  const ok = ALG.map((a) => a.id);
  return (
    <TaskShell
      id="m6.s2"
      code="6.2"
      title="Алгоритм обміну інформацією"
      intro="Складіть алгоритм руху інформації в команді — від факту до підтвердження."
      canSubmit
      onSubmit={() => {
        const pos = t.answer.filter((x, i) => x.id === ok[i]).length;
        // Реєстрація і перевірка можуть мінятися місцями — це теж обґрунтовано
        const alt = t.answer.map((x) => x.id).join() === ['obs', 'ana', 'reg', 'coord', 'op', 'ack'].join();
        const score = pos === 6 || alt ? 4 : pos >= 4 ? 2 : pos >= 2 ? 1 : 0;
        t.submit({ score, decisions: [{ label: 'Алгоритм обміну інформацією', ok: score === 4 }], feedback: `На своєму місці ${alt ? 6 : pos} з 6 кроків.` });
      }}
    >
      <OrderList items={t.answer} onChange={t.set} disabled={t.locked} correctOrder={t.reveal ? ok : undefined} />
    </TaskShell>
  );
}

function Step3() {
  return (
    <ChoiceTask
      id="m6.s3"
      code="6.3"
      title="Резервний канал"
      intro="Основний канал (месенджер через Wi‑Fi центру) працює з перебоями. Що закладаєте в план?"
      multi
      options={[
        { id: 'sms', t: 'SMS на заздалегідь складений список номерів команди' },
        { id: 'pmr', t: 'Цивільні рації PMR446 для команди (якщо є в центрі)' },
        { id: 'point', t: 'Точка збору в холі кожні 15 хвилин для звірки' },
        { id: 'trigger', t: 'Чітка умова переходу: 2 повідомлення без підтвердження за 5 хв' },
        { id: 'same', t: 'Ще один месенджер через той самий Wi‑Fi', effect: 'Він залежить від тієї ж точки відмови — і впав разом з основним.' },
        { id: 'social', t: 'Публічний пост у соцмережах замість внутрішнього каналу', effect: 'Ви розкрили внутрішню інформацію стороннім і отримали хвилю коментарів-чуток.' },
      ]}
      correct={['sms', 'pmr', 'point', 'trigger']}
      why="Резерв має бути незалежним від основного каналу (інша «точка відмови»), заздалегідь узгодженим і мати умову переходу. Як і в ІТ: резервний сервер у тій самій стійці — не резерв."
    />
  );
}

function Step4() {
  return (
    <ChoiceTask
      id="m6.s4"
      code="6.4"
      title="Порядок перевірки повідомлень"
      intro="Які правила перевірки ви включаєте в план? Оберіть усі доречні."
      multi
      cols={2}
      options={[
        { id: 'src', t: 'Кожне повідомлення має джерело і час' },
        { id: 'two', t: 'Важливе — підтвердити з другого незалежного джерела' },
        { id: 'status', t: 'До перевірки — статус «перевіряється», не поширювати' },
        { id: 'id', t: 'Перевіряти особу того, хто пише «від адміністрації»' },
        { id: 'fast', t: 'Що швидше прийшло — те й правда' },
        { id: 'many', t: 'Якщо переслали багато разів — значить перевірено' },
      ]}
      correct={['src', 'two', 'status', 'id']}
      why="Кількість пересилань і швидкість не підтверджують правдивість — це класичні пастки інформаційного поширення. Працюють лише джерело, час, незалежне підтвердження і явний статус."
    />
  );
}

const CHECKS: { label: string; test: (s: string) => boolean }[] = [
  { label: 'Що сталося (без паніки)', test: (s) => /авар|збій|ситуац|несправ|сталос|проблем|перебо/i.test(s) },
  { label: 'Що робити відвідувачам', test: (s) => /прох|будь ласка|залишайт|рухайт|пройдіт|ідіть|збер|слідуйт|чекайт|виход/i.test(s) },
  { label: 'Де / куди (місце)', test: (s) => /хол|вихід|поверх|ауд|зал|вхід|двер/i.test(s) },
  { label: 'Коли наступне оновлення / час', test: (s) => /\d{1,2}[:.]\d{2}|хвилин|оновлен|повідом/i.test(s) },
  { label: 'Хто звертається / до кого звертатися', test: (s) => /адмін|працівник|черговий|персонал|команд|координатор|зверт/i.test(s) },
  { label: 'Спокійний тон (без CAPS і «!!!»)', test: (s) => !/!!|[А-ЯІЇЄҐ]{6,}/.test(s) && s.length > 0 },
];

function Step5() {
  const t = useTask<string>('m6.s5', '');
  const passed = CHECKS.filter((c) => c.test(t.answer));
  const len = t.answer.trim().length;
  return (
    <TaskShell
      id="m6.s5"
      code="6.5"
      title="Інформаційне звернення до відвідувачів"
      intro="Напишіть коротке звернення (до 400 символів), яке зачитають у холі та розмістять на дошці. Індикатор праворуч показує, що вже є у тексті."
      canSubmit={len >= 60}
      submitHint="Мінімум 60 символів."
      onSubmit={() => {
        const n = passed.length;
        const score = n >= 6 ? 4 : n >= 5 ? 3.5 : n >= 4 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0;
        t.submit({
          score,
          decisions: CHECKS.map((c) => ({ label: `Звернення: ${c.label}`, ok: c.test(t.answer) })),
          feedback: `Елементів звернення: ${n} з 6. Автоматична перевірка орієнтовна — викладач оцінює зміст.`,
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <TextArea value={t.answer} onChange={t.set} disabled={t.locked} rows={7} max={400} placeholder="Шановні відвідувачі! …" />
        <ul className="space-y-1.5 text-sm">
          {CHECKS.map((c) => {
            const ok = c.test(t.answer);
            return (
              <li key={c.label} className={cx('flex items-start gap-2', ok ? 'text-signal' : 'text-slate-500')}>
                <CheckCircle2 className={cx('mt-0.5 h-4 w-4 shrink-0', !ok && 'opacity-30')} /> {c.label}
              </li>
            );
          })}
        </ul>
      </div>
      {t.reveal && (
        <Explain tone="info" title="Зразок">
          «Шановні відвідувачі! У центрі технічна аварія, небезпеки для вас наразі немає. Будь ласка, пройдіть до головного холу (1 поверх) через вихід Б — вихід А зачинено. Працівники в жовтих жилетах допоможуть. Наступне оновлення — о 12:45. Довіряйте лише оголошенням адміністрації.»
        </Explain>
      )}
    </TaskShell>
  );
}

const STEPS = [
  { id: 'm6.s1', t: 'Ролі', C: Step1 },
  { id: 'm6.s2', t: 'Алгоритм', C: Step2 },
  { id: 'm6.s3', t: 'Резерв', C: Step3 },
  { id: 'm6.s4', t: 'Перевірка', C: Step4 },
  { id: 'm6.s5', t: 'Звернення', C: Step5 },
];

export default function M6Final() {
  const { state, update, setAnswer } = useApp();
  const stepRaw = state.answers['m6.step'];
  const step = typeof stepRaw === 'number' ? stepRaw : 0;
  const setStep = (n: number) => {
    setAnswer('m6.step', n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const started = state.answers['m6.started'] === true;
  const allDone = STEPS.every((s) => state.results[s.id]);
  const sum = STEPS.reduce((a, s) => a + (state.results[s.id]?.score ?? 0), 0);
  const Cur = STEPS[step].C;

  const start = () => {
    update((s) => ({
      ...s,
      answers: { ...s.answers, 'm6.started': true },
      timer: s.timer.endAt ? s.timer : { label: 'Фінальне випробування', duration: 900, endAt: Date.now() + 900_000, remaining: 900 },
    }));
  };

  return (
    <div>
      <ModuleHeader index={6} title="15 хвилин до рішення" codename="FINAL" minutes={15} max={20} />
      <Panel title="Комплексна ситуація" icon={<Siren className="h-4 w-4 text-alert" />} tone="alert" className="mb-6">
        <p className="text-lg leading-relaxed text-white">
          «У громадському центрі сталася аварія. Потрібно забезпечити інформаційну координацію між відповідальними працівниками та
          відвідувачами. Основний цифровий канал працює нестабільно».
        </p>
        {!started && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn onClick={start}>
              <Play className="h-4 w-4" /> Почати випробування
            </Btn>
            <span className="text-xs text-slate-400">Запуститься таймер на 15 хв (якщо викладач не запустив свій). Бали за швидкість не нараховуються.</span>
          </div>
        )}
      </Panel>

      {started && (
        <>
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i)}
                className={cx(
                  'flex min-w-[96px] flex-1 flex-col items-center rounded-lg border px-2 py-2 text-xs transition',
                  i === step ? 'border-signal bg-signal/10 text-signal' : state.results[s.id] ? 'border-signal/40 text-slate-200' : 'border-ink-600 text-slate-400',
                )}
              >
                <span className="font-mono">{state.results[s.id] ? '✓' : i + 1}</span>
                <span className="font-semibold">{s.t}</span>
              </button>
            ))}
          </div>
          <Cur key={STEPS[step].id} />
          <div className="mt-4 flex justify-between">
            <Btn variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4" /> Назад
            </Btn>
            {step < STEPS.length - 1 && (
              <Btn variant={state.results[STEPS[step].id] ? 'primary' : 'ghost'} onClick={() => setStep(step + 1)}>
                Наступний крок <ChevronRight className="h-4 w-4" />
              </Btn>
            )}
          </div>
          {allDone && (
            <Panel title="Результат фінального випробування" icon={<Flag className="h-4 w-4 text-signal" />} tone="signal" className="mt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-4xl font-black text-white">
                  {sum}
                  <span className="text-xl text-slate-500"> / 20</span>
                </div>
                <Tag tone={sum >= 16 ? 'good' : sum >= 10 ? 'warn' : 'bad'}>{sum >= 16 ? 'План готовий до дії' : sum >= 10 ? 'План потребує доопрацювання' : 'План має критичні прогалини'}</Tag>
              </div>
              <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                {STEPS.map((s) => (
                  <li key={s.id} className="flex justify-between border-b border-ink-700 py-1">
                    <span className="text-slate-300">{s.t}</span>
                    <span className="font-mono text-white">{state.results[s.id]?.score ?? 0} / 4</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
      <NextModule to="m7" />
    </div>
  );
}
