// The problem rules for tools/visual-check.mjs, kept pure so they can be tested.
// visual-check.mjs and the fold-diff consumers depend on these exact strings
// and their order: do not reword them without updating every consumer.

export function problemsOf(shot, { isMobile }) {
  const contrast = shot.axe?.find((v) => v.rule === 'color-contrast');
  const problems = [
    shot.error && `load: ${shot.error}`,
    shot.pageOverflow && `page scrolls sideways (${shot.scrollWidth}px wide)`,
    ...(shot.overflowing ?? []).map((o) => `past right edge: ${o}`),
    ...(shot.innerScrollers ?? []).map((o) => `app scroller scrolls sideways: ${o}`),
    ...(shot.clipped ?? []).map((c) => `clipped text: ${c}`),
    contrast && `contrast: ${contrast.count} element(s), e.g. ${contrast.examples[0]}`,
    ...(shot.consoleErrors ?? []).map((c) => `console: ${c}`),
    ...(shot.focusMissing ?? []).map((f) => `no focus ring: ${f}`),
    shot.file && shot.bytes <= 0 && `screenshot ${shot.file} is ${shot.bytes < 0 ? 'missing' : 'empty'}`,
    !shot.file && !shot.error && 'no screenshot taken',
  ].filter(Boolean);
  // target-size is reported but only fails on phones, where it matters.
  const tap = shot.axe?.find((v) => v.rule === 'target-size');
  if (tap && isMobile) problems.push(`small tap targets: ${tap.count}, e.g. ${tap.examples[0]}`);
  return problems;
}
