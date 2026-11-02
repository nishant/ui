import { useState, type ReactNode } from 'react';
import { cn } from '../cn';
import { ListRow } from './data';
import { Badge } from './primitives';

// Media rows: a thumbnail, a two-line title, a meta line and status badges. Search results,
// folders, queues and "recent" chips share them. MediaRow composes ListRow.

export type MediaThumbShape = 'wide' | 'round' | 'square';
export type MediaThumbSize = 'sm' | 'md';

/** Only https and relative sources load. Anything else (http, data, javascript, protocol-relative) shows the fallback. */
function safeSrc(src: string | undefined): string | null {
  if (!src) return null;
  // Browsers drop tabs and newlines and read a backslash as a slash, so normalize before checking.
  const s = src.trim().replace(/[\t\n\r]/g, '').replace(/\\/g, '/');
  if (!s || s.startsWith('//')) return null;
  if (/^https:\/\//i.test(s)) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  return s;
}

const THUMB_BOX: Record<MediaThumbShape, Record<MediaThumbSize, string>> = {
  wide: {
    sm: 'aspect-video w-16 rounded-[var(--nish-radius-sm)]',
    md: 'aspect-video w-[72px] min-[420px]:w-24 rounded-[var(--nish-radius-sm)]',
  },
  round: { sm: 'size-9 rounded-full', md: 'size-12 rounded-full' },
  square: { sm: 'size-9 rounded-[var(--nish-radius-sm)]', md: 'size-12 rounded-[var(--nish-radius-sm)]' },
};

export interface MediaThumbProps {
  /** The image URL. Only https and relative URLs load; anything else shows the fallback. */
  src?: string;
  /** wide: 16:9 (64x36, or 96x54 at md). round and square: 36px, or 48px at md. */
  shape?: MediaThumbShape;
  /** sm for dense lists, md otherwise. */
  size?: MediaThumbSize;
  /** Shown centered on a quiet fill when there is no usable image (an icon). */
  fallback?: ReactNode;
  /** Alternative text. Empty by default: the row's title already names the item. */
  alt?: string;
  className?: string;
}

/** A thumbnail in a fixed box: 16:9, round or square, lazy-loaded, with a fallback fill. */
export function MediaThumb({ src, shape = 'wide', size = 'md', fallback, alt = '', className }: MediaThumbProps) {
  const url = safeSrc(src);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl !== null && failedUrl === url;
  const box = cn('relative block shrink-0 overflow-hidden bg-th-elevated', THUMB_BOX[shape][size], className);
  if (url && !failed) {
    return (
      <span className={box}>
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailedUrl(url)}
          className="size-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className={cn(box, 'flex items-center justify-center text-th-hi3 [&>svg]:size-5')} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      {fallback}
    </span>
  );
}

export interface MediaRowProps {
  /** The image URL (https or relative only). */
  thumbnailUrl?: string;
  /** wide (16:9, default), round (channels) or square. */
  thumbShape?: MediaThumbShape;
  /** md by default; sm when `dense`. */
  thumbSize?: MediaThumbSize;
  /** An icon shown on the thumbnail's fill when there is no image. */
  fallback?: ReactNode;
  /** The title; wraps to two lines. */
  title: ReactNode;
  /** The line under the title: a channel, an author, a count. */
  meta?: ReactNode;
  /** A third, quieter line: a date, a view count. */
  detail?: ReactNode;
  /** true shows a Live badge, false an Offline badge, undefined none. */
  live?: boolean;
  /** Extra badges after the live one ("On screen"). */
  badges?: ReactNode;
  /** A control or element at the far right, after the badges. */
  trailing?: ReactNode;
  /** Shows a chevron. On by default for a link. */
  chevron?: boolean;
  /** A 44px-minimum row with a small thumbnail, for tiles and widgets. */
  dense?: boolean;
  /** Dense, with 11px title and 10px meta and detail text: for small widget tiles that use small type. */
  compact?: boolean;
  /** Makes the whole row a button. */
  onClick?: () => void;
  /** Makes the whole row a link. */
  href?: string;
  /** The wrapper element. Default 'li'; pass 'div' outside a list. */
  as?: 'li' | 'div';
  className?: string;
}

/** A result row: thumbnail, two-line title, meta and detail, with Live/Offline and other badges. */
export function MediaRow({
  thumbnailUrl,
  thumbShape = 'wide',
  thumbSize,
  fallback,
  title,
  meta,
  detail,
  live,
  badges,
  trailing,
  chevron,
  dense = false,
  compact = false,
  onClick,
  href,
  as,
  className,
}: MediaRowProps) {
  const small = dense || compact;
  const size = thumbSize ?? (small ? 'sm' : 'md');
  const badgeSize = small ? 'xs' : 'sm';
  const hasBadges = live !== undefined || !!badges;
  const subtitle =
    meta || detail ? (
      <>
        {meta ? <span className="block truncate">{meta}</span> : null}
        {detail ? <span className={cn('block truncate text-th-hi3', compact ? 'text-3xs' : 'text-xs')}>{detail}</span> : null}
      </>
    ) : undefined;
  return (
    <ListRow
      as={as}
      className={className}
      dense={dense}
      compact={compact}
      href={href}
      onClick={onClick}
      chevron={chevron}
      icon={<MediaThumb src={thumbnailUrl} shape={thumbShape} size={size} fallback={fallback} />}
      title={title}
      titleLines={2}
      subtitle={subtitle}
      trailing={
        hasBadges || trailing ? (
          <span className="flex items-center gap-2">
            {hasBadges ? (
              <span className="flex flex-col items-end gap-1">
                {live === true ? (
                  <Badge tone="loss" size={badgeSize}>
                    Live
                  </Badge>
                ) : live === false ? (
                  <Badge tone="neutral" size={badgeSize}>
                    Offline
                  </Badge>
                ) : null}
                {badges}
              </span>
            ) : null}
            {trailing}
          </span>
        ) : undefined
      }
    />
  );
}

export interface MediaChipProps {
  /** The image URL (https or relative only). */
  thumbnailUrl?: string;
  /** The label; truncates. */
  label: string;
  /** Called when the chip is pressed. */
  onClick: () => void;
  /** A second, never-truncated word after the label ("Bring back"). */
  action?: string;
  className?: string;
}

/** A pill button with a 16:9 thumbnail and a label, 44px tall: a recent item or a hidden pane to bring back. */
export function MediaChip({ thumbnailUrl, label, onClick, action, className }: MediaChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-11 max-w-full items-center gap-2 rounded-full border border-th-line bg-th-surface py-0 pl-1 pr-4 text-sm text-th-hi',
        'transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent',
        className,
      )}
    >
      <span className="block aspect-video w-10 shrink-0 overflow-hidden rounded-[var(--nish-radius-sm)] bg-th-elevated">
        <MediaChipImage src={thumbnailUrl} />
      </span>
      <span className="min-w-0 max-w-56 truncate">{label}</span>
      {action ? <span className="shrink-0 text-th-accent">{action}</span> : null}
    </button>
  );
}

function MediaChipImage({ src }: { src?: string }) {
  const url = safeSrc(src);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl !== null && failedUrl === url;
  if (!url || failed) return null;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setFailedUrl(url)}
      className="size-full object-cover"
    />
  );
}
