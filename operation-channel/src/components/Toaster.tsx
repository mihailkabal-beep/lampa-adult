import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

type T = { id: number; text: string; ok: boolean };

export function toast(text: string, ok = true) {
  window.dispatchEvent(new CustomEvent('op-toast', { detail: { text, ok } }));
}

export default function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ text: string; ok: boolean }>).detail;
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { id, ...d }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
    };
    window.addEventListener('op-toast', h);
    return () => window.removeEventListener('op-toast', h);
  }, []);
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`animate-rise flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-xl ${t.ok ? 'border-signal/60 bg-ink-800 text-signal' : 'border-alert/60 bg-ink-800 text-alert'}`}>
          {t.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span className="text-slate-100">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
