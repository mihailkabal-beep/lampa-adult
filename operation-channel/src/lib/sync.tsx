/**
 * Онлайн-режим: синхронізація команд і викладача через публічний MQTT-брокер (WebSocket).
 * Без реєстрації й ключів. Стан команди зберігається як retained-повідомлення на брокері.
 * Конфлікти: «останній запис перемагає» для кожного завдання / поля протоколу окремо.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import mqtt, { type MqttClient } from 'mqtt';
import { moduleScores, total, useApp } from './store';
import { MODULES, TASKS } from './config';
import type { AppState, Protocol, ScoredModule } from './types';

const ROOT = 'opkanal/v1';
const DEFAULT_BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081'];
const LOCAL_ONLY = new Set(['m6.step']);
const PROTOCOL_FIELDS: (keyof Protocol)[] = ['teamName', 'members', 'roles', 'signals', 'template', 'rules', 'backupChannel', 'backupTrigger', 'backupCheck', 'savedAt'];

function brokers(): string[] {
  try {
    const b = new URLSearchParams(window.location.search).get('broker');
    if (b) return [b];
  } catch {
    /* ignore */
  }
  return DEFAULT_BROKERS;
}

export function makeCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => abc[n % abc.length]).join('');
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function normCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

/** Ідентифікатор команди з позивного (латиниця/кирилиця, без регістру). */
export function teamSlug(s: string) {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'team'
  );
}

