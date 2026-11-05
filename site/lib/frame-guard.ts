/** A preview frame must not pull focus out of the page around it (Modal focuses its
 *  panel on mount). Focus calls go through only once someone is using the frame. */
export function guardFrameFocus(): void {
  const focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (this: HTMLElement, opts?: FocusOptions) {
    if (document.hasFocus()) focus.call(this, opts);
  };
}
