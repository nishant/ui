// src/components/latest.ts
import { useEffect, useLayoutEffect, useRef } from "react";
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
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
