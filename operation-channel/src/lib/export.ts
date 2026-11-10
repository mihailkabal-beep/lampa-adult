import type { AppState, ExportedResult, Protocol } from './types';
import { ROLE_KEYS, SIGNAL_KEYS, moduleScores, total } from './store';
import { MODULES, TASKS } from './config';

export function protocolToText(p: Protocol) {
  const lines: string[] = [];
  lines.push(`ПРОТОКОЛ ЗВ’ЯЗКУ КОМАНДИ «${p.teamName || '—'}»`);
  lines.push('');
  lines.push('СКЛАД КОМАНДИ: ' + (p.members.filter(Boolean).join(', ') || '—'));
  lines.push('');
  lines.push('РОЗПОДІЛ РОЛЕЙ:');
  for (const r of ROLE_KEYS) lines.push(`  • ${r.label}: ${p.roles[r.key] || '—'}`);
  lines.push('');
  lines.push('УМОВНІ СИГНАЛИ:');
  for (const s of p.signals) {
    const label = SIGNAL_KEYS.find((k) => k.key === s.key)?.label ?? s.key;
    lines.push(`  • ${label} → «${s.code || '—'}» (${s.form}). ${s.meaning}`);
  }
  lines.push('');
  lines.push('ШАБЛОН СТАНДАРТНОГО ПОВІДОМЛЕННЯ:');
  lines.push('  ' + (p.template || '—'));
  lines.push('');
  lines.push('ПРАВИЛА КОМУНІКАЦІЇ:');
  p.rules.filter((r) => r.trim()).forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
  lines.push('');
  lines.push(`РЕЗЕРВНИЙ КАНАЛ: ${p.backupChannel || '—'}`);
  lines.push(`  Коли переходимо: ${p.backupTrigger || '—'}`);
  lines.push(`  Як перевіряємо зв’язок: ${p.backupCheck || '—'}`);
  return lines.join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback нижче */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadFile(name: string, content: string, type = 'text/plain;charset=utf-8') {
  try {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/** Друк одного елемента (і «Зберегти як PDF» у діалозі друку браузера). */
export function printElement(el: HTMLElement | null) {
  if (!el) return;
  el.classList.add('print-area');
  const cleanup = () => {
    el.classList.remove('print-area');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 1500);
}

const TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia',
};

/** Латинська назва файлу: деякі браузери замінюють кириличні імена завантажень на «download». */
export function safeName(s: string) {
  const t = (s || 'result')
    .toLowerCase()
    .split('')
    .map((c) => TR[c] ?? c)
    .join('')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (t || 'result').slice(0, 40);
}

export function buildExport(state: AppState): ExportedResult {
  const modules = moduleScores(state);
  const decisions: ExportedResult['decisions'] = [];
  for (const [id, r] of Object.entries(state.results)) {
    for (const d of r.decisions) decisions.push({ task: TASKS[id]?.title ?? id, label: d.label, ok: d.ok });
  }
  const refl = (state.answers['m7.reflect'] as { text?: Record<string, string> } | undefined)?.text ?? {};
  return {
    app: 'operation-yedynyi-kanal',
    v: 1,
    exportedAt: Date.now(),
    profile: state.profile,
    modules,
    total: total(modules),
    decisions,
    protocol: state.results['m4.protocol'] || state.protocol.teamName ? state.protocol : null,
    reflection: refl,
  };
}

export function resultToText(e: ExportedResult) {
  const lines = [
    `ОПЕРАЦІЯ: ЄДИНИЙ КАНАЛ — результат`,
    `Учасник: ${e.profile.name || '—'} · група ${e.profile.group || '—'} · команда «${e.profile.team || '—'}»`,
    `Разом: ${e.total} / 100`,
    ...MODULES.filter((m) => m.max && m.id !== 'results').map((m) => `  ${m.short}: ${e.modules[m.id as keyof typeof e.modules] ?? 0} / ${m.max}`),
    `Правильних рішень: ${e.decisions.filter((d) => d.ok).length} з ${e.decisions.length}`,
  ];
  return lines.join('\n');
}

export function parseImported(text: string): ExportedResult | null {
  try {
    const o = JSON.parse(text) as ExportedResult;
    if (o?.app !== 'operation-yedynyi-kanal' || o.v !== 1 || typeof o.total !== 'number' || !o.profile || !o.modules) return null;
    return o;
  } catch {
    return null;
  }
}

export function participantKey(e: ExportedResult) {
  return `${e.profile.name}|${e.profile.group}|${e.profile.team}`.toLowerCase();
}
