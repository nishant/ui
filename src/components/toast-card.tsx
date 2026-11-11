'use client';
import { useRef, type FocusEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '../cn';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from './icons';
import { useStrings } from './provider';
import { DISPLAY_STRINGS } from './strings';
import { dismissToast, pauseTimer, resumeTimer, type ToastItem, type ToastTone } from './toast-store';

const TONE: Record<ToastTone, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckCircleIcon size={15} className="text-th-ok" />,
    className: 'border-th-ok/35',
  },
  error: {
    icon: <AlertTriangleIcon size={15} className="text-th-loss" />,
    className: 'border-th-loss/40',
  },
  warn: {
    icon: <AlertTriangleIcon size={15} className="text-th-warn" />,
    className: 'border-th-warn/40',
  },
  info: {
    icon: <InfoIcon size={15} className="text-th-accent" />,
    className: 'border-th-line-strong',
  },
};

const SWIPE_DISMISS_FRACTION = 0.35;
const SWIPE_DISMISS_VELOCITY = 0.5; // px per ms
const SWIPE_SLOP = 8; // px before a touch counts as a swipe rather than a tap

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  velocity: number;
  active: boolean;
}

/** @internal */
export function ToastCard({ t }: { t: ToastItem }) {
  const strings = useStrings(DISPLAY_STRINGS);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const setOffset = (dx: number, width: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = dx === 0 ? '' : `translateX(${dx}px)`;
    el.style.opacity = dx === 0 ? '' : String(Math.max(0, 1 - Math.abs(dx) / width));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || drag.current) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      active: false,
    };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.active) {
      if (Math.abs(dx) < SWIPE_SLOP || Math.abs(dx) < Math.abs(e.clientY - d.startY)) return;
      d.active = true;
      el.setPointerCapture(e.pointerId);
      pauseTimer(t.id);
    }
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    setOffset(dx, el.offsetWidth);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (d && d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (!d || !el || !d.active) return;
    const dx = e.clientX - d.startX;
    const width = el.offsetWidth;
    const flung = Math.abs(d.velocity) > SWIPE_DISMISS_VELOCITY && Math.sign(d.velocity) === Math.sign(dx);
    if (Math.abs(dx) > width * SWIPE_DISMISS_FRACTION || flung) {
      dismissToast(t.id);
      return;
    }
    el.style.transition = 'transform 160ms var(--nish-ease-out), opacity 160ms var(--nish-ease-out)';
    setOffset(0, width);
    window.setTimeout(() => {
      if (ref.current) ref.current.style.transition = '';
    }, 180);
    resumeTimer(t.id);
  };
  const onCancel = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d && d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (!d?.active) return;
    setOffset(0, ref.current?.offsetWidth || 1);
    resumeTimer(t.id);
  };

  const leave = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resumeTimer(t.id);
  };
  const enter = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pauseTimer(t.id);
  };
  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
      // Mouse only: a tap fires enter with no leave, which would pin the toast forever.
      onPointerEnter={(e) => e.pointerType === 'mouse' && pauseTimer(t.id)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && resumeTimer(t.id)}
      onFocus={enter}
      onBlur={leave}
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border bg-th-elevated px-3.5 py-3 shadow-pop',
        'touch-pan-y animate-[nish-rise-in_160ms_var(--nish-ease-out)]',
        'max-sm:[html[data-nish-layer-open]_&]:animate-[nish-toast-in-top_200ms_var(--nish-ease-out)]',
        TONE[t.tone].className,
      )}
    >
      <span className="mt-0.5 shrink-0">{TONE[t.tone].icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-th-hi">{t.title}</p>
        {t.body ? <p className="mt-0.5 break-words text-xs leading-snug text-th-hi2">{t.body}</p> : null}
      </div>
      {t.action ? (
        <button
          type="button"
          onClick={() => {
            t.action?.onClick();
            dismissToast(t.id);
          }}
          className="-my-1 inline-flex shrink-0 items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-th-accent transition-colors hover:bg-th-accent-soft pointer-coarse:-my-2.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        >
          {t.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => dismissToast(t.id)}
        aria-label={strings.dismiss}
        className="-m-1 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:-my-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
