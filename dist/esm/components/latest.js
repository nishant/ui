"use client";

// src/components/latest.ts
import { useRef } from "react";
import { useIsoLayoutEffect } from "./client.js";
function useLatest(value) {
  const ref = useRef(value);
  useIsoLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
export {
  useLatest
};
