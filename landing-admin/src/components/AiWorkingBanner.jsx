import { useEffect, useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';

const STEP_SCHEDULE_MS = [
  { afterMs: 0, key: 'ai.status.preparing' },
  { afterMs: 1500, key: 'ai.status.connecting' },
  { afterMs: 5000, key: 'ai.status.generating' },
  { afterMs: 14000, key: 'ai.status.fallback' },
  { afterMs: 28000, key: 'ai.status.stillWorking' },
];

/**
 * Inline alert that shows what LeftSide AI is doing while a request is in flight.
 */
export default function AiWorkingBanner({
  active = false,
  taskLabel = '',
  className = '',
}) {
  const { t } = useLocale();
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!active) {
      setStartedAt(0);
      setNow(0);
      return undefined;
    }
    const start = Date.now();
    setStartedAt(start);
    setNow(start);
    const timer = window.setInterval(() => setNow(Date.now()), 700);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) return null;

  const elapsed = Math.max(0, now - startedAt);
  let statusKey = STEP_SCHEDULE_MS[0].key;
  for (const step of STEP_SCHEDULE_MS) {
    if (elapsed >= step.afterMs) statusKey = step.key;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] text-indigo-900 ${className}`}
    >
      <span
        className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700"
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold leading-snug">
          {taskLabel || t('ai.generating')}
        </p>
        <p className="text-indigo-700/90 leading-snug">
          {t(statusKey)}
        </p>
      </div>
    </div>
  );
}
