import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, Power, Radio, Target, UserRound, Users, Wifi, WifiOff, Zap } from 'lucide-react';
import { useApp } from '../lib/store';
import { codeFromUrl, makeId, normCode } from '../lib/sync';
import TeamLobby from '../components/TeamLobby';
import { Btn, Input, ModuleHeader, Panel, Select, Tag, cx } from '../components/ui';

const BOOT_LINES = [
  'Ініціалізація навчальної симуляції…',
  'Перевірка каналів: мобільний зв’язок — НЕСТАБІЛЬНИЙ',
  'Перевірка каналів: Wi‑Fi центру — ВІДСУТНІЙ',
  'Резервний журнал повідомлень — АКТИВНИЙ',
  'Ролі команди — НЕ ПРИЗНАЧЕНО',
  'Протокол зв’язку — ВІДСУТНІЙ',
  'Статус: потрібна команда. Система активована.',
];

export default function M1Intro() {
  const { state, update, go } = useApp();
  const [phase, setPhase] = useState<'cover' | 'boot' | 'brief'>(state.started ? 'brief' : 'cover');
  const [lines, setLines] = useState(state.started ? BOOT_LINES.length : 0);

  useEffect(() => {
    if (phase !== 'boot') return;
    if (lines >= BOOT_LINES.length) {
      const t = setTimeout(() => setPhase('brief'), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLines((n) => n + 1), 380);
    return () => clearTimeout(t);
  }, [phase, lines]);

  const p = state.profile;
  const [code, setCode] = useState(state.session?.code ?? codeFromUrl());
  const setP = (k: keyof typeof p, v: string) => update((s) => ({ ...s, profile: { ...s.profile, [k]: v } }));
  const online = !!normCode(code) && state.role !== 'teacher';
  const ready = p.name.trim().length >= 2 && !!p.group && (online || p.team.trim().length >= 2);
  const inLobby = state.role !== 'teacher' && !!state.session && !state.session.teamId;

  if (phase === 'cover') {
    return (
      <div className="mx-auto max-w-4xl animate-rise py-4 sm:py-10">
        <div className="relative overflow-hidden rounded-2xl border border-signal/30 bg-ink-900/80 p-6 sm:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full animate-scan bg-gradient-to-b from-transparent via-signal/[0.06] to-transparent" />
          <div className="mb-6 flex flex-wrap gap-2">
            <Tag tone="info">Основи національного спротиву</Tag>
            <Tag>F3 «Комп’ютерні науки» · гр. 31 / 32 / 41</Tag>
            <Tag>90 хв · онлайн</Tag>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-signal">Навчальна командна симуляція</p>
          <h1 className="mt-2 text-4xl font-black leading-none tracking-tight text-white sm:text-6xl">
            ОПЕРАЦІЯ:
            <br />
            <span className="text-signal">ЄДИНИЙ КАНАЛ</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Тема: <b className="text-white">«Індивідуальна тактика, сигнали та інформаційна взаємодія малої групи»</b>
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-600 bg-ink-850 p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400">
                <Target className="h-4 w-4 text-signal" /> Навчальна мета
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                Сформувати навички дисциплінованої комунікації в малій групі: однозначні повідомлення, перевірка достовірності,
                підтвердження отримання, резервні канали та власний протокол зв’язку для цивільної команди.
              </p>
            </div>
            <div className="rounded-xl border border-ink-600 bg-ink-850 p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400">
                <Radio className="h-4 w-4 text-signal" /> Сценарій
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                Аварійна ситуація в громадському центрі. Цифрові системи збоять, зв’язок нестабільний, інформація суперечлива.
                Ви — команда, яка має налагодити надійний обмін інформацією. 7 етапів, 100 балів, понад 20 рішень.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Btn
              size="lg"
              onClick={() => {
                setLines(0);
                setPhase('boot');
              }}
            >
              <Power className="h-5 w-5" /> Розпочати операцію
            </Btn>
            <span className="text-xs text-slate-500">Усі сценарії цивільні та навчальні.</span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'boot') {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Panel title="Термінал симуляції" icon={<Zap className="h-4 w-4 text-signal" />}>
          <div className="space-y-2 font-mono text-sm">
            {BOOT_LINES.slice(0, lines).map((l, i) => (
              <div key={i} className={cx('animate-rise', l.includes('НЕСТАБ') || l.includes('ВІДСУТ') || l.includes('НЕ ПРИЗ') ? 'text-warn' : 'text-signal')}>
                <span className="text-slate-500">[{String(i).padStart(2, '0')}]</span> {l}
              </div>
            ))}
            <span className="inline-block h-4 w-2 animate-blink bg-signal" />
          </div>
          <div className="mt-4 text-right">
            <Btn variant="subtle" size="sm" onClick={() => setPhase('brief')}>
              Пропустити
            </Btn>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <ModuleHeader index={1} title="Система активована" codename="BOOT" minutes={5}>
        Ознайомтеся з вихідною ситуацією та зареєструйтеся як оператор. Дані потрібні лише для підсумкового звіту й зберігаються на цьому пристрої.
      </ModuleHeader>
      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Вступна ситуація" icon={<AlertTriangle className="h-4 w-4 text-warn" />} tone="warn" className="lg:col-span-3">
          <blockquote className="border-l-2 border-warn pl-4 text-lg leading-relaxed text-white">
            У громадському центрі виникла аварійна ситуація. Частина цифрових систем перестала працювати, мобільний зв’язок
            нестабільний, а учасники отримують суперечливу інформацію. Ваша команда повинна організувати надійну систему
            інформаційної взаємодії.
          </blockquote>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <WifiOff className="h-5 w-5 text-alert" />, t: 'Wi‑Fi центру', s: 'Не працює' },
              { icon: <Wifi className="h-5 w-5 animate-blink text-warn" />, t: 'Мобільний зв’язок', s: 'Нестабільний' },
              { icon: <Users className="h-5 w-5 text-info" />, t: 'Люди в будівлі', s: '≈ 120 осіб' },
            ].map((x) => (
              <div key={x.t} className="rounded-lg border border-ink-600 bg-ink-900/60 p-3">
                {x.icon}
                <div className="mt-2 text-xs uppercase tracking-wider text-slate-400">{x.t}</div>
                <div className="font-semibold text-white">{x.s}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-ink-600 bg-ink-900/60 p-4 text-sm text-slate-300">
            <div className="mb-2 font-mono text-xs uppercase tracking-wider text-signal">Як проходить операція</div>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Розшифруйте сигнали та знайдіть неоднозначності (15 б.).</li>
              <li>Пройдіть брифінг і перевірки знань (10 б.).</li>
              <li>Створіть власний протокол зв’язку команди (25 б.).</li>
              <li>Витримайте симуляцію «Канал під загрозою» (25 б.).</li>
              <li>Фінальне випробування «15 хвилин до рішення» (20 б.) і рефлексія (5 б.).</li>
            </ol>
            <p className="mt-2 text-xs text-slate-400">Бали нараховуються за обґрунтованість рішень, а не за швидкість.</p>
          </div>
        </Panel>

        <div className="order-first lg:order-none lg:col-span-2">
          {inLobby ? (
            <TeamLobby />
          ) : (
            <Panel title="Реєстрація оператора" icon={<UserRound className="h-4 w-4 text-signal" />}>
              <div className="space-y-4">
                {state.role !== 'teacher' && (
                  <div className="rounded-lg border border-info/40 bg-info/5 p-3">
                    <Input label="Код онлайн-заняття (від викладача)" value={code} onChange={(v) => setCode(normCode(v))} placeholder="Напр., K7M2QX" max={12} />
                    <p className="mt-1.5 text-xs text-slate-400">
                      З кодом ви працюєте <b className="text-slate-200">разом із командою наживо</b> й самі обираєте або створюєте команду. Без коду — самостійне проходження.
                    </p>
                  </div>
                )}
                <Input label={online ? 'Ваше ім’я (без прізвища)' : 'Ім’я та прізвище'} value={p.name} onChange={(v) => setP('name', v)} placeholder={online ? 'Напр., Олена' : 'Напр., Олена Коваль'} max={60} />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Група</span>
                  <Select value={p.group} onChange={(v) => setP('group', v)} options={['31', '32', '41'].map((g) => ({ value: g, label: `Група ${g}` }))} />
                </label>
                {!online && (
                  <>
                    <Input label="Позивний команди" value={p.team} onChange={(v) => setP('team', v)} placeholder="Напр., «Пакет-7»" max={40} />
                    <p className="text-xs text-slate-500">Позивний — умовна назва команди, потрапляє у звіт і рейтинг.</p>
                  </>
                )}
                {online && <p className="text-xs text-slate-500">Онлайн-режим використовує безкоштовний публічний сервер — вводьте лише ім’я.</p>}
                <Btn
                  className="w-full"
                  disabled={!ready}
                  onClick={() => {
                    if (online) {
                      const c = normCode(code);
                      update((s) => ({ ...s, session: { code: c, teamId: '', clientId: s.session?.clientId ?? makeId() } }));
                      return; // далі — лобі команд
                    }
                    update((s) => ({ ...s, started: true, session: s.role === 'teacher' ? s.session : null }));
                    go('m2');
                  }}
                >
                  {online ? 'Далі: обрати або створити команду' : 'Підтвердити й перейти до модуля 2'} <ChevronRight className="h-4 w-4" />
                </Btn>
                {!ready && <p className="text-xs text-slate-500">Заповніть {online ? 'ім’я та групу' : 'ім’я, групу та позивний команди'}.</p>}
                {state.session?.teamId && state.role !== 'teacher' && (
                  <Btn
                    variant="ghost"
                    className="w-full"
                    onClick={() => update((s) => ({ ...s, session: s.session ? { ...s.session, teamId: '' } : null }))}
                  >
                    Змінити команду (зараз: «{p.team}»)
                  </Btn>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
