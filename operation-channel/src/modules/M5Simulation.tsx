import { useState } from 'react';
import { AlertOctagon, Check, CheckCheck, ChevronRight, Lock, MessageSquareWarning, Radio, Siren, SplitSquareHorizontal, UserX } from 'lucide-react';
import { useApp, useTask } from '../lib/store';
import { TASKS } from '../lib/config';
import { ChoiceTask, type Opt } from '../components/ChoiceTask';
import { Btn, Explain, Meter, ModuleHeader, NextModule, OrderList, Panel, Select, TaskShell, TextArea, cx, shuffle } from '../components/ui';

const SIT_TASKS = {
  A: ['m5.a1', 'm5.a2', 'm5.a3'],
  B: ['m5.b1', 'm5.b2', 'm5.b3', 'm5.b4'],
  C: ['m5.c1', 'm5.c2', 'm5.c3', 'm5.c4'],
} as const;
type Sit = keyof typeof SIT_TASKS;
const UA: Record<Sit, string> = { A: 'А', B: 'Б', C: 'В' };

function useSimMeters() {
  const { state } = useApp();
  let trust = 55;
  let panic = 45;
  let clarity = 35;
  for (const ids of Object.values(SIT_TASKS))
    for (const id of ids) {
      const r = state.results[id];
      if (!r) continue;
      const k = r.score / r.max - 0.5;
      trust += k * 14;
      panic -= k * 16;
      clarity += 5 + k * 6;
    }
  return { trust, panic, clarity };
}

function ChatBubble({ from, time, text, meta, tone = 'default', status }: { from: string; time: string; text: string; meta?: string; tone?: 'default' | 'warn' | 'mine'; status?: 'sent' | 'ack' }) {
  return (
    <div className={cx('max-w-[95%] rounded-xl border px-3 py-2 sm:max-w-[80%]', tone === 'mine' ? 'ml-auto border-info/40 bg-info/10' : tone === 'warn' ? 'border-alert/50 bg-alert/10' : 'border-ink-600 bg-ink-800')}>
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] text-slate-400">
        <span className="font-semibold text-slate-200">{from}</span>
        <span className="flex items-center gap-1">
          {time}
          {status === 'sent' && <Check className="h-3.5 w-3.5 text-slate-400" />}
          {status === 'ack' && <CheckCheck className="h-3.5 w-3.5 text-signal" />}
        </span>
      </div>
      <div className="mt-1 text-sm text-white">{text}</div>
      {meta && <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">{meta}</div>}
    </div>
  );
}

function Justify({ id, code, title, prompt, keywords }: { id: string; code: string; title: string; prompt: string; keywords: RegExp }) {
  const t = useTask<string>(id, '');
  const max = TASKS[id].max;
  return (
    <TaskShell
      id={id}
      code={code}
      title={title}
      intro={prompt}
      canSubmit={t.answer.trim().length >= 25}
      submitHint="Напишіть обґрунтування (від 25 символів)."
      onSubmit={() => {
        const long = t.answer.trim().length >= 60;
        const kw = keywords.test(t.answer);
        const score = ((long ? 0.5 : 0) + (kw ? 0.5 : 0)) * max;
        t.submit({
          score,
          decisions: [{ label: `${title}: аргументація з ключовими поняттями`, ok: kw }],
          feedback: kw
            ? long
              ? 'Обґрунтування змістовне й спирається на ключові принципи.'
              : 'Ключова думка є, але варто розгорнути: що саме зробите й чому.'
            : 'Бракує аргументу про перевірку джерела / підтвердження / наслідки поширення. Викладач може переглянути оцінку.',
        });
      }}
    >
      <TextArea value={t.answer} onChange={t.set} disabled={t.locked} rows={4} max={600} placeholder="Чому саме так? Які ризики ви врахували?" />
    </TaskShell>
  );
}

