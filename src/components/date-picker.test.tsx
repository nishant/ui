import { createRef, useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "./date-picker";
import { Field } from "./forms";
import { NishProvider } from "./provider";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 5));
  });

const input = () => screen.getByRole("textbox") as HTMLInputElement;
const day = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const typeAndBlur = (text: string) => {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.blur(input());
};

function Controlled({
  onValueChange,
  initial = null,
  ...props
}: {
  onValueChange?: (v: string | null) => void;
  initial?: string | null;
  min?: string;
  max?: string;
}) {
  const [v, setV] = useState<string | null>(initial);
  return (
    <DatePicker
      aria-label="Due"
      value={v}
      onValueChange={(next) => {
        setV(next);
        onValueChange?.(next);
      }}
      locale="en-US"
      {...props}
    />
  );
}

describe("DatePicker structure", () => {
  it("puts ref on the input, className and rest on the wrapper", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <DatePicker
        ref={ref}
        aria-label="Due"
        className="extra"
        data-x="1"
        locale="en-US"
      />,
    );
    expect(ref.current).toBe(input());
    const wrapper = input().parentElement!;
    expect(wrapper.classList.contains("extra")).toBe(true);
    expect(wrapper.getAttribute("data-x")).toBe("1");
    expect(wrapper.getAttribute("data-state")).toBe("closed");
  });

  it("passes id and aria-describedby to the input", () => {
    render(
      <>
        <DatePicker id="due" aria-describedby="help" aria-label="Due" />
        <p id="help">Help</p>
      </>,
    );
    expect(input().id).toBe("due");
    expect(input().getAttribute("aria-describedby")).toBe("help");
  });

  it("is reached by a Field label", () => {
    render(
      <Field label="Due date">
        <DatePicker locale="en-US" />
      </Field>,
    );
    expect(screen.getByLabelText("Due date")).toBe(input());
  });

  it("shows the locale pattern as the placeholder", () => {
    const { unmount } = render(<DatePicker aria-label="a" locale="en-US" />);
    expect(input().placeholder).toBe("MM/DD/YYYY");
    unmount();
    render(<DatePicker aria-label="a" locale="de-DE" />);
    expect(input().placeholder).toBe("DD.MM.YYYY");
  });

  it("disables both the input and the button", () => {
    render(<DatePicker aria-label="Due" disabled />);
    expect(input().disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Choose date" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});

describe("DatePicker typing", () => {
  it("commits a typed date on blur and formats it", () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    typeAndBlur("11/5/2026");
    expect(spy).toHaveBeenCalledWith("2026-11-05");
    expect(input().value).toBe("11/05/2026");
    expect(input().hasAttribute("aria-invalid")).toBe(false);
  });

  it("marks an unreadable date invalid and keeps the text", () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} />);
    typeAndBlur("13/40/2026");
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().value).toBe("13/40/2026");
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses a date after max", () => {
    const spy = vi.fn();
    render(<Controlled onValueChange={spy} max="2026-12-01" />);
    typeAndBlur("12/02/2026");
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses a date the isDateDisabled callback rejects", () => {
    const spy = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        locale="en-US"
        onValueChange={spy}
        isDateDisabled={(d) => d === "2026-11-05"}
      />,
    );
    typeAndBlur("11/05/2026");
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(spy).not.toHaveBeenCalled();
  });

  it("clears with null when the text is emptied", () => {
    const spy = vi.fn();
    render(<Controlled initial="2026-11-05" onValueChange={spy} />);
    expect(input().value).toBe("11/05/2026");
    typeAndBlur("");
    expect(spy).toHaveBeenCalledWith(null);
    expect(input().value).toBe("");
  });

  it("accepts ISO in any locale", () => {
    const spy = vi.fn();
    render(<DatePicker aria-label="Due" locale="de-DE" onValueChange={spy} />);
    typeAndBlur("2026-11-05");
    expect(spy).toHaveBeenCalledWith("2026-11-05");
    expect(input().value).toBe("05.11.2026");
  });

  it("commits on Enter while dirty and keeps the form from submitting", () => {
    const spy = vi.fn();
    const submit = vi.fn();
    render(
      <form onSubmit={submit}>
        <Controlled onValueChange={spy} />
      </form>,
    );
    fireEvent.change(input(), { target: { value: "11/05/2026" } });
    const notPrevented = fireEvent.keyDown(input(), { key: "Enter" });
    expect(notPrevented).toBe(false);
    expect(spy).toHaveBeenCalledWith("2026-11-05");
    expect(submit).not.toHaveBeenCalled();
  });

  it("lets Enter through when the text is not dirty", () => {
    render(<Controlled initial="2026-11-05" />);
    expect(fireEvent.keyDown(input(), { key: "Enter" })).toBe(true);
  });

  it("restores the formatted value on Escape while dirty", () => {
    const parent = vi.fn();
    render(
      <div onKeyDown={parent}>
        <Controlled initial="2026-11-05" />
      </div>,
    );
    fireEvent.change(input(), { target: { value: "garbage" } });
    expect(input().value).toBe("garbage");
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(input().value).toBe("11/05/2026");
    expect(parent).not.toHaveBeenCalled();
  });
});

