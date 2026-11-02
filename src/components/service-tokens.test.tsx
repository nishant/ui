import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceTokenView } from "../service-token-types";
import { ServiceTokensSection, useServiceTokens } from "./service-tokens";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const tok = (
  o: Partial<ServiceTokenView> & { id: string; name: string },
): ServiceTokenView => ({
  scopes: ["read"],
  created: "2026-10-30",
  source: "file",
  revoked: false,
  ...o,
});

const LIST: ServiceTokenView[] = [
  tok({
    id: "old",
    name: "Old client",
    revoked: true,
    revokedAt: "2026-11-01T18:00:00Z",
  }),
  tok({
    id: "mcp-handle",
    name: "nish MCP (handle)",
    scopes: ["read", "inbox:handle"],
  }),
  tok({ id: "env1", name: "Env token", source: "env" }),
  tok({ id: "mcp", name: "nish MCP" }),
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("ServiceTokensSection", () => {
  it("lists active tokens first by name, then revoked", () => {
    render(<ServiceTokensSection tokens={LIST} onRevoke={async () => {}} />);
    const names = screen
      .getAllByText(/^(Env token|nish MCP|nish MCP \(handle\)|Old client)$/)
      .map((n) => n.textContent);
    expect(names).toEqual([
      "Env token",
      "nish MCP",
      "nish MCP (handle)",
      "Old client",
    ]);
    expect(
      screen.getByText(
        "mcp-handle · read, inbox:handle · created Oct 30, 2026",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(/created Oct 30, 2026 · from SERVICE_TOKENS/),
    ).toBeTruthy();
  });

  it("shows a Revoked badge, no button, for a revoked token", () => {
    render(<ServiceTokensSection tokens={LIST} onRevoke={async () => {}} />);
    expect(
      screen.queryByRole("button", { name: "Revoke Old client" }),
    ).toBeNull();
    expect(screen.getByText("Revoked").getAttribute("title")).toMatch(
      /^Revoked Nov \d, 2026$/,
    );
    expect(screen.getAllByRole("button", { name: /^Revoke / })).toHaveLength(3);
  });

  it("opens a confirm dialog and calls onRevoke on confirm", async () => {
    const onRevoke = vi.fn().mockResolvedValue(undefined);
    render(<ServiceTokensSection tokens={LIST} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke nish MCP" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Revoke nish MCP?")).toBeTruthy();
    expect(within(dialog).getByText(/This cannot be undone/)).toBeTruthy();
    expect(onRevoke).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(onRevoke).toHaveBeenCalledWith("mcp"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("Cancel closes without revoking", () => {
    const onRevoke = vi.fn();
    render(<ServiceTokensSection tokens={LIST} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke nish MCP" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onRevoke).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the error when revoke fails", async () => {
    const onRevoke = vi.fn().mockRejectedValue(new Error("Boom"));
    render(<ServiceTokensSection tokens={LIST} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke nish MCP" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Revoke",
      }),
    );
    await waitFor(() =>
      expect(
        within(screen.getByRole("dialog")).getByRole("alert").textContent,
      ).toBe("Boom"),
    );
  });

  it("shows the empty line", () => {
    render(<ServiceTokensSection tokens={[]} onRevoke={async () => {}} />);
    expect(
      screen.getByText(
        "No service tokens. No machine client can read this app.",
      ),
    ).toBeTruthy();
  });

  it("shows skeleton rows while loading", () => {
    render(
      <ServiceTokensSection tokens={undefined} onRevoke={async () => {}} />,
    );
    expect(
      screen.getByRole("status", { name: "Loading service tokens" }),
    ).toBeTruthy();
  });

  it("shows the error with Try again", () => {
    const onRetry = vi.fn();
    render(
      <ServiceTokensSection
        tokens={undefined}
        error="Nope"
        onRetry={onRetry}
        onRevoke={async () => {}}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Nope");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("uses the default title, description and anchor", () => {
    const { container } = render(
      <ServiceTokensSection tokens={[]} onRevoke={async () => {}} />,
    );
    expect(
      screen.getByRole("heading", { name: "Service tokens" }),
    ).toBeTruthy();
    expect(container.querySelector("#service-tokens")).toBeTruthy();
    expect(screen.getByText(/Revoking one stops it at once\./)).toBeTruthy();
  });
});

describe("useServiceTokens", () => {
  it("GETs the list, then POSTs the encoded revoke URL and takes the response list", async () => {
    const after = [tok({ id: "a/b", name: "A", revoked: true })];
    const fn = vi.fn(async (_url: string, init?: RequestInit) =>
      json({
        tokens:
          init?.method === "POST" ? after : [tok({ id: "a/b", name: "A" })],
      }),
    );
    vi.stubGlobal("fetch", fn);
    const { result } = renderHook(() => useServiceTokens());
    expect(result.current.tokens).toBeUndefined();
    await waitFor(() => expect(result.current.tokens).toHaveLength(1));
    expect(fn.mock.calls[0]![0]).toBe("/api/service-tokens");
    await act(() => result.current.revoke("a/b"));
    expect(fn.mock.calls[1]![0]).toBe("/api/service-tokens/a%2Fb/revoke");
    expect(fn.mock.calls[1]![1]!.method).toBe("POST");
    expect(result.current.tokens).toEqual(after);
  });

  it("uses a custom url, reports errors and reloads", async () => {
    let fail = true;
    const fn = vi.fn(async (_url: string) =>
      fail ? json({ error: "Down" }, 500) : json({ tokens: [] }),
    );
    vi.stubGlobal("fetch", fn);
    const { result } = renderHook(() => useServiceTokens("/x/tokens"));
    await waitFor(() => expect(result.current.error).toBe("Down"));
    expect(fn.mock.calls[0]![0]).toBe("/x/tokens");
    fail = false;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.tokens).toEqual([]));
    expect(result.current.error).toBeNull();
  });

  it("revoke rejects with the server message on failure", async () => {
    let post = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        post
          ? json({ error: "No service token with that id." }, 404)
          : json({ tokens: [] }),
      ),
    );
    const { result } = renderHook(() => useServiceTokens());
    await waitFor(() => expect(result.current.tokens).toEqual([]));
    post = true;
    await expect(result.current.revoke("zz")).rejects.toThrow(
      "No service token with that id.",
    );
  });
});
