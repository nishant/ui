'use client';
import { useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { safeUrl } from '../url';
import { ListRow } from './data';
import { Badge } from './primitives';
import { useStrings } from './provider';
import { MEDIA_STRINGS } from './strings';

// Media rows: a thumbnail, a two-line title, a meta line and status badges. Search results,
// folders, queues and "recent" chips share them. MediaRow composes ListRow.

export type MediaThumbShape = 'wide' | 'round' | 'square';
export type MediaThumbSize = 'sm' | 'md';

const THUMB_BOX: Record<MediaThumbShape, Record<MediaThumbSize, string>> = {
  wide: {
    sm: 'aspect-video w-16 rounded-[var(--nish-radius-sm)]',
    md: 'aspect-video w-[72px] min-[420px]:w-24 rounded-[var(--nish-radius-sm)]',
  },
  round: { sm: 'size-9 rounded-full', md: 'size-12 rounded-full' },
  square: { sm: 'size-9 rounded-[var(--nish-radius-sm)]', md: 'size-12 rounded-[var(--nish-radius-sm)]' },
};

export interface MediaThumbProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** The image URL. Relative, http(s) URLs load; javascript:, data: and other schemes show the fallback. */
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
  ref?: Ref<HTMLSpanElement>;
}

/** A thumbnail in a fixed box: 16:9, round or square, lazy-loaded, with a fallback fill. */
export function MediaThumb({ src, shape = 'wide', size = 'md', fallback, alt = '', className, ref, ...rest }: MediaThumbProps) {
  const url = safeUrl(src);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl !== null && failedUrl === url;
  const box = cn('relative block shrink-0 overflow-hidden bg-th-elevated', THUMB_BOX[shape][size], className);
  if (url && !failed) {
    return (
      <span {...rest} ref={ref} className={box}>
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
    <span {...rest} ref={ref} className={cn(box, 'flex items-center justify-center text-th-hi3 [&>svg]:size-5')} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      {fallback}
    </span>
  );
}

export interface MediaRowProps extends Omit<ComponentPropsWithoutRef<'li'>, 'title' | 'onClick' | 'children' | 'className'> {
  /** The image URL (relative or http(s); other schemes show the fallback). */
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
  /** The Live badge text. Default: the "live" string. */
  liveLabel?: string;
  /** The Offline badge text. Default: the "offlineBadge" string. */
  offlineLabel?: string;
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
  /** The wrapper element. */
  ref?: Ref<HTMLElement>;
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
  liveLabel,
  offlineLabel,
  badges,
  trailing,
  chevron,
  dense = false,
  compact = false,
  onClick,
  href,
  as,
  className,
  ref,
  ...rest
}: MediaRowProps) {
  const t = useStrings(MEDIA_STRINGS);
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
      {...rest}
      ref={ref}
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
                    {liveLabel ?? t.live}
                  </Badge>
                ) : live === false ? (
                  <Badge tone="neutral" size={badgeSize}>
                    {offlineLabel ?? t.offlineBadge}
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

export interface MediaChipProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'children' | 'type'> {
  /** The image URL (relative or http(s); other schemes show no image). */
  thumbnailUrl?: string;
  /** The label; truncates. */
  label: string;
  /** Called when the chip is pressed. */
  onClick: () => void;
  /** A second, never-truncated word after the label ("Bring back"). */
  action?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/** A pill button with a 16:9 thumbnail and a label, 44px tall: a recent item or a hidden pane to bring back. */
export function MediaChip({ thumbnailUrl, label, onClick, action, className, ref, ...rest }: MediaChipProps) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-11 max-w-full items-center gap-2 rounded-full border border-th-line bg-th-surface py-0 ps-1 pe-4 text-sm text-th-hi',
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
  const url = safeUrl(src);
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
