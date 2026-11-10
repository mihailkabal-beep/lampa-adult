import { useRef } from 'react';
import { CheckCircle2, Circle, ClipboardCopy, Download, FileText, Pencil, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { ROLE_KEYS, SIGNAL_KEYS, useApp } from '../lib/store';
import { useSync } from '../lib/sync';
import type { Protocol } from '../lib/types';
import { copyText, downloadFile, printElement, protocolToText, safeName } from '../lib/export';
import { Btn, EMBEDDED, Input, ModuleHeader, NextModule, Panel, ScoreBadge, Select, Tag, TextArea, cx } from '../components/ui';
import { toast } from '../components/Toaster';

const FORMS = ['Кодове слово', 'Текст', 'Емодзі', 'Колір', 'Жест', 'Звук'];
const BACKUP = [
  'SMS на заздалегідь узгоджені номери',
  'Рації PMR446 (цивільні, без ліцензії)',
  'Посильний (людина передає записку)',
  'Точка збору у визначений час',
  'Дошка оголошень / табличка на вході',
];
const TEMPLATE_FIELDS = ['[ВІДПРАВНИК]', '[ЧАС]', '[МІСЦЕ]', '[ПОДІЯ]', '[СТАТУС: перевірено / не перевірено]', '[ДІЯ]', '[ПІДТВЕРДИТИ: так/ні]'];

const TPL_CHECKS: { label: string; re: RegExp }[] = [
  { label: 'відправник', re: /відправ|хто|автор|джерел/i },
  { label: 'час', re: /час|коли|\d{1,2}[:.]\d{2}/i },
  { label: 'місце', re: /місц|де\b|локац|поверх|ауд/i },
  { label: 'подія / зміст', re: /поді|що\b|зміст|суть|ситуац/i },
  { label: 'статус перевірки', re: /статус|перевір/i },
  { label: 'запит підтвердження', re: /підтвер|прийнято/i },
];

export interface Check {
  label: string;
  pts: number;
  max: number;
  hint: string;
}

export function evaluateProtocol(p: Protocol): Check[] {
  const members = p.members.filter((m) => m.trim().length >= 2);
  const rolesFilled = ROLE_KEYS.filter((r) => p.roles[r.key] && members.includes(p.roles[r.key])).length;
  const sigOk = p.signals.filter((s) => s.code.trim().length >= 1 && s.meaning.trim().length >= 10).length;
  const codes = p.signals.map((s) => s.code.trim().toLowerCase()).filter(Boolean);
  const dup = codes.length !== new Set(codes).size;
  const tpl = TPL_CHECKS.filter((c) => c.re.test(p.template)).length;
  const rules = p.rules.filter((r) => r.trim().length >= 10).length;
  return [
    { label: 'Назва команди', pts: p.teamName.trim().length >= 2 ? 1 : 0, max: 1, hint: 'Вкажіть назву.' },
    { label: 'Склад команди (від 3 осіб)', pts: Math.min(2, members.length >= 3 ? 2 : members.length >= 2 ? 1 : 0), max: 2, hint: 'Додайте щонайменше трьох учасників.' },
    { label: 'Розподіл 5 ролей', pts: rolesFilled, max: 5, hint: 'Кожній ролі призначте учасника зі складу.' },
    {
      label: 'П’ять умовних сигналів',
      pts: Math.max(0, sigOk - (dup ? 1 : 0)),
      max: 5,
      hint: dup ? 'Позначення сигналів повторюються — так їх легко сплутати.' : 'Для кожного сигналу: позначення + пояснення (від 10 символів).',
    },
    {
      label: 'Шаблон повідомлення',
      pts: tpl >= 5 ? 4 : tpl >= 4 ? 3 : tpl >= 3 ? 2 : tpl >= 2 ? 1 : 0,
      max: 4,
      hint: `Знайдено елементів: ${tpl}/6 (${TPL_CHECKS.filter((c) => !c.re.test(p.template)).map((c) => c.label).join(', ') || 'усі є'}).`,
    },
    { label: 'Правила комунікації (від 3)', pts: Math.round((Math.min(3, rules) / 3) * 4 * 2) / 2, max: 4, hint: 'Сформулюйте щонайменше 3 правила (від 10 символів).' },
    {
      label: 'Резервний канал',
      pts: (p.backupChannel.trim() ? 2 : 0) + (p.backupTrigger.trim().length >= 10 ? 1 : 0) + (p.backupCheck.trim().length >= 10 ? 1 : 0),
      max: 4,
      hint: 'Оберіть канал, умову переходу і спосіб перевірки зв’язку.',
    },
  ];
}

function ProtocolCard({ p }: { p: Protocol }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-ink-600 pb-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal">Цифрова картка команди</div>
          <div className="text-2xl font-black text-white">{p.teamName || 'Без назви'}</div>
        </div>
        <div className="font-mono text-xs text-slate-400">Операція «Єдиний канал»{p.savedAt ? ` · ${new Date(p.savedAt).toLocaleString('uk-UA')}` : ''}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">Ролі</div>
          <ul className="space-y-1">
            {ROLE_KEYS.map((r) => (
              <li key={r.key} className="flex justify-between gap-2 border-b border-ink-700 pb-1">
                <span className="text-slate-400">{r.label}</span>
                <span className="font-semibold text-white">{p.roles[r.key] || '—'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">Умовні сигнали</div>
          <ul className="space-y-1">
            {p.signals.map((s) => (
              <li key={s.key} className="border-b border-ink-700 pb-1">
                <span className="mr-2 rounded bg-ink-700 px-1.5 py-0.5 font-mono text-signal">{s.code || '—'}</span>
                <span className="text-white">{SIGNAL_KEYS.find((k) => k.key === s.key)?.label}</span>
                <span className="text-slate-500"> · {s.form}</span>
                {s.meaning && <div className="text-xs text-slate-400">{s.meaning}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">Шаблон повідомлення</div>
        <div className="whitespace-pre-wrap rounded-md border border-ink-600 bg-ink-900/60 p-2 font-mono text-xs text-slate-200">{p.template || '—'}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">Правила</div>
          <ol className="list-decimal space-y-0.5 pl-5 text-slate-200">
            {p.rules.filter((r) => r.trim()).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-slate-400">Резервний канал</div>
          <div className="font-semibold text-white">{p.backupChannel || '—'}</div>
          <div className="text-xs text-slate-400">Коли: {p.backupTrigger || '—'}</div>
          <div className="text-xs text-slate-400">Перевірка: {p.backupCheck || '—'}</div>
        </div>
      </div>
      <div className="text-xs text-slate-500">Склад: {p.members.filter(Boolean).join(', ') || '—'}</div>
    </div>
  );
}

export default function M4Protocol() {
  const { state, update, submit, resetTask } = useApp();
  const sync = useSync();
  const p = state.protocol;
  const r = state.results['m4.protocol'];
  const locked = !!r;
  const cardRef = useRef<HTMLDivElement>(null);
  const tplRef = useRef<HTMLTextAreaElement>(null);
  const set = (fn: (p: Protocol) => Protocol) => update((s) => ({ ...s, protocol: fn(s.protocol) }));
  const checks = evaluateProtocol(p);
  const pts = checks.reduce((a, c) => a + c.pts, 0);
  const members = p.members.map((m) => m.trim()).filter((m) => m.length >= 2);

  const insertField = (f: string) => {
    const el = tplRef.current;
    const pos = el ? el.selectionStart : p.template.length;
    const next = p.template.slice(0, pos) + f + ' ' + p.template.slice(pos);
    set((x) => ({ ...x, template: next }));
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <div>
      <ModuleHeader index={4} title="Створи протокол зв’язку" codename="BUILD" minutes={20} max={25}>
        Спроєктуйте власний «API» комунікації для цивільної команди: хто за що відповідає, які сигнали використовуєте, як виглядає
        стандартне повідомлення і що робити, коли основний канал падає. Результат — цифрова картка команди.
        {state.session && ' В онлайн-заняття протокол спільний: зміни кожного учасника команди одразу бачать усі.'}
      </ModuleHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="1–2 · Команда" right={<Tag>{members.length} учасн.</Tag>}>
            <div className="space-y-3">
              <Input label="Назва команди" value={p.teamName} disabled={locked} onChange={(v) => set((x) => ({ ...x, teamName: v }))} placeholder="Напр., «Вузол-4»" max={40} />
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Склад команди</div>
              {p.members.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="field"
                    value={m}
                    disabled={locked}
                    maxLength={40}
                    placeholder={`Учасник ${i + 1}`}
                    onChange={(e) => set((x) => ({ ...x, members: x.members.map((mm, j) => (j === i ? e.target.value : mm)) }))}
                  />
                  {!locked && p.members.length > 1 && (
                    <Btn variant="subtle" size="sm" aria-label="Видалити учасника" onClick={() => set((x) => ({ ...x, members: x.members.filter((_, j) => j !== i) }))}>
                      <Trash2 className="h-4 w-4" />
                    </Btn>
                  )}
                </div>
              ))}
              {!locked && state.session && sync.members.length > 0 && (
                <Btn variant="ghost" size="sm" onClick={() => set((x) => ({ ...x, members: sync.members.map((m) => m.name).slice(0, 8) }))}>
                  <Plus className="h-4 w-4" /> Підставити учасників онлайн ({sync.members.length})
                </Btn>
              )}
              {!locked && p.members.length < 8 && (
                <Btn variant="ghost" size="sm" onClick={() => set((x) => ({ ...x, members: [...x.members, ''] }))}>
                  <Plus className="h-4 w-4" /> Додати учасника
                </Btn>
              )}
            </div>
          </Panel>

          <Panel title="3 · Розподіл ролей">
            {members.length === 0 && <p className="mb-3 text-sm text-warn">Спершу додайте учасників команди — їх можна буде обрати тут.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLE_KEYS.map((role) => (
                <div key={role.key} className="rounded-lg border border-ink-600 bg-ink-900/40 p-3">
                  <div className="font-semibold text-white">{role.label}</div>
                  <div className="mb-2 text-xs text-slate-400">{role.hint}</div>
                  <Select
                    value={members.includes(p.roles[role.key] ?? '') ? p.roles[role.key] : ''}
                    disabled={locked}
                    onChange={(v) => set((x) => ({ ...x, roles: { ...x.roles, [role.key]: v } }))}
                    options={members.map((m) => ({ value: m, label: m }))}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Якщо в команді менше п’яти людей, одна особа може поєднувати дві ролі — але не координатора й аналітика (хтось має перевіряти рішення).</p>
          </Panel>

          <Panel title="4 · Умовні цивільні сигнали">
            <p className="mb-3 text-sm text-slate-400">Вигадайте короткі позначення, які неможливо сплутати між собою, та поясніть, як на них реагувати.</p>
            <div className="space-y-3">
              {p.signals.map((s, i) => (
                <div key={s.key} className="rounded-lg border border-ink-600 bg-ink-900/40 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-ink-700 font-mono text-xs text-signal">{i + 1}</span>
                    {SIGNAL_KEYS.find((k) => k.key === s.key)?.label}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
                    <input
                      className="field font-mono"
                      value={s.code}
                      maxLength={30}
                      disabled={locked}
                      placeholder="Позначення, напр. «ПРИЙНЯТО» або ✅"
                      onChange={(e) => set((x) => ({ ...x, signals: x.signals.map((ss, j) => (j === i ? { ...ss, code: e.target.value } : ss)) }))}
                    />
                    <Select
                      value={s.form}
                      disabled={locked}
                      placeholder="Форма"
                      onChange={(v) => set((x) => ({ ...x, signals: x.signals.map((ss, j) => (j === i ? { ...ss, form: v || 'Текст' } : ss)) }))}
                      options={FORMS.map((f) => ({ value: f, label: f }))}
                    />
                  </div>
                  <input
                    className="field mt-2"
                    value={s.meaning}
                    maxLength={140}
                    disabled={locked}
                    placeholder="Що означає і як реагувати"
                    onChange={(e) => set((x) => ({ ...x, signals: x.signals.map((ss, j) => (j === i ? { ...ss, meaning: e.target.value } : ss)) }))}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="5 · Шаблон стандартного повідомлення">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {TEMPLATE_FIELDS.map((f) => (
                <button key={f} type="button" disabled={locked} onClick={() => insertField(f)} className="rounded-md border border-ink-500 px-2 py-1 font-mono text-[11px] text-slate-300 hover:border-signal hover:text-signal disabled:opacity-40">
                  + {f}
                </button>
              ))}
            </div>
            <textarea
              ref={tplRef}
              className="field font-mono"
              rows={4}
              maxLength={400}
              disabled={locked}
              value={p.template}
              placeholder="Натискайте на поля вище або пишіть самостійно"
              onChange={(e) => set((x) => ({ ...x, template: e.target.value }))}
            />
          </Panel>

          <Panel title="6 · Правила комунікації">
            <div className="space-y-2">
              {p.rules.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2.5 font-mono text-xs text-signal">{i + 1}.</span>
                  <input
                    className="field"
                    value={rule}
                    maxLength={160}
                    disabled={locked}
                    placeholder={['Напр., Кожне повідомлення має статус перевірки', 'Напр., Відповідаємо «ПРИЙНЯТО» протягом 2 хв', 'Напр., Загальний чат — лише для підтверджених новин'][i] ?? 'Ще одне правило'}
                    onChange={(e) => set((x) => ({ ...x, rules: x.rules.map((rr, j) => (j === i ? e.target.value : rr)) }))}
                  />
                  {!locked && p.rules.length > 1 && (
                    <Btn variant="subtle" size="sm" aria-label="Видалити правило" onClick={() => set((x) => ({ ...x, rules: x.rules.filter((_, j) => j !== i) }))}>
                      <Trash2 className="h-4 w-4" />
                    </Btn>
                  )}
                </div>
              ))}
              {!locked && p.rules.length < 7 && (
                <Btn variant="ghost" size="sm" onClick={() => set((x) => ({ ...x, rules: [...x.rules, ''] }))}>
                  <Plus className="h-4 w-4" /> Додати правило
                </Btn>
              )}
            </div>
          </Panel>

          <Panel title="7 · Резервний канал зв’язку">
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {BACKUP.map((b) => (
                  <button
                    key={b}
                    type="button"
                    disabled={locked}
                    onClick={() => set((x) => ({ ...x, backupChannel: b }))}
                    className={cx('rounded-lg border px-3 py-2 text-left text-sm transition', p.backupChannel === b ? 'border-signal bg-signal/10 text-signal' : 'border-ink-600 text-slate-200 hover:border-ink-500')}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <Input label="Або власний варіант" value={BACKUP.includes(p.backupChannel) ? '' : p.backupChannel} disabled={locked} onChange={(v) => set((x) => ({ ...x, backupChannel: v }))} placeholder="Опишіть свій резервний канал" />
              <TextArea label="Коли переходимо на резерв" rows={2} max={200} value={p.backupTrigger} disabled={locked} onChange={(v) => set((x) => ({ ...x, backupTrigger: v }))} placeholder="Напр., якщо 2 повідомлення поспіль без підтвердження протягом 5 хв" />
              <TextArea label="Як перевіряємо, що резерв працює" rows={2} max={200} value={p.backupCheck} disabled={locked} onChange={(v) => set((x) => ({ ...x, backupCheck: v }))} placeholder="Напр., перекличка кожні 15 хв, кожен відповідає своїм позначенням" />
            </div>
          </Panel>
        </div>

        <div className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <Panel title="Валідатор протоколу" right={r ? <ScoreBadge r={r} /> : <Tag tone={pts >= 20 ? 'good' : pts >= 12 ? 'warn' : 'default'}>{pts} / 25</Tag>}>
            <ul className="space-y-2 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2">
                  {c.pts >= c.max ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />}
                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <span className={c.pts >= c.max ? 'text-white' : 'text-slate-300'}>{c.label}</span>
                      <span className="font-mono text-xs text-slate-400">{c.pts}/{c.max}</span>
                    </div>
                    {c.pts < c.max && <div className="text-xs text-slate-500">{c.hint}</div>}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Автоматична оцінка попередня: викладач може скоригувати бали вручну за якістю змісту.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Btn
                variant="ghost"
                onClick={() => {
                  set((x) => ({ ...x, savedAt: Date.now() }));
                  toast('Протокол збережено на цьому пристрої');
                }}
              >
                <Save className="h-4 w-4" /> Зберегти чернетку
              </Btn>
              {!r ? (
                <Btn
                  disabled={pts < 5}
                  onClick={() => {
                    set((x) => ({ ...x, savedAt: Date.now() }));
                    submit('m4.protocol', {
                      score: pts,
                      decisions: checks.map((c) => ({ label: `Протокол: ${c.label}`, ok: c.pts >= c.max })),
                      feedback:
                        pts >= 22 ? 'Протокол повний і придатний до використання.' : pts >= 15 ? 'Робочий протокол, але є незаповнені елементи — див. валідатор.' : 'Протокол неповний. У реальній ситуації команді бракуватиме домовленостей.',
                    });
                    toast('Протокол здано на оцінювання');
                  }}
                >
                  <FileText className="h-4 w-4" /> Сформувати картку й здати
                </Btn>
              ) : (
                <Btn variant="warn" onClick={() => resetTask('m4.protocol')}>
                  <Pencil className="h-4 w-4" /> Редагувати (оцінку буде знято)
                </Btn>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel
          title="Цифрова картка команди"
          tone="signal"
          right={
            <div className="no-print flex flex-wrap gap-2">
              <Btn
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const ok = await copyText(protocolToText(p));
                  toast(ok ? 'Текст протоколу скопійовано' : 'Не вдалося скопіювати — скористайтеся завантаженням .txt', ok);
                }}
              >
                <ClipboardCopy className="h-4 w-4" /> Копіювати
              </Btn>
              {!EMBEDDED && (
                <>
                  <Btn size="sm" variant="ghost" onClick={() => downloadFile(`protocol_${safeName(p.teamName)}.txt`, protocolToText(p))}>
                    <Download className="h-4 w-4" /> .txt
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => printElement(cardRef.current)}>
                    <Printer className="h-4 w-4" /> Друк / PDF
                  </Btn>
                </>
              )}
            </div>
          }
        >
          <div ref={cardRef}>
            <ProtocolCard p={p} />
          </div>
          <p className="no-print mt-3 text-xs text-slate-500">
            {EMBEDDED
              ? 'У цьому вбудованому перегляді друк і завантаження файлів недоступні: скопіюйте текст або відкрийте офлайн-версію застосунку.'
              : 'PDF: натисніть «Друк / PDF» і в діалозі оберіть принтер «Зберегти як PDF».'}
          </p>
        </Panel>
      </div>
      <NextModule to="m5" />
    </div>
  );
}