/* ---------- Ситуація А ---------- */
const A1: Opt[] = [
  { id: 'spread', t: 'Негайно поширити повідомлення в усі чати', effect: 'За 3 хвилини повідомлення переслали понад 40 людей. У холі утворилося скупчення, люди телефонують родичам. Згодом з’ясувалося, що зачинено лише один вихід. Довіра до вашого каналу впала.' },
  { id: 'source', t: 'Перевірити джерело: хто автор, звідки переслано, коли', effect: 'Ви з’ясували: повідомлення переслане з публічного чату, автора й часу немає. Це сигнал для обережності.' },
  { id: 'ask', t: 'Уточнити інформацію у відповідальних осіб (адміністрація, охорона)', effect: 'Охорона повідомила: закрито лише вихід А через несправні двері; вихід Б працює.' },
  { id: 'mark', t: 'Позначити інформацію як неперевірену й попередити команду не поширювати', effect: 'Команда не розносить чутку далі; канал зберігає довіру.' },
  { id: 'delete', t: 'Видалити повідомлення й нікому нічого не казати', effect: 'Якби повідомлення було правдивим, команда залишилася б без важливих даних. Ігнорування — теж ризик.' },
];

function SituationA() {
  return (
    <div className="space-y-5">
      <Panel title="Вхідне повідомлення" icon={<MessageSquareWarning className="h-4 w-4 text-alert" />} tone="alert">
        <div className="space-y-2">
          <ChatBubble from="Переслано · невідомий автор" time="12:14" text="Увага! Вихід із будівлі закрито. Усі повинні залишатися на місці." meta="переслано 14 разів · джерело не вказано" tone="warn" />
          <p className="pt-2 text-sm text-slate-300">Повідомлення з’явилося в робочому чаті вашої команди. Відвідувачі вже питають, що відбувається.</p>
        </div>
      </Panel>
      <ChoiceTask
        id="m5.a1"
        code="5.А1"
        title="Дії з неперевіреним повідомленням"
        intro="Оберіть усі дії, які ви вважаєте доречними. Наслідки кожного рішення ви побачите після надсилання."
        multi
        options={A1}
        correct={['source', 'ask', 'mark']}
        why="Неперевірене повідомлення про безпеку — найнебезпечніший тип чутки: воно змушує людей діяти. Правильна послідовність: перевірити джерело → уточнити у відповідальних → до підтвердження позначити як неперевірене. Негайне поширення і мовчазне видалення — дві крайнощі з реальними ризиками."
      />
      <ChoiceTask
        id="m5.a2"
        code="5.А2"
        title="Статус повідомлення в журналі"
        intro="Який статус реєстратор має зафіксувати для цього повідомлення до завершення перевірки?"
        options={[
          { id: 'ok', t: 'ПІДТВЕРДЖЕНО' },
          { id: 'chk', t: 'НЕ ПЕРЕВІРЕНО · ПЕРЕВІРЯЄТЬСЯ (джерело невідоме, 12:14)' },
          { id: 'fake', t: 'ХИБНЕ', partial: 0.25 },
          { id: 'none', t: 'Без статусу — і так зрозуміло' },
        ]}
        correct={['chk']}
        cols={2}
        why="Статус фіксує, що ми знаємо зараз, а не що припускаємо. «Хибне» — так само поспішний висновок, як і «підтверджено»: перевірка ще триває."
      />
      <Justify
        id="m5.a3"
        code="5.А3"
        title="Обґрунтування рішення"
        prompt="Поясніть 2–3 реченнями, чому ваша команда діє саме так. Що могло статися при іншому рішенні?"
        keywords={/джерел|перевір|уточн|підтвер|паніч|паніка|неперевір|відповідальн|охорон|адміністр/i}
      />
    </div>
  );
}

