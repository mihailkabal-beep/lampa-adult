import { useState } from 'react';
import { ArrowRight, BookOpen, Eye, Hand, Megaphone, MessageCircle, Monitor, Radio, RefreshCw, Shield, ShieldCheck, Smartphone, UserCheck, Users } from 'lucide-react';
import { useTask } from '../lib/store';
import { Choice, Explain, ModuleHeader, NextModule, OrderList, Panel, Select, TaskShell, choiceState, cx, shuffle } from '../components/ui';

type Quiz = { id: string; q: string; options: { id: string; t: string }[]; correct: string; why: string };

function QuizTask({ id, code, title, items }: { id: string; code: string; title: string; items: Quiz[] }) {
  const t = useTask<Record<string, string>>(id, {});
  const done = items.every((q) => t.answer[q.id]);
  return (
    <TaskShell
      id={id}
      code={code}
      title={title}
      canSubmit={done}
      submitHint="Дайте відповідь на всі запитання."
      onSubmit={() => {
        const decisions = items.map((q) => ({ label: q.q, ok: t.answer[q.id] === q.correct }));
        const n = decisions.filter((d) => d.ok).length;
        const max = id === 'm3.a' ? 3 : 2;
        t.submit({ score: (n / items.length) * max, decisions, feedback: `Правильних відповідей: ${n} з ${items.length}.` });
      }}
    >
      {items.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-semibold text-white">
            {i + 1}. {q.q}
          </p>
          <div className="grid gap-2">
            {q.options.map((o) => (
              <Choice
                key={o.id}
                selected={t.answer[q.id] === o.id}
                disabled={t.locked}
                state={choiceState(o.id, t.answer[q.id] ? [t.answer[q.id]] : [], [q.correct], t.reveal)}
                onClick={() => t.set({ ...t.answer, [q.id]: o.id })}
              >
                {o.t}
              </Choice>
            ))}
          </div>
          {t.reveal && <Explain tone={t.answer[q.id] === q.correct ? 'good' : 'bad'}>{q.why}</Explain>}
        </div>
      ))}
    </TaskShell>
  );
}

/* ---------------- Розділ А ---------------- */

const LOOP = [
  { id: 'assess', t: 'Оцінити', d: 'Що відбувається? Які факти я бачу сам, а що — чутки? Що змінилося?', icon: Eye },
  { id: 'safe', t: 'Убезпечити', d: 'Чи в безпеці я та люди поруч? Не наражаю себе на ризик заради «новини».', icon: Shield },
  { id: 'role', t: 'Діяти в ролі', d: 'Виконую свою роль у команді й не підміняю інших без домовленості.', icon: UserCheck },
  { id: 'report', t: 'Повідомити', d: 'Коротко, за шаблоном: хто, що, де, коли. Тільки по своєму каналу.', icon: MessageCircle },
  { id: 'verify', t: 'Перевірити', d: 'Чи отримали? Чи зрозуміли так само? Чи змінилась ситуація? → нове оцінювання.', icon: RefreshCw },
];

