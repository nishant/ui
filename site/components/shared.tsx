// Small helpers several component docs pages share.
import { type ReactNode } from 'react';
import { Label } from '../../src';
import { BellIcon, PinIcon, RefreshIcon, SettingsIcon, TrashIcon } from '../lib/icons';

export const ICONS: Record<string, (p: { size?: number }) => ReactNode> = {
  refresh: RefreshIcon,
  pin: PinIcon,
  settings: SettingsIcon,
  bell: BellIcon,
  trash: TrashIcon,
};

export const Row = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>
);

export const Field = ({ label, children, hint, error, id }: { label: string; children: ReactNode; hint?: string; error?: string; id?: string }) => (
  <div className="grid w-full gap-1.5">
    <label className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
    {error ? (
      <span id={id} className="text-xs text-th-loss">
        {error}
      </span>
    ) : hint ? (
      <span id={id} className="text-xs text-th-hi3">
        {hint}
      </span>
    ) : null}
  </div>
);