/* ---------- Ситуація Б ---------- */
const LOG_B = [
  { id: 'l1', time: '12:01', from: 'Ви', text: 'Перекличка: всі на місцях?', status: 'ack' as const },
  { id: 'l2', time: '12:04', from: 'Андрій (оператор, 2 поверх)', text: 'На місці. Перевіряю східний вихід.' },
  { id: 'l3', time: '12:06', from: 'Ви', text: 'Збір о 12:20 у холі. Вихід Б відкрито.', status: 'sent' as const },
  { id: 'l4', time: '12:09', from: 'Ви', text: 'Вихід А тимчасово зачинено — інформація перевіряється.', status: 'sent' as const },
  { id: 'l5', time: '12:10', from: 'Сергій', text: 'Хто бачив мій зарядний кабель?' },
  { id: 'l6', time: '12:11', from: 'Ви', text: 'Марія тимчасово виконує роль оператора, доки Андрій не на зв’язку.', status: 'sent' as const },
];

function RetransmitTask() {
  const t = useTask<string[]>('m5.b4', []);
  const correct = ['l3', 'l4', 'l6'];
  const toggle = (id: string) => t.set(t.answer.includes(id) ? t.answer.filter((x) => x !== id) : [...t.answer, id]);
  return (
    <TaskShell
      id="m5.b4"
      code="5.Б4"
      title="Що передати повторно"
      intro="Зв’язок з Андрієм відновлено о 12:18. Позначте в журналі повідомлення, які потрібно передати йому повторно."
      canSubmit={t.answer.length > 0}
      submitHint="Позначте хоча б одне повідомлення."
      onSubmit={() => {
        let hits = 0;
        let wrong = 0;
        for (const l of LOG_B) {
          if (t.answer.includes(l.id) && correct.includes(l.id)) hits++;
          if (t.answer.includes(l.id) && !correct.includes(l.id)) wrong++;
        }
        t.submit({
          score: Math.max(0, hits - wrong),
          decisions: LOG_B.map((l) => ({ label: `Повтор «${l.text}»`, ok: t.answer.includes(l.id) === correct.includes(l.id) })),
          feedback: 'Повторно передаємо все, що надійшло після останнього підтвердженого контакту і стосується його ролі.',
        });
      }}
    >
      <div className="space-y-2">
        {LOG_B.map((l) => {
          const sel = t.answer.includes(l.id);
          const ok = correct.includes(l.id);
          return (
            <button
              key={l.id}
              type="button"
              disabled={t.locked}
              onClick={() => toggle(l.id)}
              className={cx(
                'flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition',
                t.reveal ? (ok ? (sel ? 'border-signal bg-signal/10' : 'border-dashed border-warn') : sel ? 'border-alert bg-alert/10' : 'border-ink-700') : sel ? 'border-info bg-info/10' : 'border-ink-600 hover:border-ink-500',
              )}
            >
              <span className="w-12 shrink-0 font-mono text-xs text-slate-400">{l.time}</span>
              <span className="flex-1">
                <span className="block text-xs text-slate-400">{l.from}</span>
                <span className="text-white">{l.text}</span>
              </span>
              {l.status === 'ack' && <CheckCheck className="h-4 w-4 shrink-0 text-signal" />}
              {l.status === 'sent' && <Check className="h-4 w-4 shrink-0 text-slate-400" />}
            </button>
          );
        })}
      </div>
      {t.reveal && (
        <Explain tone="info" title="Розбір">
          12:06, 12:09 і 12:11 надіслано після останнього контакту й без підтвердження — їх треба повторити. Перекличку 12:01 Андрій уже підтвердив,
          а повідомлення про кабель не стосується операції: повтор лише засмічує канал.
        </Explain>
      )}
    </TaskShell>
  );
}

