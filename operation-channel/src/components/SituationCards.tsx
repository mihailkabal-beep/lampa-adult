import { AlertOctagon, Flag, MessageSquareText, Radio, Siren, SplitSquareHorizontal, X, type LucideIcon } from 'lucide-react';
import { useApp } from '../lib/store';
import { TimerBadge } from './Timer';
import { Btn, cx } from './ui';

export const CARDS: { id: string; tag: string; title: string; body: string; icon: LucideIcon; tone: 'warn' | 'alert' | 'signal' | 'info' }[] = [
  { id: 'intro', tag: 'Вступна ситуація', title: 'Система активована', body: 'У громадському центрі виникла аварійна ситуація. Частина цифрових систем перестала працювати, мобільний зв’язок нестабільний, а учасники отримують суперечливу інформацію. Ваша команда повинна організувати надійну систему інформаційної взаємодії.', icon: Siren, tone: 'warn' },
  { id: 'signal', tag: 'Модуль 2', title: 'Один сигнал — різні значення', body: '«Перенесено», «скасовано», «призупинено», «отримано», «перевіряється». Що саме гарантує кожне з цих слів? І чого НЕ гарантує?', icon: MessageSquareText, tone: 'info' },
  { id: 'simA', tag: 'Симуляція · Ситуація А', title: 'Неперевірене повідомлення', body: '12:14. У робочий чат переслано: «Увага! Вихід із будівлі закрито. Усі повинні залишатися на місці». Автор невідомий, переслано 14 разів. Відвідувачі вже питають, що відбувається.', icon: AlertOctagon, tone: 'alert' },
  { id: 'simB', tag: 'Симуляція · Ситуація Б', title: 'Втрата зв’язку', body: 'Оператор зв’язку Андрій (2 поверх) не відповідає 7 хвилин. Інтернет зник о 12:05, мобільний сигнал слабкий. Ваші повідомлення 12:06 і 12:09 — без підтвердження.', icon: Radio, tone: 'warn' },
  { id: 'simC', tag: 'Симуляція · Ситуація В', title: 'Інформаційна плутанина', body: 'Оля: «Евакуація через вихід А, автобуси о 13:00» (переслано з публічного чату). Дмитро: «Вихід А зачинено, використовуйте вихід Б. Збір у холі о 12:30» (від адміністраторки особисто). Люди вже рушили до різних виходів.', icon: SplitSquareHorizontal, tone: 'warn' },
  { id: 'final', tag: 'Фінальне випробування', title: '15 хвилин до рішення', body: 'У громадському центрі сталася аварія. Потрібно забезпечити інформаційну координацію між відповідальними працівниками та відвідувачами. Основний цифровий канал працює нестабільно. Ролі → алгоритм → резерв → перевірка → звернення.', icon: Flag, tone: 'alert' },
];

export function SituationOverlay() {
  const { state, patch } = useApp();
  const card = CARDS.find((c) => c.id === state.card);
  if (!card) return null;
  const Icon = card.icon;
  const idx = CARDS.indexOf(card);
  const color = { warn: 'text-warn border-warn/60', alert: 'text-alert border-alert/60', signal: 'text-signal border-signal/60', info: 'text-info border-info/60' }[card.tone];
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-ink-950/95 p-4 backdrop-blur" role="dialog" aria-modal="true" aria-label={card.title}>
      <div className={cx('hud-corners relative w-full max-w-4xl animate-rise rounded-2xl border bg-ink-900 p-6 sm:p-12', color)}>
        <button type="button" onClick={() => patch({ card: null })} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-ink-700 hover:text-white" aria-label="Закрити">
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.25em]">
          <Icon className="h-6 w-6" /> {card.tag}
        </div>
        <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">{card.title}</h2>
        <p className="mt-6 text-lg leading-relaxed text-slate-200 sm:text-2xl">{card.body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <TimerBadge t={state.timer} big />
          <div className="flex gap-2">
            <Btn variant="ghost" disabled={idx === 0} onClick={() => patch({ card: CARDS[idx - 1].id })}>
              ← Попередня
            </Btn>
            <Btn variant="ghost" disabled={idx === CARDS.length - 1} onClick={() => patch({ card: CARDS[idx + 1].id })}>
              Наступна →
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
