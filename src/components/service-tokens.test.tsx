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
import { NishProvider } from "./provider";
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
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Revoke nish MCP?")).toBeTruthy();
    expect(within(dialog).getByText(/This cannot be undone/)).toBeTruthy();
    expect(onRevoke).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(onRevoke).toHaveBeenCalledWith("mcp"));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("Cancel closes without revoking", () => {
    const onRevoke = vi.fn();
    render(<ServiceTokensSection tokens={LIST} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke nish MCP" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onRevoke).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the error when revoke fails", async () => {
    const onRevoke = vi.fn().mockRejectedValue(new Error("Boom"));
    render(<ServiceTokensSection tokens={LIST} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke nish MCP" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Revoke",
      }),
    );
    await waitFor(() =>
      expect(
        within(screen.getByRole("alertdialog")).getByRole("alert").textContent,
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
    expect(screen.getByRole("status").textContent).toContain(
      "Loading service tokens",
    );
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

  it("keeps the list and shows the error with Try again when a reload fails", () => {
    const onRetry = vi.fn();
    render(
      <ServiceTokensSection
        tokens={LIST}
        error="Offline"
        onRetry={onRetry}
        onRevoke={async () => {}}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Offline");
    expect(screen.getByText("nish MCP")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the error with Try again when an empty list fails to reload", () => {
    const onRetry = vi.fn();
    render(
      <ServiceTokensSection
        tokens={[]}
        error="Offline"
        onRetry={onRetry}
        onRevoke={async () => {}}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Offline");
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
    expect(new Headers(fn.mock.calls[1]![1]!.headers).get("content-type")).toBe("application/json");
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

describe("useServiceTokens url change", () => {
  it("drops the old url's list and error and reports loading until the new url answers", async () => {
    let release: (r: Response) => void = () => {};
    const fn = vi.fn((url: string) =>
      url === "/a"
        ? Promise.resolve(json({ tokens: [tok({ id: "a1", name: "A one" })] }))
        : new Promise<Response>((res) => {
            release = res;
          }),
    );
    vi.stubGlobal("fetch", fn);
    const { result, rerender } = renderHook(({ u }) => useServiceTokens(u), { initialProps: { u: "/a" } });
    await waitFor(() => expect(result.current.tokens).toHaveLength(1));
    rerender({ u: "/b" });
    expect(result.current.tokens).toBeUndefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    await act(async () => release(json({ error: "B is down" }, 500)));
    await waitFor(() => expect(result.current.error).toBe("B is down"));
    expect(result.current.tokens).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });
});

describe("ServiceTokensSection contract", () => {
  it("puts ref and rest props on the section, merges className", () => {
    const ref = { current: null as HTMLElement | null };
    render(
      <ServiceTokensSection
        tokens={LIST}
        onRevoke={async () => {}}
        ref={ref}
        className="mine"
        data-testid="st"
        id="tokens-here"
      />,
    );
    const section = screen.getByTestId("st");
    expect(section.tagName).toBe("SECTION");
    expect(ref.current).toBe(section);
    expect(section.id).toBe("tokens-here");
    expect(section.className).toContain("mine");
    expect(section.className).toContain("min-w-0");
  });

  it("takes its texts from the provider and per-instance props win", () => {
    render(
      <NishProvider
        strings={{
          serviceTokens: "Jetons",
          tokenRevoke: "Révoquer",
          tokenRevokeNamed: (n: string) => `Révoquer ${n}`,
          tokenRevokeTitle: (n: string) => `Révoquer ${n} ?`,
          tokenRevoked: "Révoqué",
          cancel: "Annuler",
        }}
      >
        <ServiceTokensSection tokens={LIST} onRevoke={async () => {}} />
      </NishProvider>,
    );
    expect(screen.getByRole("heading", { name: "Jetons" })).toBeTruthy();
    expect(screen.getByText("Révoqué")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Révoquer nish MCP (handle)" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Révoquer nish MCP (handle) ?")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Annuler" })).toBeTruthy();
  });

  it("takes the empty, created, env and revoke-body defaults from the provider", () => {
    const { rerender } = render(
      <NishProvider strings={{ tokenEmpty: "Aucun jeton", tokenCreated: (w: string) => `créé le ${w}`, tokenFromEnv: "depuis l'env", tokenRevokeBody: "Corps français" }}>
        <ServiceTokensSection tokens={[]} onRevoke={async () => {}} />
      </NishProvider>,
    );
    expect(screen.getByText("Aucun jeton")).toBeTruthy();
    rerender(
      <NishProvider strings={{ tokenCreated: (w: string) => `créé le ${w}`, tokenFromEnv: "depuis l'env", tokenRevokeBody: "Corps français" }}>
        <ServiceTokensSection tokens={[tok({ id: "e", name: "Env one", source: "env" })]} onRevoke={async () => {}} />
      </NishProvider>,
    );
    expect(screen.getByText(/créé le .*depuis l'env/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Env one/ }));
    expect(within(screen.getByRole("alertdialog")).getByText("Corps français")).toBeTruthy();
  });

  it("emptyMessage, createdLabel and envSourceLabel are per-instance", () => {
    const { rerender } = render(
      <ServiceTokensSection tokens={[]} onRevoke={async () => {}} emptyMessage="Rien" />,
    );
    expect(screen.getByText("Rien")).toBeTruthy();
    rerender(
      <ServiceTokensSection
        tokens={[tok({ id: "e", name: "Env one", source: "env" })]}
        onRevoke={async () => {}}
        createdLabel={(w) => `créé ${w}`}
        envSourceLabel="depuis l'env"
      />,
    );
    expect(screen.getByText(/créé .*depuis l'env/)).toBeTruthy();
  });
});