function SituationB() {
  const { state } = useApp();
  const own = state.protocol.backupChannel.trim();
  const backupOpts: Opt[] = [
    { id: 'wait', t: 'Чекати, поки він сам вийде на зв’язок', effect: 'Минуло 15 хвилин. Андрій так і не дізнався про зміну місця збору.' },
    { id: 'spam', t: 'Писати йому в месенджер ще 10 разів', effect: 'Інтернету немає — повідомлення висять неотриманими, а ви втрачаєте час.' },
    { id: 'sms', t: 'Надіслати SMS і, якщо немає відповіді за 5 хв, відправити посильного на 2 поверх', effect: 'SMS дійшло о 12:17, о 12:18 Андрій підтвердив. Телефон розряджався — він вимкнув інтернет.' },
    { id: 'loud', t: 'Оголосити його ім’я по гучномовцю на весь центр', effect: 'Відвідувачі занепокоїлися: «Що сталося з працівником?» Додаткова тривога без потреби.', partial: 0.25 },
  ];
  if (own) backupOpts.splice(2, 0, { id: 'own', t: `За нашим протоколом: ${own}`, effect: 'Ви діяли за заздалегідь узгодженим резервом — саме для цього він і існує.' });
  return (
    <div className="space-y-5">
      <Panel title="Журнал каналу · 12:13" icon={<UserX className="h-4 w-4 text-warn" />} tone="warn">
        <p className="mb-3 text-sm text-slate-300">
          Оператор зв’язку Андрій (2 поверх) не відповідає вже 7 хвилин. Інтернет у будівлі зник о 12:05, мобільний сигнал слабкий.
        </p>
        <div className="space-y-2">
          {LOG_B.slice(0, 4).map((l) => (
            <ChatBubble key={l.id} from={l.from} time={l.time} text={l.text} tone={l.from === 'Ви' ? 'mine' : 'default'} status={l.status} />
          ))}
        </div>
        <div className="mt-3 flex gap-4 font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> надіслано</span>
          <span className="flex items-center gap-1"><CheckCheck className="h-3.5 w-3.5 text-signal" /> підтверджено</span>
        </div>
      </Panel>
      <ChoiceTask
        id="m5.b1"
        code="5.Б1"
        title="Можливі причини мовчання"
        intro="Які причини ви розглядаєте як можливі на цьому етапі? Оберіть усі доречні."
        multi
        cols={2}
        options={[
          { id: 'bat', t: 'Розрядився телефон' },
          { id: 'sig', t: 'Немає сигналу в його зоні будівлі' },
          { id: 'busy', t: 'Зайнятий: допомагає людям, руки зайняті' },
          { id: 'ignore', t: 'Навмисно ігнорує команду' },
          { id: 'alarm', t: 'З ним точно сталося лихо — оголосити тривогу всім' },
        ]}
        correct={['bat', 'sig', 'busy']}
        why="Мовчання ≠ подія. Спершу перевіряємо технічні й ситуативні причини. Звинувачення чи паніка без фактів руйнують довіру в команді. Але й затягувати не можна — тому протокол задає час очікування й резервний канал."
      />
      <ChoiceTask id="m5.b2" code="5.Б2" title="Резервний канал" intro="Інтернету немає, мобільний сигнал слабкий. Як відновити зв’язок?" options={backupOpts} correct={own ? ['sms', 'own'] : ['sms']} why="Резервний канал працює, коли він узгоджений заздалегідь і має чітку умову переходу (наприклад, «немає підтвердження 5 хв → SMS → посильний»). SMS часто проходить там, де месенджери вже не працюють." />
      <ChoiceTask
        id="m5.b3"
        code="5.Б3"
        title="Статус повідомлення 12:06"
        intro="Як реєстратор має позначити ваше повідомлення 12:06 «Збір о 12:20 у холі» щодо Андрія?"
        cols={2}
        options={[
          { id: 'read', t: 'Доставлено й прочитано' },
          { id: 'sent', t: 'Надіслано, НЕ підтверджено' },
          { id: 'done', t: 'Виконано' },
          { id: 'lost', t: 'Втрачено — більше не надсилати', partial: 0.25 },
        ]}
        correct={['sent']}
        why="Одна позначка = лише надіслано. Без явного «ПРИЙНЯТО» ми не можемо вважати, що Андрій знає про місце збору. Такий статус автоматично ставить повідомлення в чергу на повтор."
      />
      <RetransmitTask />
    </div>
  );
}

