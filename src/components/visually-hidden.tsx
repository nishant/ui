import type { ComponentPropsWithoutRef, CSSProperties, Ref } from 'react';

const HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
};

export interface VisuallyHiddenProps extends ComponentPropsWithoutRef<'span'> {
  /** The element to render. Default span; use div for block content. */
  as?: 'span' | 'div';
  /** The root element. */
  ref?: Ref<HTMLElement>;
}

/** Text that screen readers read and sighted users do not see. Uses inline styles, so it works
 *  without Tailwind or any stylesheet. A `style` prop is merged after the hiding styles. */
export function VisuallyHidden({ as = 'span', style, ref, ...rest }: VisuallyHiddenProps) {
  const Tag = as as 'span';
  return <Tag ref={ref as Ref<HTMLSpanElement>} style={{ ...HIDDEN, ...style }} {...rest} />;
}
