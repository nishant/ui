'use client';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIsClient } from './client';
import { useNishContext } from './provider';

export interface PortalProps {
  children: ReactNode;
  /** Target element. Default: the provider's portalContainer, then document.body. */
  container?: HTMLElement | null;
}

/** Renders children into `container`. Null on the server and in the first client render, so
 *  hydration matches; the portal mounts right after. */
export function Portal({ children, container }: PortalProps) {
  const isClient = useIsClient();
  const config = useNishContext();
  if (!isClient) return null;
  const target = container ?? config.portalContainer ?? document.body;
  return createPortal(children, target);
}
