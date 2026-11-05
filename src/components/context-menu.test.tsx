import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "./context-menu";
import { MenuItem, MenuLabel } from "./overlay";
import { NishProvider } from "./provider";

let phone = false;

beforeEach(() => {
  phone = false;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("reduced-motion")
        ? true
        : query.includes("max-width")
          ? phone
          : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const flush = (ms = 5) =>
  act(async () => void (await new Promise((r) => setTimeout(r, ms))));

function Area(props: Partial<React.ComponentProps<typeof ContextMenu>> = {}) {
  return (
    <ContextMenu
      data-testid="area"
      menu={<MenuItem>Rename</MenuItem>}
      {...props}
    >
      <div data-id="a.pdf" tabIndex={0} data-testid="row">
        a.pdf
      </div>
      <input aria-label="name" />
    </ContextMenu>
  );
}

/** A pointer event that carries pointerType, dispatched straight at the element (works in every DOM). */
function pointer(type: string, el: Element, init: PointerEventInit = {}) {
  const ev = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  });
  act(() => void el.dispatchEvent(ev));
  return ev;
}

describe("ContextMenu", () => {
  it("takes ref, className and rest props on the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Area ref={ref} className="area-x" id="zone" />);
    const area = screen.getByTestId("area");
    expect(ref.current).toBe(area);
    expect(area.className).toContain("area-x");
    expect(area.className).toContain("[-webkit-touch-callout:none]");
    expect(area.id).toBe("zone");
    expect(area.getAttribute("data-state")).toBe("closed");
  });

  it("opens a menu named Actions on right-click at the pointer", async () => {
    render(<Area />);
    const row = screen.getByTestId("row");
    const ev = createEvent.contextMenu(row, { clientX: 40, clientY: 50 });
    fireEvent(row, ev);
    await flush();
    expect(ev.defaultPrevented).toBe(true);
    expect(screen.getByRole("menu", { name: "Actions" })).toBeTruthy();
    const anchor = document.querySelector<HTMLElement>(
      "[data-nish-context-anchor]",
    )!;
    expect(anchor.style.left).toBe("40px");
    expect(anchor.style.top).toBe("50px");
    expect(screen.getByTestId("area").getAttribute("data-state")).toBe("open");
  });

  it("names the menu from the provider string or menuLabel", async () => {
    const { unmount } = render(
      <NishProvider strings={{ contextMenu: "Aktionen" }}>
        <Area />
      </NishProvider>,
    );
    fireEvent.contextMenu(screen.getByTestId("row"));
    await flush();
    expect(screen.getByRole("menu", { name: "Aktionen" })).toBeTruthy();
    unmount();
    render(<Area menuLabel="File actions" />);
    fireEvent.contextMenu(screen.getByTestId("row"));
    await flush();
    expect(screen.getByRole("menu", { name: "File actions" })).toBeTruthy();
  });

  it("closes after a selection and reports onOpenChange(false)", async () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <Area
        onOpenChange={onOpenChange}
        menu={<MenuItem onSelect={onSelect}>Rename</MenuItem>}
      />,
    );
    fireEvent.contextMenu(screen.getByTestId("row"));
    await flush();
    expect(onOpenChange).toHaveBeenLastCalledWith(true, undefined);
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    await flush();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, undefined);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes on Escape with the reason escape", async () => {
    const onOpenChange = vi.fn();
    render(<Area onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("row"));
    await flush();
    act(() => void fireEvent.keyDown(document, { key: "Escape" }));
    await flush();
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "escape");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens from Shift+F10 and the ContextMenu key with the first item focused", async () => {
    render(
      <Area
        menu={
          <>
            <MenuItem>One</MenuItem>
            <MenuItem>Two</MenuItem>
          </>
        }
      />,
    );
    const row = screen.getByTestId("row");
    row.focus();
    const f10 = createEvent.keyDown(row, { key: "F10", shiftKey: true });
    fireEvent(row, f10);
    await flush();
    expect(f10.defaultPrevented).toBe(true);
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "One" }),
    );
    act(() => void fireEvent.keyDown(document, { key: "Escape" }));
    await flush();
    row.focus();
    fireEvent.keyDown(row, { key: "ContextMenu" });
    await flush();
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "One" }),
    );
  });

  it("opens on a long press, then swallows the click and the native contextmenu", async () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ContextMenu
        data-testid="area"
        menu={<MenuItem>Rename</MenuItem>}
        onOpenChange={onOpenChange}
      >
        <button data-testid="row" onClick={onClick}>
          go
        </button>
      </ContextMenu>,
    );
    const row = screen.getByTestId("row");
    pointer("pointerdown", row, {
      pointerType: "touch",
      clientX: 30,
      clientY: 60,
    });
    act(() => void vi.advanceTimersByTime(499));
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(onOpenChange).toHaveBeenCalledWith(true, undefined);
    const anchor = document.querySelector<HTMLElement>(
      "[data-nish-context-anchor]",
    )!;
    expect(anchor.style.left).toBe("30px");
    expect(anchor.style.top).toBe("60px");
    pointer("pointerup", row, { pointerType: "touch" });
    fireEvent.click(row);
    expect(onClick).not.toHaveBeenCalled();
    onOpenChange.mockClear();
    const native = createEvent.contextMenu(row, { clientX: 30, clientY: 60 });
    fireEvent(row, native);
    expect(native.defaultPrevented).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(900));
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not open when the finger moves 20px or lifts early", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Area onOpenChange={onOpenChange} />);
    const row = screen.getByTestId("row");
    pointer("pointerdown", row, {
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    });
    pointer("pointermove", row, {
      pointerType: "touch",
      clientX: 10,
      clientY: 30,
    });
    act(() => void vi.advanceTimersByTime(800));
    expect(onOpenChange).not.toHaveBeenCalled();
    pointer("pointerdown", row, {
      pointerType: "touch",
      clientX: 10,
      clientY: 10,
    });
    pointer("pointermove", row, {
      pointerType: "touch",
      clientX: 14,
      clientY: 13,
    });
    pointer("pointerup", row, { pointerType: "touch" });
    act(() => void vi.advanceTimersByTime(800));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("ignores mouse pointers for the long press", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<Area onOpenChange={onOpenChange} />);
    pointer("pointerdown", screen.getByTestId("row"), { pointerType: "mouse" });
    act(() => void vi.advanceTimersByTime(800));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("leaves the browser menu alone on inputs and Shift+right-click", async () => {
    render(<Area />);
    const input = createEvent.contextMenu(screen.getByLabelText("name"));
    fireEvent(screen.getByLabelText("name"), input);
    expect(input.defaultPrevented).toBe(false);
    const shift = createEvent.contextMenu(screen.getByTestId("row"), {
      shiftKey: true,
    });
    fireEvent(screen.getByTestId("row"), shift);
    expect(shift.defaultPrevented).toBe(false);
    await flush();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does nothing when disabled", async () => {
    const onContextMenu = vi.fn();
    render(<Area disabled onContextMenu={onContextMenu} />);
    const ev = createEvent.contextMenu(screen.getByTestId("row"));
    fireEvent(screen.getByTestId("row"), ev);
    await flush();
    expect(ev.defaultPrevented).toBe(false);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("passes the pressed element to a menu function and stays closed for null", async () => {
    const menu = vi.fn((target: Element) => {
      const id = target.closest<HTMLElement>("[data-id]")?.dataset.id;
      return id ? <MenuLabel>{id}</MenuLabel> : null;
    });
    render(
      <ContextMenu menu={menu}>
        <div data-id="a.pdf" data-testid="row">
          <span data-testid="inner">a</span>
        </div>
        <p data-testid="none">nothing</p>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("inner"));
    await flush();
    expect(menu).toHaveBeenCalledWith(screen.getByTestId("inner"));
    expect(screen.getByRole("menu").textContent).toContain("a.pdf");
    act(() => void fireEvent.keyDown(document, { key: "Escape" }));
    await flush();
    fireEvent.contextMenu(screen.getByTestId("none"));
    await flush();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("follows a controlled open and sits at the start-top corner when opened from code", async () => {
    const onOpenChange = vi.fn();
    render(<Area open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.contextMenu(screen.getByTestId("row"));
    await flush();
    expect(onOpenChange).toHaveBeenCalledWith(true, undefined);
    expect(screen.queryByRole("menu")).toBeNull();
    cleanup();
    const { rerender: again } = render(<Area open={false} />);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 200,
      right: 300,
      bottom: 400,
      width: 200,
      height: 200,
      x: 100,
      y: 200,
      toJSON: () => ({}),
    });
    again(<Area open onOpenChange={onOpenChange} />);
    await flush();
    expect(screen.getByRole("menu")).toBeTruthy();
    const anchor = document.querySelector<HTMLElement>(
      "[data-nish-context-anchor]",
    )!;
    expect(anchor.style.left).toBe("108px");
    expect(anchor.style.top).toBe("208px");
  });

  it("renders a bottom sheet titled Menu on a phone", async () => {
    phone = true;
    render(<Area />);
    fireEvent.contextMenu(screen.getByTestId("row"));
    await flush();
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeTruthy();
  });

  it("puts focus back on the row after closing", async () => {
    render(<Area />);
    const row = screen.getByTestId("row");
    row.focus();
    fireEvent.contextMenu(row, { clientX: 5, clientY: 5 });
    await flush();
    expect(screen.getByRole("menu")).toBeTruthy();
    act(() => void fireEvent.keyDown(document, { key: "Escape" }));
    await flush();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(row);
  });

  it("lets an inner ContextMenu win over an outer one", async () => {
    render(
      <ContextMenu menu={<MenuItem>Outer</MenuItem>}>
        <ContextMenu menu={<MenuItem>Inner</MenuItem>}>
          <span data-testid="deep">x</span>
        </ContextMenu>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("deep"));
    await flush();
    expect(screen.getAllByRole("menuitem").map((n) => n.textContent)).toEqual([
      "Inner",
    ]);
  });

  it("calls the user handlers first", () => {
    const onKeyDown = vi.fn();
    const onPointerDown = vi.fn();
    render(<Area onKeyDown={onKeyDown} onPointerDown={onPointerDown} />);
    fireEvent.keyDown(screen.getByTestId("row"), { key: "a" });
    pointer("pointerdown", screen.getByTestId("row"), { pointerType: "mouse" });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it("renders the children and a hidden anchor on the server", () => {
    const html = renderToString(<Area />);
    expect(html).toContain("a.pdf");
    expect(html).toContain("data-nish-context-anchor");
    expect(html).not.toContain('role="menu"');
  });
});