export function joinLink(code: string) {
  const u = new URL(window.location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('s', code);
  return u.toString();
}

export function codeFromUrl() {
  try {
    const s = new URLSearchParams(window.location.search).get('s');
    return s ? normCode(s) : '';
  } catch {
    return '';
  }
}

interface Env {
  t: number;
  by: string;
  v: unknown;
}

export interface TeamSummary {
  teamId: string;
  team: string;
  scores: Record<ScoredModule, number>;
  total: number;
  done: number;
  at: number;
}

export interface Member {
  id: string;
  name: string;
  teamId: string;
  team: string;
  at: number;
}

type Status = 'off' | 'connecting' | 'online' | 'error';

interface SyncCtx {
  status: Status;
  broker: string;
  members: Member[]; // учасники моєї команди (студент) або всі (викладач), онлайн за останні 45 с
  teams: TeamSummary[]; // для викладача
}

const Ctx = createContext<SyncCtx>({ status: 'off', broker: '', members: [], teams: [] });
export const useSync = () => useContext(Ctx);

function keysOf(s: AppState) {
  const m = new Map<string, string>();
  for (const [k, v] of Object.entries(s.answers)) if (!LOCAL_ONLY.has(k)) m.set(`a/${k}`, JSON.stringify(v));
  for (const [k, v] of Object.entries(s.results)) m.set(`r/${k}`, JSON.stringify(v));
  for (const f of PROTOCOL_FIELDS) m.set(`p/${f}`, JSON.stringify(s.protocol[f]));
  return m;
}

function ctrlOf(s: AppState) {
  return {
    current: s.current,
    follow: !!s.session?.follow,
    pacing: s.pacing,
    openedUpTo: s.openedUpTo,
    simRevealed: s.simRevealed,
    timer: s.timer,
    showAnswers: s.showAnswers,
  };
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { state, update, go } = useApp();
  const session = state.session;
  const isTeacher = state.role === 'teacher';
  const [status, setStatus] = useState<Status>('off');
  const [broker, setBroker] = useState('');
  const [hb, setHb] = useState<Record<string, Member>>({});
  const [teamsMap, setTeamsMap] = useState<Record<string, TeamSummary>>({});
  const [, setTick] = useState(0);

  const clientRef = useRef<MqttClient | null>(null);
  const known = useRef(new Map<string, { j: string; t: number }>());
  const ready = useRef(false);
  const timers = useRef(new Map<string, number>());
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastCtrlCurrent = useRef<string | null>(null);

  const base = session ? `${ROOT}/${session.code}` : '';
  const teamBase = session && session.teamId ? `${base}/t/${session.teamId}` : '';

  const publish = useCallback((topic: string, payload: unknown, retain = true) => {
    const c = clientRef.current;
    if (!c || !c.connected) return;
    c.publish(topic, JSON.stringify(payload), { qos: 1, retain });
  }, []);

  // ---------- з’єднання ----------
  useEffect(() => {
    if (!session) {
      setStatus('off');
      return;
    }
    const list = brokers();
    let idx = 0;
    let disposed = false;
    let client: MqttClient | null = null;
    known.current = new Map();
    ready.current = false;
    setHb({});
    setTeamsMap({});

    const onMessage = (topic: string, buf: Uint8Array) => {
      let env: Env;
      try {
        const txt = new TextDecoder().decode(buf);
        if (!txt) return;
        env = JSON.parse(txt);
      } catch {
        return;
      }
      const rel = topic.slice(base.length + 1); // ctrl | t/<team>/...
      if (rel === 'ctrl') {
        if (isTeacher) return;
        const c = env.v as ReturnType<typeof ctrlOf>;
        if (!c) return;
        update((s) => ({ ...s, pacing: c.pacing, openedUpTo: c.openedUpTo, simRevealed: c.simRevealed, timer: c.timer, showAnswers: c.showAnswers }));
        if (c.follow && c.current && c.current !== lastCtrlCurrent.current) {
          const idx = (m: string) => MODULES.findIndex((x) => x.id === m);
          // при першому з’єднанні — лише вперед (щоб не повертати студента назад), далі — за кожною зміною викладача
          if (lastCtrlCurrent.current !== null || idx(c.current) > idx(stateRef.current.current)) go(c.current);
        }
        lastCtrlCurrent.current = c.current;
        return;
      }
      const m = rel.match(/^t\/([^/]+)\/(.+)$/);
      if (!m) return;
      const [, teamId, rest] = m;
      if (rest === 'hb') {
        const v = env.v as Member;
        if (v?.id) setHb((h) => ({ ...h, [v.id]: { ...v, teamId, at: Date.now() } }));
        return;
      }
      if (rest === 'sum') {
        const v = env.v as TeamSummary;
        if (v) setTeamsMap((x) => ({ ...x, [teamId]: { ...v, teamId } }));
        return;
      }
      if (isTeacher || teamId !== session.teamId) return;
      // a/<task> | r/<task> | p/<field>
      if (env.by === session.clientId && known.current.get(rest)?.t === env.t) return;
      const cur = known.current.get(rest);
      if (cur && cur.t > env.t) return;
      const j = JSON.stringify(env.v ?? null);
      known.current.set(rest, { j, t: env.t });
      const [kind, key] = [rest.slice(0, 1), rest.slice(2)];
      update((s) => {
        if (kind === 'a') {
          const answers = { ...s.answers };
          if (env.v === null || env.v === undefined) delete answers[key];
          else answers[key] = env.v;
          return { ...s, answers };
        }
        if (kind === 'r') {
          if (!TASKS[key]) return s;
          const results = { ...s.results };
          if (env.v === null || env.v === undefined) delete results[key];
          else results[key] = env.v as AppState['results'][string];
          return { ...s, results };
        }
        if (kind === 'p' && (PROTOCOL_FIELDS as string[]).includes(key) && env.v !== undefined) {
          return { ...s, protocol: { ...s.protocol, [key]: env.v } };
        }
        return s;
      });
    };

    const connect = () => {
      if (disposed) return;
      const url = list[idx % list.length];
      setBroker(url);
      setStatus('connecting');
      client = mqtt.connect(url, {
        clientId: `opk_${session.clientId}_${Math.random().toString(36).slice(2, 6)}`,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 4000,
        keepalive: 30,
      });
      clientRef.current = client;
      let everConnected = false;
      client.on('connect', () => {
        everConnected = true;
        setStatus('online');
        // Локальні дані не перезаписують спільні: спершу приймаємо retained-стан команди
        ready.current = false;
        for (const [k, j] of keysOf(stateRef.current)) if (!known.current.has(k)) known.current.set(k, { j, t: 0 });
        const subs = isTeacher ? [`${base}/t/+/sum`, `${base}/t/+/hb`] : [`${base}/ctrl`, `${teamBase}/#`];
        client!.subscribe(subs, { qos: 1 });
        window.setTimeout(() => {
          ready.current = true;
          setTick((n) => n + 1);
        }, 1500);
      });
      client.on('message', onMessage);
      client.on('error', () => setStatus('error'));
      client.on('offline', () => setStatus('connecting'));
      client.on('close', () => {
        if (disposed) return;
        if (!everConnected) {
          // брокер недоступний — пробуємо наступний
          client?.end(true);
          idx++;
          window.setTimeout(connect, 500);
        } else setStatus('connecting');
      });
    };
    connect();
    return () => {
      disposed = true;
      ready.current = false;
      for (const t of timers.current.values()) window.clearTimeout(t);
      timers.current.clear();
      client?.end(true);
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.code, session?.teamId, session?.clientId, isTeacher]);

  // ---------- вихідні зміни команди ----------
  useEffect(() => {
    if (!session || isTeacher || !teamBase || !ready.current) return;
    const cur = keysOf(state);
    const all = new Set([...cur.keys(), ...known.current.keys()]);
    for (const k of all) {
      const j = cur.get(k) ?? 'null';
      const prev = known.current.get(k);
      if (prev?.j === j) continue;
      if (!prev && j === 'null') continue;
      const t = Date.now();
      known.current.set(k, { j, t });
      const old = timers.current.get(k);
      if (old) window.clearTimeout(old);
      timers.current.set(
        k,
        window.setTimeout(() => {
          timers.current.delete(k);
          const latest = known.current.get(k);
          if (!latest) return;
          publish(`${teamBase}/${k}`, { t: latest.t, by: session.clientId, v: JSON.parse(latest.j) } satisfies Env);
        }, 250),
      );
    }
  });

  // ---------- підсумок команди для викладача ----------
  const sumKey = JSON.stringify(state.results) + state.profile.team + status;
  useEffect(() => {
    if (!session || isTeacher || !teamBase || status !== 'online') return;
    const t = window.setTimeout(() => {
      const s = stateRef.current;
      const scores = moduleScores({ ...s, manual: {} });
      const sum: TeamSummary = { teamId: session.teamId, team: s.profile.team, scores, total: total(scores), done: Object.keys(s.results).length, at: Date.now() };
      publish(`${teamBase}/sum`, { t: Date.now(), by: session.clientId, v: sum } satisfies Env);
    }, 1800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sumKey]);

  // ---------- присутність ----------
  useEffect(() => {
    if (!session || isTeacher || !teamBase || status !== 'online') return;
    const send = () => {
      const s = stateRef.current;
      publish(`${teamBase}/hb`, { t: Date.now(), by: session.clientId, v: { id: session.clientId, name: s.profile.name || 'Учасник', team: s.profile.team, teamId: session.teamId, at: Date.now() } }, false);
    };
    send();
    const i = window.setInterval(send, 15000);
    return () => window.clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, teamBase, state.profile.name]);

  // ---------- керування від викладача ----------
  const ctrlJson = JSON.stringify(ctrlOf(state));
  useEffect(() => {
    if (!session || !isTeacher || status !== 'online') return;
    const t = window.setTimeout(() => publish(`${base}/ctrl`, { t: Date.now(), by: session.clientId, v: JSON.parse(ctrlJson) }), 150);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctrlJson, status]);

  // оновлення списку онлайн
  useEffect(() => {
    if (!session) return;
    const i = window.setInterval(() => setTick((n) => n + 1), 10000);
    return () => window.clearInterval(i);
  }, [session]);

  const now = Date.now();
  const members = Object.values(hb)
    .filter((m) => now - m.at < 45000)
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
  const teams = Object.values(teamsMap).sort((a, b) => b.total - a.total);

  const value = useMemo(() => ({ status, broker, members, teams }), [status, broker, members, teams]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