/* ---------- Ситуація В ---------- */
const MSG_O = { who: 'Оля (на вході)', text: 'Евакуація через вихід А, автобуси о 13:00.', meta: 'Переслано з чату «Новини району» · автор невідомий · 12:15' };
const MSG_D = { who: 'Дмитро (у холі)', text: 'Вихід А зачинено на ремонт, використовуйте вихід Б. Збір у холі о 12:30.', meta: 'Особисто від адміністраторки центру І. Петрівни · 12:22' };
const SRC = [
  { value: 'official', label: 'Відповідальна особа, напряму' },
  { value: 'public', label: 'Публічний чат, автор невідомий' },
  { value: 'self', label: 'Власне спостереження учасника' },
  { value: 'rumor', label: 'Чутка від знайомого' },
];

function SourcesTask() {
  const t = useTask<{ o: string; d: string }>('m5.c1', { o: '', d: '' });
  return (
    <TaskShell
      id="m5.c1"
      code="5.В1"
      title="Визначте джерела"
      canSubmit={!!t.answer.o && !!t.answer.d}
      submitHint="Визначте джерело для обох повідомлень."
      onSubmit={() =>
        t.submit({
          score: (t.answer.o === 'public' ? 1 : 0) + (t.answer.d === 'official' ? 1 : 0),
          decisions: [
            { label: 'Джерело повідомлення Олі', ok: t.answer.o === 'public' },
            { label: 'Джерело повідомлення Дмитра', ok: t.answer.d === 'official' },
          ],
        })
      }
    >
      {(['o', 'd'] as const).map((k) => {
        const m = k === 'o' ? MSG_O : MSG_D;
        const ok = k === 'o' ? 'public' : 'official';
        return (
          <div key={k} className={cx('rounded-lg border p-3', t.reveal ? (t.answer[k] === ok ? 'border-signal/60' : 'border-alert/60') : 'border-ink-600')}>
            <div className="mb-2 text-sm text-white">
              <b>{m.who}:</b> «{m.text}»
            </div>
            <Select value={t.answer[k]} disabled={t.locked} onChange={(v) => t.set({ ...t.answer, [k]: v })} options={SRC} />
            {t.reveal && <p className="mt-1 text-xs text-slate-400">Правильно: {SRC.find((s) => s.value === ok)!.label}. Підказка була в метаданих: «{m.meta}».</p>}
          </div>
        );
      })}
    </TaskShell>
  );
}

const CRED = [
  { value: 'high', label: 'Висока' },
  { value: 'mid', label: 'Середня' },
  { value: 'low', label: 'Низька' },
];