describe("DatePicker calendar", () => {
  it("opens a dialog named Choose date from the button", async () => {
    render(<Controlled />);
    const button = screen.getByRole("button", { name: "Choose date" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    await settle();
    expect(screen.getByRole("dialog", { name: "Choose date" })).toBeTruthy();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("opens with Alt+ArrowDown from the input", async () => {
    render(<Controlled />);
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(input(), { key: "ArrowDown", altKey: true });
    await settle();
    expect(screen.getByRole("dialog", { name: "Choose date" })).toBeTruthy();
  });

  it("commits a clicked day, closes and focuses the button", async () => {
    const spy = vi.fn();
    render(<Controlled initial="2026-11-05" onValueChange={spy} />);
    const button = screen.getByRole("button", {
      name: "Change date, Thursday, November 5, 2026",
    });
    fireEvent.click(button);
    await settle();
    expect(document.activeElement).toBe(day("2026-11-05"));
    fireEvent.click(day("2026-11-12"));
    await settle();
    expect(spy).toHaveBeenCalledWith("2026-11-12");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(input().value).toBe("11/12/2026");
    expect(document.activeElement).toBe(button);
  });

  it("names the button after the date once set", () => {
    render(<Controlled initial="2026-11-05" />);
    expect(
      screen.getByRole("button", {
        name: "Change date, Thursday, November 5, 2026",
      }),
    ).toBeTruthy();
  });

  it("lets calendarLabel win over the default name", () => {
    render(<DatePicker aria-label="Due" calendarLabel="Pick a day" />);
    expect(screen.getByRole("button", { name: "Pick a day" })).toBeTruthy();
  });

  it("takes strings from a provider", () => {
    render(
      <NishProvider strings={{ chooseDate: "Datum wählen" }}>
        <DatePicker aria-label="Due" />
      </NishProvider>,
    );
    expect(screen.getByRole("button", { name: "Datum wählen" })).toBeTruthy();
  });

  it("takes the placeholder tokens from a provider", () => {
    render(
      <NishProvider
        strings={{ dayToken: "TT", monthToken: "MM", yearToken: "JJJJ" }}
      >
        <DatePicker aria-label="Due" locale="de-DE" />
      </NishProvider>,
    );
    expect(input().placeholder).toBe("TT.MM.JJJJ");
  });
});

describe("DatePicker form use", () => {
  it("posts the ISO value in a hidden input", () => {
    const { container } = render(
      <form>
        <DatePicker aria-label="Due" name="due" defaultValue="2026-11-05" />
      </form>,
    );
    const hidden = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="due"]',
    )!;
    expect(hidden.value).toBe("2026-11-05");
    expect(new FormData(container.querySelector("form")!).get("due")).toBe(
      "2026-11-05",
    );
  });

  it("posts nothing extra without a name", () => {
    const { container } = render(<DatePicker aria-label="Due" />);
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });

  it("returns to defaultValue when the form resets", () => {
    const { container } = render(
      <form>
        <DatePicker
          aria-label="Due"
          name="due"
          locale="en-US"
          defaultValue="2026-11-05"
        />
      </form>,
    );
    typeAndBlur("12/25/2026");
    expect(input().value).toBe("12/25/2026");
    act(() => {
      container.querySelector("form")!.dispatchEvent(new Event("reset"));
    });
    expect(input().value).toBe("11/05/2026");
  });

  it("marks the input required", () => {
    render(<DatePicker aria-label="Due" required />);
    expect(input().required).toBe(true);
    expect(input().getAttribute("aria-required")).toBe("true");
  });

  it("honors invalid and aria-invalid from outside", () => {
    const { unmount } = render(<DatePicker aria-label="Due" invalid />);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    unmount();
    render(<DatePicker aria-label="Due" aria-invalid="true" />);
    expect(input().getAttribute("aria-invalid")).toBe("true");
  });
});
