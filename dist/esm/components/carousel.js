"use client";

// src/components/carousel.tsx
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { CAROUSEL_MAX_DOTS, CAROUSEL_MIN_INTERVAL, nearestSlide, stepIndex } from "./carousel-classes.js";
import { useMediaQuery } from "./hooks.js";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "./icons.js";
import { IconButton } from "./primitives.js";
import { useStrings } from "./provider.js";
import { CAROUSEL_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
var SETTLE_MS = 700;
function Carousel({
  "aria-label": ariaLabel,
  children,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  slideWidth = "100%",
  loop = false,
  autoPlay,
  indicators,
  slideLabel,
  previousLabel,
  nextLabel,
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...rest
}) {
  const strings = useStrings(CAROUSEL_STRINGS);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const slides = Children.toArray(children);
  const count = slides.length;
  const label = slideLabel ?? strings.slideLabel;
  const prevName = previousLabel ?? strings.previousSlide;
  const nextName = nextLabel ?? strings.nextSlide;
  const [ownIndex, setOwnIndex] = useState(defaultIndex);
  const index = count === 0 ? 0 : Math.min(Math.max(indexProp ?? ownIndex, 0), count - 1);
  const canPrev = loop || index > 0;
  const canNext = loop || index < count - 1;
  const coarse = useMediaQuery("(pointer: coarse)");
  const [slotWidth, setSlotWidth] = useState(0);
  const dotsFit = slotWidth === 0 || count * (coarse ? 44 : 32) <= slotWidth;
  const showDots = indicators ?? (count <= CAROUSEL_MAX_DOTS && dotsFit);
  const [announce, setAnnounce] = useState("");
  const trackRef = useRef(null);
  const indexRef = useRef(index);
  const viewRef = useRef(0);
  const targetRef = useRef(null);
  const frameRef = useRef(0);
  const slotCleanup = useRef(null);
  const latest = useRef({ onIndexChange, reduced, label, count });
  useIsoLayoutEffect(() => {
    latest.current = { onIndexChange, reduced, label, count };
    indexRef.current = index;
  });
  const [hovered, setHovered] = useState(false);
  const [focusedIn, setFocusedIn] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [playState, setPlayState] = useState("auto");
  const playing = playState === "on" || playState === "auto" && !reduced;
  const paused = hovered || focusedIn || hidden;
  const interval = Math.max(autoPlay ?? 0, CAROUSEL_MIN_INTERVAL);
  const rotating = !!autoPlay && count > 1 && playing && !paused;
  const setCurrent = useCallback((i) => {
    if (i === indexRef.current) return;
    indexRef.current = i;
    setOwnIndex(i);
    latest.current.onIndexChange?.(i);
  }, []);
  const scrollToSlide = useCallback((i, behavior) => {
    viewRef.current = i;
    targetRef.current = { index: i, at: Date.now() };
    const el = trackRef.current?.children[i];
    el?.scrollIntoView({ behavior, block: "nearest", inline: "start" });
  }, []);
  const goTo = useCallback(
    (i) => {
      setCurrent(i);
      setAnnounce(latest.current.label(i + 1, latest.current.count));
      scrollToSlide(i, latest.current.reduced ? "auto" : "smooth");
    },
    [setCurrent, scrollToSlide]
  );
  const goToRef = useRef(goTo);
  useIsoLayoutEffect(() => {
    goToRef.current = goTo;
  });
  const mounted = useRef(false);
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (count === 0 || index === viewRef.current) return;
    scrollToSlide(index, first || latest.current.reduced ? "auto" : "smooth");
  }, [index, count, scrollToSlide]);
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rtl = isRtl(track);
    const edge = (el) => {
      const r = el.getBoundingClientRect();
      return rtl ? r.right : r.left;
    };
    const n = nearestSlide(Array.from(track.children, edge), edge(track));
    if (n < 0) return;
    const target = targetRef.current;
    if (target) {
      if (n === target.index) targetRef.current = null;
      else if (Date.now() - target.at < SETTLE_MS) return;
      else targetRef.current = null;
    }
    viewRef.current = n;
    setCurrent(n);
  }, [setCurrent]);
  const onScroll = () => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      measure();
    });
  };
  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );
  const setFromFocus = useCallback(
    (i) => {
      viewRef.current = i;
      targetRef.current = { index: i, at: Date.now() };
      setCurrent(i);
    },
    [setCurrent]
  );
  const onTrackKey = (e) => {
    if (e.target !== e.currentTarget || count < 2) return;
    const rtl = isRtl(e.currentTarget);
    let to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const forward = e.key === "ArrowRight" !== rtl;
      if (forward ? canNext : canPrev) to = stepIndex(index, forward ? 1 : -1, count, loop);
    } else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = count - 1;
    else return;
    e.preventDefault();
    if (to !== null) goTo(to);
  };
  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  useEffect(() => {
    if (!rotating) return;
    const id = setTimeout(() => goToRef.current(index === count - 1 ? 0 : index + 1), interval);
    return () => clearTimeout(id);
  }, [rotating, index, count, interval]);
  const empty = count === 0;
  const tooFast = autoPlay !== void 0 && autoPlay > 0 && autoPlay < CAROUSEL_MIN_INTERVAL;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && empty) console.warn("Carousel: no slides");
  }, [empty]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && tooFast) {
      console.warn(`Carousel: autoPlay must be at least ${CAROUSEL_MIN_INTERVAL} ms; using ${CAROUSEL_MIN_INTERVAL}.`);
    }
  }, [tooFast]);
  const handlePointerEnter = (e) => {
    setHovered(true);
    onPointerEnter?.(e);
  };
  const handlePointerLeave = (e) => {
    setHovered(false);
    onPointerLeave?.(e);
  };
  const handleFocus = (e) => {
    setFocusedIn(true);
    onFocus?.(e);
  };
  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setFocusedIn(false);
    onBlur?.(e);
  };
  const slotRef = useCallback((el) => {
    slotCleanup.current?.();
    slotCleanup.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setSlotWidth(el.clientWidth));
    ro.observe(el);
    setSlotWidth(el.clientWidth);
    slotCleanup.current = () => ro.disconnect();
  }, []);
  const togglePlay = () => setPlayState(playing ? "off" : "on");
  const arrowClass = "aria-disabled:cursor-not-allowed aria-disabled:opacity-40";
  return /* @__PURE__ */ jsxs(
    "section",
    {
      ...rest,
      ref,
      "aria-roledescription": strings.carouselRole,
      "aria-label": ariaLabel,
      "data-state": rotating ? "active" : "inactive",
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      className: cn("flex w-full min-w-0 flex-col gap-2", className),
      children: [
        /* @__PURE__ */ jsx("div", { "aria-live": rotating ? "off" : "polite", "aria-atomic": "true", className: "sr-only", children: announce }),
        /* @__PURE__ */ jsxs("div", { className: "relative min-w-0", children: [
          autoPlay && count > 1 ? /* @__PURE__ */ jsx(
            IconButton,
            {
              label: playing ? strings.stopRotation : strings.startRotation,
              size: "sm",
              variant: "subtle",
              onClick: togglePlay,
              className: "absolute end-2 top-2 z-[1] rounded-full shadow-pop",
              children: playing ? /* @__PURE__ */ jsx(PauseIcon, {}) : /* @__PURE__ */ jsx(PlayIcon, {})
            }
          ) : null,
          /* @__PURE__ */ jsx(
            "div",
            {
              ref: trackRef,
              tabIndex: 0,
              role: "group",
              "aria-label": ariaLabel,
              onKeyDown: onTrackKey,
              onScroll,
              className: "flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              children: slides.map((child, i) => /* @__PURE__ */ jsx(
                "div",
                {
                  role: "group",
                  "aria-roledescription": strings.slideRole,
                  "aria-label": label(i + 1, count),
                  "data-index": i,
                  "data-state": i === index ? "active" : "inactive",
                  onFocus: () => setFromFocus(i),
                  className: "min-w-0 shrink-0 snap-start",
                  style: { width: slideWidth },
                  children: child
                },
                i
              ))
            }
          )
        ] }),
        count > 1 ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            IconButton,
            {
              label: prevName,
              size: "sm",
              "aria-disabled": !canPrev || void 0,
              onClick: () => canPrev && goTo(stepIndex(index, -1, count, loop)),
              className: arrowClass,
              children: /* @__PURE__ */ jsx(ChevronLeftIcon, { className: "rtl:-scale-x-100" })
            }
          ),
          /* @__PURE__ */ jsx("div", { ref: slotRef, className: "flex min-w-0 flex-1 justify-center", children: showDots ? /* @__PURE__ */ jsx("div", { role: "group", "aria-label": strings.slidePicker, className: "flex", children: slides.map((_, i) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              "aria-label": strings.goToSlide(i + 1),
              "aria-current": i === index ? "true" : void 0,
              onClick: () => goTo(i),
              className: "flex size-8 items-center justify-center rounded-full min-w-0 pointer-coarse:size-11",
              children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "size-2 rounded-full transition-colors",
                    i === index ? "bg-th-accent forced-colors:bg-[Highlight]" : "bg-th-line-strong forced-colors:bg-[ButtonText]"
                  )
                }
              )
            },
            i
          )) }) : /* @__PURE__ */ jsxs("span", { className: "text-xs tabular-nums text-th-hi3", "aria-hidden": "true", children: [
            index + 1,
            " / ",
            count
          ] }) }),
          /* @__PURE__ */ jsx(
            IconButton,
            {
              label: nextName,
              size: "sm",
              "aria-disabled": !canNext || void 0,
              onClick: () => canNext && goTo(stepIndex(index, 1, count, loop)),
              className: arrowClass,
              children: /* @__PURE__ */ jsx(ChevronRightIcon, { className: "rtl:-scale-x-100" })
            }
          )
        ] }) : null
      ]
    }
  );
}
export {
  Carousel
};
