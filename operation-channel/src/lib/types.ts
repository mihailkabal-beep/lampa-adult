export type ModuleId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'results';
export type ScoredModule = 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7';

export interface DecisionRecord {
  label: string;
  ok: boolean;
}

export interface TaskResult {
  score: number;
  max: number;
  at: number;
  decisions: DecisionRecord[];
  feedback?: string;
}

export interface Profile {
  name: string;
  group: string;
  team: string;
}

export interface ProtocolSignal {
  key: string; // службова назва (стандартна)
  code: string; // умовне позначення, яке вигадує команда
  form: string; // форма передачі: текст / емодзі / колір / жест / звук
  meaning: string; // що саме означає та як реагувати
}

export interface Protocol {
  teamName: string;
  members: string[];
  roles: Record<string, string>; // roleKey -> member
  signals: ProtocolSignal[];
  template: string;
  rules: string[];
  backupChannel: string;
  backupTrigger: string;
  backupCheck: string;
  savedAt: number | null;
}

export interface TimerState {
  label: string;
  duration: number; // seconds
  endAt: number | null; // epoch ms, коли таймер працює
  remaining: number; // seconds, коли таймер на паузі
}

export interface ExportedResult {
  app: 'operation-yedynyi-kanal';
  v: 1;
  exportedAt: number;
  profile: Profile;
  modules: Record<ScoredModule, number>;
  total: number;
  decisions: { task: string; label: string; ok: boolean }[];
  protocol: Protocol | null;
  reflection: Record<string, string>;
}

export interface AppState {
  v: 3;
  role: 'student' | 'teacher' | null;
  demo: boolean;
  started: boolean;
  profile: Profile;
  current: ModuleId;
  answers: Record<string, unknown>;
  results: Record<string, TaskResult>;
  manual: Record<string, Partial<Record<ScoredModule, number>>>;
  showAnswers: boolean;
  pacing: 'free' | 'teacher';
  openedUpTo: number;
  simRevealed: number;
  timer: TimerState;
  card: string | null;
  imported: ExportedResult[];
  protocol: Protocol;
}
