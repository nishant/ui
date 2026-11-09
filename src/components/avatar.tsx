'use client';
import {
  Children,
  createContext,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { safeUrl } from '../url';
import { StatusDot, type StatusTone } from './display';
import { useStrings } from './provider';
import { AVATAR_STRINGS } from './strings';
import { HUES, avatarHueIndex, avatarInitials } from './avatar-classes';

export { avatarHueIndex, avatarInitials };

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

const SIZE: Record<AvatarSize, string> = {
  xs: 'size-6 text-3xs',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
};

const DOT_SIZE: Record<AvatarSize, 'xs' | 'sm' | 'md'> = { xs: 'xs', sm: 'xs', md: 'sm', lg: 'sm', xl: 'md' };

interface GroupDefaults {
  size?: AvatarSize;
  shape?: AvatarShape;
}
const GroupContext = /* @__PURE__ */ createContext<GroupDefaults | null>(null);

export interface AvatarProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Image URL. Unsafe URLs (javascript:, data:) are ignored and the initials show. */
  src?: string | null;
  /** The person or thing. Gives the initials and the color, and is the default alt text. */
  name?: string;
  /** Alt text for the image. Default: name. Pass an empty string when the name is written next to it. */
  alt?: string;
  /** xs 24px, sm 32px, md 40px (default), lg 48px, xl 64px. */
  size?: AvatarSize;
  /** circle (default) or square with rounded corners. */
  shape?: AvatarShape;
  /** A status dot at the bottom corner. Give it text elsewhere; color is never the only signal. */
  status?: StatusTone;
  /** What a screen reader hears for the status dot (for example "Online"). Without it the dot is hidden from
   *  assistive tech; it is always hidden when `alt=""`. */
  statusLabel?: string;
  /** The root element. */
  ref?: Ref<HTMLSpanElement>;
}

/** A person or entity: their image, or initials on a color taken from their name. */
export function Avatar({ src, name, alt, size, shape, status, statusLabel, className, ref, ...rest }: AvatarProps) {
  const group = useContext(GroupContext);
  const strings = useStrings(AVATAR_STRINGS);
  const resolvedSize = size ?? group?.size ?? 'md';
  const resolvedShape = shape ?? group?.shape ?? 'circle';
  const url = src ? safeUrl(src) : null;
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = url != null && failed !== url;
  const label = alt ?? name ?? strings.avatar;
  const decorative = alt === '';
  const initials = name ? avatarInitials(name) : '';
  const rounded = resolvedShape === 'circle' ? 'rounded-full' : 'rounded-lg';
  return (
    <span
      ref={ref}
      className={cn('relative inline-flex shrink-0 align-middle', SIZE[resolvedSize].split(' ')[0], className)}
      {...rest}
    >
      {showImage ? (
        <img
          src={url}
          alt={label}
          onError={() => setFailed(url)}
          className={cn('size-full object-cover', rounded)}
        />
      ) : (
        <span
          role={decorative ? undefined : 'img'}
          aria-label={decorative ? undefined : label}
          aria-hidden={decorative ? true : undefined}
          className={cn(
            'inline-flex size-full select-none items-center justify-center overflow-hidden font-semibold',
            'forced-colors:border forced-colors:border-[ButtonText]',
            rounded,
            SIZE[resolvedSize].split(' ')[1],
            name ? HUES[avatarHueIndex(name)] : 'bg-th-elevated text-th-hi2',
          )}
        >
          <span aria-hidden="true">{initials}</span>
        </span>
      )}
      {status ? (
        <StatusDot
          tone={status}
          size={DOT_SIZE[resolvedSize]}
          label={decorative ? undefined : statusLabel || undefined}
          className="absolute bottom-0 end-0 ring-2 ring-th-surface forced-colors:border forced-colors:border-[ButtonText]"
        />
      ) : null}
    </span>
  );
}

export interface AvatarGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** Avatars shown before the "+N" overflow badge. Default: all. */
  max?: number;
  /** Size for every avatar that does not set its own. Default md. */
  size?: AvatarSize;
  /** Shape for every avatar that does not set its own. */
  shape?: AvatarShape;
  /** The Avatars. */
  children?: ReactNode;
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
}

/** Overlapping avatars, with a "+N" badge for the ones past `max`. */
export function AvatarGroup({ max, size = 'md', shape = 'circle', children, className, ref, ...rest }: AvatarGroupProps) {
  const strings = useStrings(AVATAR_STRINGS);
  const items = Children.toArray(children);
  const limit = max != null && max >= 0 ? Math.floor(max) : items.length;
  const shown = items.slice(0, limit);
  const extra = items.length - shown.length;
  return (
    <GroupContext.Provider value={{ size, shape }}>
      <div ref={ref} role="group" className={cn('flex items-center', className)} {...rest}>
        {shown.map((child, i) => (
          <span key={i} className={cn('inline-flex ring-2 ring-th-surface', shape === 'circle' ? 'rounded-full' : 'rounded-lg', i > 0 && '-ms-2')}>
            {child}
          </span>
        ))}
        {extra > 0 ? (
          <span
            role="img"
            aria-label={strings.avatarMore(extra)}
            className={cn(
              '-ms-2 inline-flex shrink-0 items-center justify-center bg-th-overlay font-semibold tabular-nums text-th-hi2 ring-2 ring-th-surface',
              'forced-colors:border forced-colors:border-[ButtonText]',
              shape === 'circle' ? 'rounded-full' : 'rounded-lg',
              SIZE[size],
            )}
          >
            <span aria-hidden="true">+{extra}</span>
          </span>
        ) : null}
      </div>
    </GroupContext.Provider>
  );
}
