import { useState } from 'react';
import { ArrowLeft, Loader2, LogIn, Plus, Users, Wifi } from 'lucide-react';
import { useApp } from '../lib/store';
import { teamSlug, useSync } from '../lib/sync';
import { Btn, Panel, Tag, cx } from './ui';

const TEAM_MAX = 5;

/** Лобі онлайн-заняття: студент обирає команду або створює нову. */
export default function TeamLobby() {
  const { state, update, go } = useApp();
  const { status, lobby, members, createTeam } = useSync();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const online = status === 'online';

  const join = (teamId: string, teamName: string) => {
    update((s) => ({
      ...s,
      started: true,
      profile: { ...s.profile, team: teamName },
      session: s.session ? { ...s.session, teamId } : s.session,
      // спільний стан команди надійде з сервера
      answers: {},
      results: {},
    }));
    go('m2');
  };

  const [busy, setBusy] = useState(false);
  const create = async () => {
    const clean = name.trim();
    if (clean.length < 2) return setErr('Назва — щонайменше 2 символи.');
    const id = teamSlug(clean);
    const existing = lobby.find((t) => t.teamId === id);
    if (existing) return setErr(`Команда «${existing.name}» вже є — приєднайтеся до неї або оберіть іншу назву.`);
    setBusy(true);
    const created = await createTeam(clean);
    setBusy(false);
    if (!created) return setErr('Сервер не підтвердив створення. Перевірте інтернет і спробуйте ще раз.');
    join(created, clean);
  };

  return (
    <Panel
      title={`Онлайн-заняття ${state.session?.code ?? ''}`}
      icon={<Users className="h-4 w-4 text-signal" />}
      tone="signal"
      right={
        <span className={cx('flex items-center gap-1.5 font-mono text-xs', online ? 'text-signal' : 'text-warn')}>
          {online ? <Wifi className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          {online ? 'на зв’язку' : 'підключення…'}
        </span>
      }
    >
      <p className="mb-4 text-sm text-slate-300">
        {state.profile.name}, оберіть команду або створіть нову. Рекомендовано {TEAM_MAX - 2}–{TEAM_MAX} учасників у команді. У команді ви
        бачите відповіді одне одного наживо й разом заповнюєте протокол.
      </p>

      <div className="space-y-2">
        {lobby.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink-500 p-4 text-center text-sm text-slate-400">
            {online ? 'Команд ще немає — створіть першу.' : 'Завантажую список команд…'}
          </div>
        )}
        {lobby.map((t) => {
          const who = members.filter((m) => m.teamId === t.teamId);
          const full = who.length >= TEAM_MAX;
          return (
            <div key={t.teamId} className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-600 bg-ink-900/60 p-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white">{t.name}</div>
                <div className="text-xs text-slate-400">{who.length ? `онлайн: ${who.map((m) => m.name).join(', ')}` : 'поки нікого онлайн'}</div>
              </div>
              <Tag tone={full ? 'warn' : who.length ? 'good' : 'default'}>
                {who.length} / {TEAM_MAX}
              </Tag>
              <Btn size="sm" variant={full ? 'ghost' : 'primary'} disabled={!online} onClick={() => join(t.teamId, t.name)}>
                <LogIn className="h-4 w-4" /> {full ? 'Приєднатися (повна)' : 'Приєднатися'}
              </Btn>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-ink-600/60 pt-4">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Нова команда</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="new-team"
            className="field"
            value={name}
            maxLength={40}
            placeholder="Позивний команди, напр. «Пакет-7»"
            onChange={(e) => {
              setName(e.target.value);
              setErr('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && online && !busy && create()}
          />
          <Btn className="shrink-0" disabled={!online || busy || name.trim().length < 2} onClick={create}>
            <Plus className="h-4 w-4" /> Створити й приєднатися
          </Btn>
        </div>
        {err && <p className="mt-2 text-sm text-alert">{err}</p>}
      </div>

      <div className="mt-4">
        <Btn size="sm" variant="subtle" onClick={() => update((s) => ({ ...s, session: null }))}>
          <ArrowLeft className="h-4 w-4" /> Вийти з онлайн-заняття (самостійний режим)
        </Btn>
      </div>
    </Panel>
  );
}
