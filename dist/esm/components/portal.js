"use client";

// src/components/portal.tsx
import { createPortal } from "react-dom";
import { useIsClient } from "./client.js";
import { useNishContext } from "./provider.js";
function Portal({ children, container }) {
  const isClient = useIsClient();
  const config = useNishContext();
  if (!isClient) return null;
  const target = container ?? config.portalContainer ?? document.body;
  return createPortal(children, target);
}
export {
  Portal
};