function CredTask() {
  const t = useTask<{ o: string; d: string }>('m5.c3', { o: '', d: '' });
  return (
    <TaskShell
      id="m5.c3"
      code="5.В3"
      title="Рівень достовірності"
      intro="Оцініть достовірність кожного повідомлення з урахуванням джерела, часу та конкретики."
      canSubmit={!!t.answer.o && !!t.answer.d}
      submitHint="Оцініть обидва повідомлення."
      onSubmit={() => {
        const so = t.answer.o === 'low' ? 1 : t.answer.o === 'mid' ? 0.5 : 0;
        const sd = t.answer.d === 'high' ? 1 : t.answer.d === 'mid' ? 0.5 : 0;
        t.submit({
          score: so + sd,
          decisions: [
            { label: 'Достовірність повідомлення Олі — низька', ok: t.answer.o === 'low' },
            { label: 'Достовірність повідомлення Дмитра — висока', ok: t.answer.d === 'high' },
          ],
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(['o', 'd'] as const).map((k) => (
          <div key={k} className="rounded-lg border border-ink-600 p-3">
            <div className="mb-2 text-sm font-semibold text-white">{k === 'o' ? 'Повідомлення Олі' : 'Повідомлення Дмитра'}</div>
            <div className="flex gap-2">
              {CRED.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  disabled={t.locked}
                  onClick={() => t.set({ ...t.answer, [k]: c.value })}
                  className={cx(
                    'flex-1 rounded-md border px-2 py-2 text-xs font-semibold transition',
                    t.answer[k] === c.value ? (c.value === 'high' ? 'border-signal bg-signal/15 text-signal' : c.value === 'mid' ? 'border-warn bg-warn/15 text-warn' : 'border-alert bg-alert/15 text-alert') : 'border-ink-500 text-slate-300',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {t.reveal && (
        <Explain tone="info" title="Розбір">
          Повідомлення Олі: анонімне, переслане, раніше за часом, з деталлю (автобуси), яку ніхто не підтвердив — достовірність низька.
          Повідомлення Дмитра: від відповідальної особи напряму, пізніше, конкретне — висока, але й воно потребує підтвердження отримання всіма.
        </Explain>
      )}
    </TaskShell>
  );
}

const ORDER_C = [
  { id: 'fix', text: 'Зафіксувати обидва повідомлення з джерелами й часом' },
  { id: 'hold', text: 'Позначити обидва «перевіряється», тимчасово не поширювати' },
  { id: 'ask', text: 'Уточнити в першоджерела (адміністраторка) через надійний канал' },
  { id: 'one', text: 'Сформувати одне узгоджене повідомлення' },
  { id: 'send', text: 'Передати всім, спростувати хибне, попросити підтвердити отримання' },
];

function OrderCTask() {
  const t = useTask<{ id: string; text: string }[]>('m5.c4', shuffle(ORDER_C, 11));
  const ok = ORDER_C.map((x) => x.id);
  return (
    <TaskShell
      id="m5.c4"
      code="5.В4"
      title="Порядок уточнення"
      intro="Розташуйте кроки команди в логічному порядку."
      canSubmit
      onSubmit={() => {
        const pos = t.answer.filter((x, i) => x.id === ok[i]).length;
        t.submit({ score: pos === 5 ? 2 : pos >= 3 ? 1 : 0, decisions: [{ label: 'Порядок уточнення суперечливої інформації', ok: pos === 5 }], feedback: `На своєму місці ${pos} з 5 кроків.` });
      }}
    >
      <OrderList items={t.answer} onChange={t.set} disabled={t.locked} correctOrder={t.reveal ? ok : undefined} />
    </TaskShell>
  );
}

function SituationC() {
  return (
    <div className="space-y-5">
      <Panel title="Два повідомлення · 12:24" icon={<SplitSquareHorizontal className="h-4 w-4 text-warn" />} tone="warn">
        <p className="mb-3 text-sm text-slate-300">Двоє учасників команди одночасно передали вам суперечливі дані. Відвідувачі вже рушили до різних виходів.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {[MSG_O, MSG_D].map((m) => (
            <div key={m.who} className="rounded-lg border border-ink-600 bg-ink-900/60 p-3">
              <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{m.who}</div>
              <div className="mt-1 text-white">«{m.text}»</div>
              <div className="mt-2 font-mono text-[11px] text-slate-500">{m.meta}</div>
            </div>
          ))}
        </div>
      </Panel>
      <SourcesTask />
      <ChoiceTask
        id="m5.c2"
        code="5.В2"
        title="Порівняння: що суперечить"
        intro="Які дані в повідомленнях прямо суперечать одне одному?"
        multi
        cols={2}
        options={[
          { id: 'exit', t: 'Номер виходу (А чи Б)' },
          { id: 'time', t: 'Час (13:00 чи 12:30)' },
          { id: 'bus', t: 'Автобуси (в одному є, в іншому немає)' },
          { id: 'lang', t: 'Стиль і довжина повідомлень' },
        ]}
        correct={['exit', 'time']}
        why="Суперечність — коли дані неможливо поєднати (вихід А vs Б, 13:00 vs 12:30). Відсутність згадки про автобуси в другому повідомленні — не суперечність, а прогалина: її теж треба уточнити, але це інший тип проблеми."
      />
      <CredTask />
      <OrderCTask />
    </div>
  );
}

const SITS: { id: Sit; title: string; icon: typeof Siren; render: () => JSX.Element }[] = [
  { id: 'A', title: 'Неперевірене повідомлення', icon: AlertOctagon, render: () => <SituationA /> },
  { id: 'B', title: 'Втрата зв’язку', icon: Radio, render: () => <SituationB /> },
  { id: 'C', title: 'Інформаційна плутанина', icon: SplitSquareHorizontal, render: () => <SituationC /> },
];

export default function M5Simulation() {
  const { state, patch } = useApp();
  const meters = useSimMeters();
  const [active, setActive] = useState<Sit>('A');
  const done = (s: Sit) => SIT_TASKS[s].every((id) => state.results[id]);
  const isTeacher = state.role === 'teacher' || state.demo;
  const available = (i: number) => {
    if (state.pacing === 'teacher') return i < state.simRevealed;
    return i === 0 || done(SITS[i - 1].id) || isTeacher;
  };
  const curIdx = SITS.findIndex((s) => s.id === active);
  const visibleIdx = available(curIdx) ? curIdx : 0;
  const cur = SITS[visibleIdx];

  return (
    <div>
      <ModuleHeader index={5} title="Канал під загрозою" codename="STRESS" minutes={20} max={25}>
        Центральна симуляція. Три ситуації, кожне рішення має наслідки для стану каналу. Бали — за обґрунтованість, не за швидкість.
      </ModuleHeader>

      <div className="mb-5 grid gap-4 rounded-xl border border-ink-600 bg-ink-900/60 p-4 sm:grid-cols-3">
        <Meter label="Довіра до каналу" value={meters.trust} tone="signal" />
        <Meter label="Рівень паніки" value={meters.panic} tone={meters.panic > 50 ? 'alert' : 'warn'} />
        <Meter label="Ясність картини" value={meters.clarity} tone="info" />
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {SITS.map((s, i) => {
          const Icon = s.icon;
          const av = available(i);
          return (
            <button
              key={s.id}
              type="button"
              disabled={!av}
              onClick={() => setActive(s.id)}
              className={cx(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed',
                visibleIdx === i ? 'border-signal bg-signal/10' : 'border-ink-600 bg-ink-900/50 hover:border-ink-500',
                !av && 'opacity-40',
              )}
            >
              {av ? <Icon className={cx('h-5 w-5', done(s.id) ? 'text-signal' : 'text-warn')} /> : <Lock className="h-5 w-5 text-slate-500" />}
              <span>
                <span className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  Ситуація {UA[s.id]} {done(s.id) && '· завершено'}
                </span>
                <span className="font-semibold text-white">{s.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      {state.pacing === 'teacher' && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-info/40 bg-info/5 px-4 py-3 text-sm text-slate-300">
          <span>Темп симуляції контролює викладач. Відкрито ситуацій: {state.simRevealed} з 3.</span>
          {isTeacher && state.simRevealed < 3 && (
            <Btn size="sm" onClick={() => { patch({ simRevealed: state.simRevealed + 1 }); setActive(SITS[state.simRevealed].id); }}>
              Показати наступну ситуацію <ChevronRight className="h-4 w-4" />
            </Btn>
          )}
        </div>
      )}

      <div key={cur.id}>{cur.render()}</div>

      {done(cur.id) && visibleIdx < 2 && (
        <div className="mt-5 flex justify-end">
          {available(visibleIdx + 1) ? (
            <Btn onClick={() => { setActive(SITS[visibleIdx + 1].id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              До ситуації {UA[SITS[visibleIdx + 1].id]} <ChevronRight className="h-4 w-4" />
            </Btn>
          ) : (
            <span className="text-sm text-slate-400">Очікуйте: наступну ситуацію відкриє викладач.</span>
          )}
        </div>
      )}
      <NextModule to="m6" />
    </div>
  );
}