function SectionA() {
  const [active, setActive] = useState('assess');
  const cur = LOOP.find((l) => l.id === active)!;
  return (
    <Panel title="А · Індивідуальна тактична дисципліна" icon={<Shield className="h-4 w-4 text-signal" />}>
      <p className="mb-4 text-sm text-slate-300">
        Ефективність малої групи починається з кожного учасника. Дисципліна — це не про покору, а про передбачуваність: інші мають
        розраховувати, що ви оціните ситуацію, подбаєте про безпеку, виконаєте свою роль і повідомите вчасно. Натисніть на етапи циклу.
      </p>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {LOOP.map((l, i) => {
          const Icon = l.icon;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setActive(l.id)}
              className={cx(
                'relative flex flex-col items-center gap-1.5 rounded-lg border px-1 py-3 text-center transition',
                active === l.id ? 'border-signal bg-signal/10 text-signal' : 'border-ink-600 text-slate-300 hover:border-ink-500',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold leading-tight sm:text-xs">{l.t}</span>
              <span className="font-mono text-[10px] text-slate-500">{i + 1}</span>
            </button>
          );
        })}
      </div>
      <div key={cur.id} className="mt-3 animate-rise rounded-lg border border-signal/40 bg-ink-900/70 p-4 text-sm text-slate-200">
        <b className="text-signal">{cur.t}.</b> {cur.d}
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {[
          ['Особиста безпека', 'Спершу безпека — потім інформація. Не йдіть «подивитися», якщо це небезпечно.'],
          ['Відповідальність', 'Ви відповідаєте за те, що передаєте далі, навіть якщо «просто переслали».'],
          ['Дотримання ролей', 'Одна людина — одна зона відповідальності. Дублювання = хаос, прогалина = втрата.'],
          ['Дисципліна комунікації', 'Коротко, по суті, без емоцій і припущень. Не засмічувати канал.'],
        ].map(([a, b]) => (
          <div key={a} className="rounded-lg border border-ink-600 bg-ink-900/50 p-3">
            <div className="font-semibold text-white">{a}</div>
            <div className="text-slate-400">{b}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const QUIZ_A: Quiz[] = [
  {
    id: 'q1',
    q: 'Ви почули від знайомого, що в сусідньому крилі «щось горить». Ваша перша дія?',
    options: [
      { id: 'a', t: 'Одразу написати в загальний чат «Пожежа в крилі Б!»' },
      { id: 'b', t: 'Оцінити: що я бачу/знаю сам, і повідомити координатору як неперевірену інформацію з джерелом' },
      { id: 'c', t: 'Піти в крило Б і подивитися самому' },
    ],
    correct: 'b',
    why: 'Спершу оцінка й безпека. Чутку передаємо лише відповідальній особі з позначкою «неперевірено» і джерелом.',
  },
  {
    id: 'q2',
    q: 'Ви — реєстратор, а оператор зв’язку не встигає. Як правильно?',
    options: [
      { id: 'a', t: 'Мовчки почати відповідати замість оператора' },
      { id: 'b', t: 'Запропонувати координатору допомогу й дочекатися перерозподілу ролей' },
      { id: 'c', t: 'Нічого не робити, бо це не моя роль' },
    ],
    correct: 'b',
    why: 'Ролі змінюються явно, через координатора. Мовчазна підміна створює дублювання і плутанину.',
  },
  {
    id: 'q3',
    q: 'Що з переліку — порушення дисципліни комунікації?',
    options: [
      { id: 'a', t: 'Коротке повідомлення за шаблоном' },
      { id: 'b', t: 'Підтвердження отримання' },
      { id: 'c', t: 'П’ять голосових по 2 хвилини з емоціями й припущеннями' },
    ],
    correct: 'c',
    why: 'Довгі емоційні повідомлення займають канал, їх важко перевірити й зафіксувати.',
  },
];

/* ---------------- Розділ Б ---------------- */

const CHANNELS = [
  { id: 'voice', t: 'Голосове (дзвінок, наживо)', icon: Megaphone, speed: 5, rel: 3, trace: 1, note: 'Швидко, але без сліду; легко недочути.' },
  { id: 'text', t: 'Текстове (SMS, месенджер)', icon: Smartphone, speed: 4, rel: 4, trace: 5, note: 'Залишає запис; SMS проходить навіть при слабкому сигналі.' },
  { id: 'visual', t: 'Візуальне (табличка, колір, жест)', icon: Hand, speed: 4, rel: 3, trace: 2, note: 'Без техніки; працює в шумі; лише в зоні видимості.' },
  { id: 'digital', t: 'Цифрове (чат групи, e-mail, хмара)', icon: Monitor, speed: 4, rel: 2, trace: 5, note: 'Масштабується, але залежить від інтернету й живлення.' },
  { id: 'backup', t: 'Резервне (рація PMR, посильний, точка збору)', icon: Radio, speed: 3, rel: 4, trace: 2, note: 'Працює, коли основне впало. Має бути узгоджене заздалегідь.' },
];

function Dots({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cx('h-1.5 w-3 rounded-sm', i <= n ? 'bg-signal' : 'bg-ink-600')} />
      ))}
    </span>
  );
}

function SectionB() {
  return (
    <Panel title="Б · Сигнали та канали зв’язку" icon={<Radio className="h-4 w-4 text-signal" />}>
      <p className="mb-4 text-sm text-slate-300">
        Немає ідеального каналу — є канал, придатний для конкретної ситуації. Команда заздалегідь визначає основний і резервний
        канали та умовні сигнали, які всі розуміють однаково. Порівняйте канали:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="pb-2">Канал</th>
              <th className="pb-2">Швидкість</th>
              <th className="pb-2">Стійкість до збоїв</th>
              <th className="pb-2">Слід / журнал</th>
            </tr>
          </thead>
          <tbody>
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              return (
                <tr key={c.id} className="border-t border-ink-600/60 align-top">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <Icon className="h-4 w-4 text-signal" /> {c.t}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">{c.note}</div>
                  </td>
                  <td className="py-2.5"><Dots n={c.speed} /></td>
                  <td className="py-2.5"><Dots n={c.rel} /></td>
                  <td className="py-2.5"><Dots n={c.trace} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const MATCH = [
  { id: 's1', t: 'Інтернет зник, мобільний сигнал слабкий; треба передати точний час збору 5 людям.', correct: 'text', why: 'SMS часто проходить при слабкому сигналі й лишає точний запис часу.' },
  { id: 's2', t: 'У холі дуже гучно, потрібно показати відвідувачам, куди йти.', correct: 'visual', why: 'Вказівники, таблички, жест — працюють у шумі без техніки.' },
  { id: 's3', t: 'Мобільний зв’язок і інтернет повністю відсутні; команда на різних поверхах.', correct: 'backup', why: 'Заздалегідь узгоджений резерв: рації PMR, посильний, точка збору.' },
];

function MatchTask() {
  const t = useTask<Record<string, string>>('m3.b', {});
  const done = MATCH.every((m) => t.answer[m.id]);
  return (
    <TaskShell
      id="m3.b"
      code="3.Б"
      title="Підбери канал до ситуації"
      intro="Для кожної ситуації оберіть найдоцільніший канал."
      canSubmit={done}
      submitHint="Оберіть канал для кожної ситуації."
      onSubmit={() => {
        const decisions = MATCH.map((m) => ({ label: m.t, ok: t.answer[m.id] === m.correct }));
        const n = decisions.filter((d) => d.ok).length;
        t.submit({ score: n, decisions, feedback: `Влучних рішень: ${n} з 3.` });
      }}
    >
      {MATCH.map((m) => {
        const ok = t.answer[m.id] === m.correct;
        return (
          <div key={m.id} className={cx('rounded-lg border p-3', t.reveal ? (ok ? 'border-signal/60' : 'border-alert/60') : 'border-ink-600')}>
            <p className="mb-2 text-sm text-white">{m.t}</p>
            <Select
              value={t.answer[m.id] ?? ''}
              disabled={t.locked}
              onChange={(v) => t.set({ ...t.answer, [m.id]: v })}
              options={CHANNELS.map((c) => ({ value: c.id, label: c.t }))}
            />
            {t.reveal && (
              <p className="mt-2 text-xs text-slate-400">
                <b className="text-signal">Найкраще: {CHANNELS.find((c) => c.id === m.correct)!.t}.</b> {m.why}
              </p>
            )}
          </div>
        );
      })}
    </TaskShell>
  );
}

/* ---------------- Розділ В ---------------- */

const FLOW = [
  { id: 'sender', t: 'Відправник', d: 'Хто передає? Відправник відповідає за точність і за позначку статусу (перевірено / ні).', icon: Megaphone },
  { id: 'check', t: 'Перевірка', d: 'Перш ніж передати: звідки інформація? чи є друге незалежне джерело? чи актуальна?', icon: ShieldCheck },
  { id: 'channel', t: 'Канал', d: 'Обраний за правилами протоколу. Якщо основний недоступний — резервний.', icon: Radio },
  { id: 'receiver', t: 'Отримувач', d: 'Хто отримує? Конкретна роль, а не «всі». Отримувач перевіряє, чи зрозумів однаково.', icon: Users },
  { id: 'ack', t: 'Підтвердження', d: '«Прийнято» — повідомлення дійшло. Без підтвердження статус «надіслано, не підтверджено».', icon: UserCheck },
  { id: 'feedback', t: 'Зворотний зв’язок', d: 'Що зроблено, що змінилося, які питання. Замикає цикл і запускає нову перевірку.', icon: RefreshCw },
];

function SectionC() {
  const [active, setActive] = useState('sender');
  const cur = FLOW.find((f) => f.id === active)!;
  return (
    <Panel title="В · Інформаційна взаємодія" icon={<BookOpen className="h-4 w-4 text-signal" />}>
      <p className="mb-4 text-sm text-slate-300">
        Інформація в команді — як пакет у мережі: має відправника, маршрут, отримувача і підтвердження доставки (ACK). Без ACK
        відправник не знає, чи дійшло. Натисніть на вузли схеми.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {FLOW.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActive(f.id)}
                className={cx(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition',
                  active === f.id ? 'border-signal bg-signal/10 text-signal' : 'border-ink-600 text-slate-300 hover:border-ink-500',
                )}
              >
                <Icon className="h-4 w-4" /> {f.t}
              </button>
              {i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-slate-600" />}
            </div>
          );
        })}
      </div>
      <div key={cur.id} className="mt-3 animate-rise rounded-lg border border-signal/40 bg-ink-900/70 p-4 text-sm text-slate-200">
        <b className="text-signal">{cur.t}.</b> {cur.d}
      </div>
      <div className="mt-4 rounded-lg border border-ink-600 bg-ink-900/50 p-3 text-sm text-slate-300">
        <b className="text-white">Захист інформації:</b> не публікуйте в загальних чатах персональні дані, номери телефонів, схеми
        будівлі та розташування людей. Передавайте лише тим, кому це потрібно для виконання ролі. Перевіряйте, хто насправді пише
        від імені «адміністрації».
      </div>
    </Panel>
  );
}

const ORDER_OK = FLOW.map((f) => f.id);

function ChainTask() {
  const initial = shuffle(FLOW.map((f) => ({ id: f.id, text: f.t })), 7);
  const t = useTask<{ id: string; text: string }[]>('m3.c1', initial);
  return (
    <TaskShell
      id="m3.c1"
      code="3.В1"
      title="Збери ланцюг передачі"
      intro="Розташуйте етапи інформаційної взаємодії в правильному порядку (кнопками ↑ ↓)."
      canSubmit
      onSubmit={() => {
        const pos = t.answer.filter((x, i) => x.id === ORDER_OK[i]).length;
        t.submit({
          score: pos === 6 ? 2 : pos >= 4 ? 1 : 0,
          decisions: [{ label: 'Порядок етапів передачі інформації', ok: pos === 6 }],
          feedback: `На своєму місці ${pos} з 6 етапів.`,
        });
      }}
    >
      <OrderList items={t.answer} onChange={t.set} disabled={t.locked} correctOrder={t.reveal ? ORDER_OK : undefined} />
    </TaskShell>
  );
}

const QUIZ_C: Quiz[] = [
  {
    id: 'q1',
    q: 'Ви надіслали повідомлення, але відповіді «прийнято» немає. Який статус?',
    options: [
      { id: 'a', t: 'Доставлено й виконується' },
      { id: 'b', t: 'Надіслано, не підтверджено — потрібна повторна перевірка' },
      { id: 'c', t: 'Отримувач проігнорував' },
    ],
    correct: 'b',
    why: 'Відсутність ACK ≠ отримання і ≠ ігнорування. Фіксуємо факт і перевіряємо іншим способом.',
  },
  {
    id: 'q2',
    q: 'Хтось у загальному чаті просить скинути список учасників із номерами телефонів «для адміністрації». Ваші дії?',
    options: [
      { id: 'a', t: 'Надіслати, адже це для адміністрації' },
      { id: 'b', t: 'Перевірити особу запитувача через відомий канал і передати лише необхідне, не в загальний чат' },
      { id: 'c', t: 'Опублікувати в чаті, щоб усі мали' },
    ],
    correct: 'b',
    why: 'Принцип мінімально необхідної інформації та перевірки особи — базовий захист від маніпуляцій і соціальної інженерії.',
  },
];

export default function M3Brief() {
  return (
    <div>
      <ModuleHeader index={3} title="Навчальний брифінг" codename="BRIEF" minutes={15} max={10}>
        Три короткі розділи з інтерактивними схемами. Після кожного — перевірка, що зараховується до підсумку.
      </ModuleHeader>
      <div className="space-y-6">
        <SectionA />
        <QuizTask id="m3.a" code="3.А" title="Перевірка: тактична дисципліна" items={QUIZ_A} />
        <SectionB />
        <MatchTask />
        <SectionC />
        <ChainTask />
        <QuizTask id="m3.c2" code="3.В2" title="Перевірка: інформаційна взаємодія" items={QUIZ_C} />
      </div>
      <NextModule to="m4" />
    </div>
  );
}
