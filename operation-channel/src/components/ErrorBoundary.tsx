import { Component, type ReactNode } from 'react';
import { STORAGE_KEY } from '../lib/config';

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-lg p-6 pt-20 text-slate-200">
        <h1 className="text-2xl font-bold text-alert">Збій симуляції</h1>
        <p className="mt-3 text-sm">Сталася неочікувана помилка інтерфейсу. Спробуйте перезавантажити сторінку. Якщо не допомагає — скиньте збережені дані цього пристрою.</p>
        <pre className="mt-3 overflow-auto rounded-lg bg-ink-900 p-3 text-xs text-slate-400">{this.state.error.message}</pre>
        <div className="mt-4 flex gap-2">
          <button className="rounded-lg bg-signal px-4 py-2 font-semibold text-ink-950" onClick={() => window.location.reload()}>
            Перезавантажити
          </button>
          <button
            className="rounded-lg border border-alert px-4 py-2 font-semibold text-alert"
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            Скинути дані й перезавантажити
          </button>
        </div>
      </div>
    );
  }
}
