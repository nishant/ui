// Self-test for @nish/ui/inbox-client. Run after `npm run build`: imports dist/inbox-client.js
// and checks validation, defaults, the client's send/queue/flush behavior and its request headers.
// Exits non-zero on any failure.
import assert from 'node:assert/strict';
import {
  createInboxClient, parseInboxEvent, isInboxActionTarget, INBOX_DEFAULT_SETTINGS, INBOX_SOURCE_LABELS, INBOX_ACTION_HEADER, INBOX_ACTION_TIMEOUT_MS,
} from '../dist/inbox-client.js';

const good = { source: 'trackers', kind: 'price-drop', title: 'Hello' };
const okResponseEarly = () => new Response(JSON.stringify({ results: [{ id: 1, action: 'created' }] }), { status: 200 });
const bad = (patch, error) => {
  const r = parseInboxEvent({ ...good, ...patch });
  assert.equal(r.ok, false, `expected failure: ${error}`);
  assert.equal(r.error, error);
};

// --- parseInboxEvent: every error string ---
{
  const r = parseInboxEvent('nope');
  assert.deepEqual(r, { ok: false, error: 'event must be an object' });
  assert.equal(parseInboxEvent(null).error, 'event must be an object');
  assert.equal(parseInboxEvent([]).error, 'event must be an object');
}
bad({ source: 'Bad Source' }, 'source must be lowercase letters, digits or dashes');
bad({ source: '' }, 'source must be lowercase letters, digits or dashes');
bad({ source: 'a'.repeat(33) }, 'source must be lowercase letters, digits or dashes');
bad({ kind: 'Price Drop' }, 'kind must be lowercase letters, digits or dashes');
bad({ kind: 'k'.repeat(49) }, 'kind must be lowercase letters, digits or dashes');
bad({ title: '   ' }, 'title is required');
bad({ title: undefined }, 'title is required');
bad({ url: 'javascript:alert(1)' }, 'url must be an http or https link');
bad({ url: 'not a url' }, 'url must be an http or https link');
bad({ url: 'https://x.test/' + 'a'.repeat(2000) }, 'url must be an http or https link');
bad({ severity: 'loud' }, 'severity must be info, normal or urgent');
bad({ dedupeKey: '' }, 'dedupeKey must be 1-200 characters');
bad({ dedupeKey: 'k'.repeat(201) }, 'dedupeKey must be 1-200 characters');
bad({ resolve: true }, 'resolve needs a dedupeKey');
bad({ occurredAt: 'yesterday' }, 'occurredAt must be an ISO date');
bad({ occurredAt: '2026-13-45T00:00:00Z' }, 'occurredAt must be an ISO date');
bad({ data: { a: { b: 1 } } }, 'data must be a flat object of strings, numbers, booleans or null');
bad({ data: { a: [1] } }, 'data must be a flat object of strings, numbers, booleans or null');
bad({ data: [1] }, 'data must be a flat object of strings, numbers, booleans or null');
bad({ data: 'x' }, 'data must be a flat object of strings, numbers, booleans or null');
bad({ data: { a: 'x'.repeat(4100) } }, 'data is larger than 4 KB');

// Check order: source before kind before title, and so on.
assert.equal(parseInboxEvent({ source: 'BAD', kind: 'BAD', title: '' }).error, 'source must be lowercase letters, digits or dashes');
assert.equal(parseInboxEvent({ source: 'ok', kind: 'BAD', title: '' }).error, 'kind must be lowercase letters, digits or dashes');
assert.equal(parseInboxEvent({ source: 'ok', kind: 'ok', title: '', url: 'x' }).error, 'title is required');

// --- defaults ---
{
  const before = Date.now();
  const r = parseInboxEvent({ ...good, body: '' });
  assert.equal(r.ok, true);
  assert.equal(r.value.severity, 'normal');
  assert.equal(r.value.body, null);
  assert.equal(r.value.url, null);
  assert.equal(r.value.dedupeKey, null);
  assert.equal(r.value.resolve, false);
  assert.equal(r.value.data, null);
  const t = Date.parse(r.value.occurredAt);
  assert.ok(t >= before - 1 && t <= Date.now() + 1, 'occurredAt defaults to now');
}

// --- trimming and cutting ---
{
  const r = parseInboxEvent({ ...good, title: '  ' + 'x'.repeat(141) + '  ' });
  assert.equal(r.value.title, 'x'.repeat(139) + '…');
  assert.equal([...r.value.title].length, 140);
  assert.equal(parseInboxEvent({ ...good, title: 'x'.repeat(140) }).value.title, 'x'.repeat(140));
  const b = parseInboxEvent({ ...good, body: ' ' + 'y'.repeat(2001) });
  assert.equal(b.value.body, 'y'.repeat(1999) + '…');
  // Never splits a surrogate pair.
  const emoji = parseInboxEvent({ ...good, title: '😀'.repeat(141) });
  assert.equal(emoji.value.title, '😀'.repeat(139) + '…');
  assert.ok(!/[\ud800-\udbff](?![\udc00-\udfff])/.test(emoji.value.title), 'no lone surrogate');
}

// --- edge cases ---
{
  // data exactly 4096 bytes passes; one more fails.
  const overhead = JSON.stringify({ a: '' }).length;
  const exact = parseInboxEvent({ ...good, data: { a: 'x'.repeat(4096 - overhead) } });
  assert.equal(exact.ok, true);
  assert.equal(new TextEncoder().encode(JSON.stringify(exact.value.data)).length, 4096);
  assert.equal(parseInboxEvent({ ...good, data: { a: 'x'.repeat(4097 - overhead) } }).error, 'data is larger than 4 KB');
  assert.equal(parseInboxEvent({ ...good, data: { a: 1, b: true, c: null, d: 's' } }).ok, true);
  // Future occurredAt is clamped to now.
  const future = parseInboxEvent({ ...good, occurredAt: '2999-01-01T00:00:00Z' });
  assert.ok(Date.parse(future.value.occurredAt) <= Date.now());
  // Past occurredAt is kept (normalized to ISO).
  assert.equal(parseInboxEvent({ ...good, occurredAt: '2026-01-02T03:04:05Z' }).value.occurredAt, '2026-01-02T03:04:05.000Z');
  // resolve with dedupeKey is fine.
  const res = parseInboxEvent({ ...good, resolve: true, dedupeKey: 'k' });
  assert.equal(res.ok, true);
  assert.equal(res.value.resolve, true);
  // http and https both pass.
  assert.equal(parseInboxEvent({ ...good, url: 'http://127.0.0.1:1/x' }).ok, true);
  assert.equal(parseInboxEvent({ ...good, url: 'https://example.com/a?b=c' }).value.url, 'https://example.com/a?b=c');
}

// --- actions ---
{
  const act = { id: 'retry', label: 'Retry', target: 'http://127.0.0.1:8810/api/retry' };
  const T = 'action target must be http://127.0.0.1:<port>/…';
  bad({ actions: 'x' }, 'actions must be a list of at most 3');
  bad({ actions: [act, { ...act, id: 'b' }, { ...act, id: 'c' }, { ...act, id: 'd' }] }, 'actions must be a list of at most 3');
  bad({ actions: [null] }, 'actions must be a list of at most 3');
  bad({ actions: [{ ...act, id: 'Retry' }] }, 'action id must be lowercase letters, digits or dashes');
  bad({ actions: [{ ...act, id: 'a'.repeat(33) }] }, 'action id must be lowercase letters, digits or dashes');
  bad({ actions: [act, act] }, 'action ids must be unique');
  bad({ actions: [{ ...act, label: '  ' }] }, 'action label is required');
  bad({ actions: [{ ...act, method: 'GET' }] }, "action method must be 'POST'");
  for (const target of [
    'https://127.0.0.1:8810/x', // not http
    'http://127.0.0.1/x', // no port
    'http://127.0.0.1:80/x', // default port is dropped, so no explicit port
    'http://localhost:8810/x',
    'http://127.0.0.2:8810/x',
    'http://10.0.0.1:8810/x',
    'http://example.com:8810/x',
    'http://127.0.0.1.nip.io:8810/x',
    'http://u:p@127.0.0.1:8810/x',
    'http://u@127.0.0.1:8810/x',
    'http://127.0.0.1:8810/x#y',
    'http://127.0.0.1:8810/x#',
    'http://[::1]:8810/x',
    'file:///etc/passwd',
    'not a url',
    'http://127.0.0.1:8810/' + 'a'.repeat(2000),
  ]) {
    bad({ actions: [{ ...act, target }] }, T);
    assert.equal(isInboxActionTarget(target), false, target);
  }
  bad({ actions: [{ ...act, target: 5 }] }, T);
  // Check order: actions come after data.
  assert.equal(parseInboxEvent({ ...good, data: [1], actions: 'x' }).error, 'data must be a flat object of strings, numbers, booleans or null');

  const r = parseInboxEvent({ ...good, actions: [act, { id: 'skip-1', label: '  ' + 'L'.repeat(41) + ' ', method: 'POST', target: 'http://127.0.0.1:65535' }] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value.actions, [
    { id: 'retry', label: 'Retry', method: 'POST', target: 'http://127.0.0.1:8810/api/retry' },
    { id: 'skip-1', label: 'L'.repeat(39) + '…', method: 'POST', target: 'http://127.0.0.1:65535/' },
  ]);
  // Extra fields on an action are dropped.
  assert.deepEqual(Object.keys(parseInboxEvent({ ...good, actions: [{ ...act, extra: 1 }] }).value.actions[0]), ['id', 'label', 'method', 'target']);
  assert.equal(parseInboxEvent({ ...good, actions: [] }).value.actions, null);
  assert.equal(parseInboxEvent({ ...good, actions: null }).value.actions, null);
  assert.equal(parseInboxEvent(good).value.actions, null);
  assert.equal(isInboxActionTarget('http://127.0.0.1:8810/a?b=c'), true);
  assert.equal(INBOX_ACTION_HEADER, 'X-Inbox-Action');
  assert.equal(INBOX_ACTION_TIMEOUT_MS, 8000);

  // The client sends actions with the event.
  let sent;
  const c = createInboxClient({ source: 'trackers', url: 'http://x', fetch: async (_u, init) => { sent = JSON.parse(init.body); return okResponseEarly(); }, log: () => {} });
  const res = await c.send({ kind: 'k', title: 't', actions: [act] });
  assert.equal(res.ok, true);
  assert.deepEqual(sent.actions, [{ ...act, method: 'POST' }]);
}

// --- constants ---
assert.equal(INBOX_DEFAULT_SETTINGS.timezone, 'America/Chicago');
assert.equal(INBOX_SOURCE_LABELS['job-apps'], 'Jobs');

// --- client ---
const noLog = () => {};
const okResponse = (status = 200, body = { results: [{ id: 7, action: 'created' }] }) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

{
  // 200: ok, with both required headers and the validated event as the body.
  const calls = [];
  const fetchOk = async (url, init) => {
    calls.push({ url, init });
    return okResponse();
  };
  const c = createInboxClient({ source: 'trackers', url: 'http://127.0.0.1:8805/', fetch: fetchOk, log: noLog });
  const r = await c.send({ kind: 'price-drop', title: 'Drop' });
  assert.deepEqual(r, { ok: true, id: 7, action: 'created' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://127.0.0.1:8805/ingest/events');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.equal(calls[0].init.headers['X-Inbox-Client'], '1');
  assert.equal(calls[0].init.headers.Origin, undefined);
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.source, 'trackers');
  assert.equal(sent.severity, 'normal');
  assert.equal(c.pending, 0);

  // resolve() sends the resolve event.
  await c.resolve('site-down');
  const resolved = JSON.parse(calls[1].init.body);
  assert.equal(resolved.kind, 'resolve');
  assert.equal(resolved.title, 'resolve');
  assert.equal(resolved.dedupeKey, 'site-down');
  assert.equal(resolved.resolve, true);
}

{
  // Network failure queues; flush with a working fetch empties the queue, in order.
  const logs = [];
  let working = false;
  const received = [];
  const flaky = async (_url, init) => {
    if (!working) throw new Error('connect ECONNREFUSED');
    received.push(JSON.parse(init.body).title);
    return okResponse();
  };
  const c = createInboxClient({ source: 'status', url: 'http://127.0.0.1:1', fetch: flaky, log: (m) => logs.push(m) });
  const r1 = await c.send({ kind: 'site-down', title: 'one' });
  assert.equal(r1.ok, false);
  assert.equal(r1.queued, true);
  assert.match(r1.error, /ECONNREFUSED/);
  assert.equal(c.pending, 1);
  await c.send({ kind: 'site-down', title: 'two' });
  assert.equal(c.pending, 2);
  assert.deepEqual(logs, ['inbox unreachable, 1 queued']);
  working = true;
  await c.flush(); // joins the retry that the second send started, which saw the outage
  await c.flush();
  assert.equal(c.pending, 0);
  assert.deepEqual(received, ['one', 'two']);
  // A new event sent while older ones are queued goes behind them, never ahead.
  working = false;
  await c.send({ kind: 'k', title: 'three' });
  working = true;
  const r4 = await c.send({ kind: 'k', title: 'four' });
  assert.equal(r4.queued, true);
  await c.flush();
  await c.flush();
  assert.deepEqual(received, ['one', 'two', 'three', 'four']);
  assert.deepEqual(logs.slice(0, 2), ['inbox unreachable, 1 queued', 'inbox back, sent 2 queued']);
}

{
  // A flush() on an empty queue must not make a following send look like an outage.
  const logs = [];
  const c = createInboxClient({ source: 'a', url: 'http://x', fetch: async () => okResponse(), log: (m) => logs.push(m) });
  void c.flush();
  const r = await c.send({ kind: 'k', title: 't' });
  assert.equal(r.ok, true);
  assert.equal(c.pending, 0);
  assert.deepEqual(logs, []);
  await c.flush();
}

{
  // 5xx queues, 4xx does not.
  const c5 = createInboxClient({ source: 'a', url: 'http://x', fetch: async () => okResponse(503, {}), log: noLog });
  const r5 = await c5.send({ kind: 'k', title: 't' });
  assert.deepEqual(r5, { ok: false, error: 'HTTP 503', queued: true });
  assert.equal(c5.pending, 1);

  const c4 = createInboxClient({ source: 'a', url: 'http://x', fetch: async () => okResponse(400, { error: 'title is required' }), log: noLog });
  const r4 = await c4.send({ kind: 'k', title: 't' });
  assert.deepEqual(r4, { ok: false, error: 'title is required', queued: false });
  assert.equal(c4.pending, 0);

  const c4b = createInboxClient({ source: 'a', url: 'http://x', fetch: async () => new Response('x', { status: 404 }), log: noLog });
  assert.deepEqual(await c4b.send({ kind: 'k', title: 't' }), { ok: false, error: 'HTTP 404', queued: false });
}

{
  // url 'off' is a no-op: no fetch, no log.
  let called = false;
  const logs = [];
  const c = createInboxClient({ source: 'a', url: 'off', fetch: async () => { called = true; return okResponse(); }, log: (m) => logs.push(m) });
  assert.deepEqual(await c.send({ kind: 'k', title: 't' }), { ok: false, error: 'disabled', queued: false });
  assert.equal(called, false);
  assert.deepEqual(logs, []);
  assert.equal(c.pending, 0);
}

{
  // Invalid events are rejected locally and logged once per distinct error.
  let called = false;
  const logs = [];
  const c = createInboxClient({ source: 'a', url: 'http://x', fetch: async () => { called = true; return okResponse(); }, log: (m) => logs.push(m) });
  const r = await c.send({ kind: 'Bad', title: 't' });
  assert.deepEqual(r, { ok: false, error: 'kind must be lowercase letters, digits or dashes', queued: false });
  await c.send({ kind: 'Bad', title: 't' });
  await c.send({ kind: 'k', title: '' });
  assert.equal(called, false);
  assert.deepEqual(logs, [
    'invalid event from a: kind must be lowercase letters, digits or dashes',
    'invalid event from a: title is required',
  ]);
}

{
  // The queue holds at most 200 events and drops the oldest.
  const logs = [];
  const c = createInboxClient({ source: 'a', url: 'http://x', fetch: async () => { throw new Error('down'); }, log: (m) => logs.push(m) });
  for (let i = 0; i < 205; i++) await c.send({ kind: 'k', title: `t${i}` });
  assert.equal(c.pending, 200);
  assert.equal(logs.filter((m) => m === 'queue full, dropped 1 event').length, 1, 'full message at most once a minute');
}

{
  // A timeout counts as a network failure and queues.
  const slow = (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const c = createInboxClient({ source: 'a', url: 'http://x', timeoutMs: 20, fetch: slow, log: noLog });
  const r = await c.send({ kind: 'k', title: 't' });
  assert.equal(r.ok, false);
  assert.equal(r.queued, true);
  assert.match(r.error, /timed out/);
}

{
  // Browser-like environment: with `process` undefined the default URL is used.
  const realProcess = globalThis.process;
  let url;
  try {
    Object.defineProperty(globalThis, 'process', { value: undefined, configurable: true, writable: true });
    const c = createInboxClient({ source: 'a', fetch: async (u) => { url = u; return okResponse(); }, log: noLog });
    await c.send({ kind: 'k', title: 't' });
  } finally {
    Object.defineProperty(globalThis, 'process', { value: realProcess, configurable: true, writable: true });
  }
  assert.equal(url, 'http://127.0.0.1:8805/ingest/events');
}

{
  // INBOX_URL from the environment is used when no url option is given.
  const prev = process.env.INBOX_URL;
  process.env.INBOX_URL = 'http://127.0.0.1:9999';
  let url;
  try {
    const c = createInboxClient({ source: 'a', fetch: async (u) => { url = u; return okResponse(); }, log: noLog });
    await c.send({ kind: 'k', title: 't' });
  } finally {
    if (prev === undefined) delete process.env.INBOX_URL;
    else process.env.INBOX_URL = prev;
  }
  assert.equal(url, 'http://127.0.0.1:9999/ingest/events');
}

{
  // Sends are serial and in call order: a slow first send finishes (and queues) before the second starts.
  let inflight = 0;
  let maxInflight = 0;
  const order = [];
  const slowThenFail = async (_u, init) => {
    inflight++;
    maxInflight = Math.max(maxInflight, inflight);
    const title = JSON.parse(init.body).title;
    order.push(title);
    await new Promise((r) => setTimeout(r, 30));
    inflight--;
    if (title === 'down') throw new Error('offline');
    return okResponse();
  };
  const c = createInboxClient({ source: 'a', url: 'http://x', fetch: slowThenFail, log: noLog });
  const [a, b] = await Promise.all([c.send({ kind: 'k', title: 'down' }), c.send({ kind: 'k', title: 'up' })]);
  await c.flush();
  assert.equal(maxInflight, 1);
  // The second send queued behind the first and its flush retried the head; 'up' never jumped ahead.
  assert.deepEqual(order, ['down', 'down']);
  assert.equal(a.queued, true);
  assert.deepEqual(b, { ok: false, error: 'queued behind earlier events', queued: true });
  assert.equal(c.pending, 2);
}

{
  // HTTP 429 is retried later (queued), not rejected.
  const c = createInboxClient({ source: 'a', url: 'http://x', fetch: async () => new Response('{}', { status: 429, headers: { 'Retry-After': '120' } }), log: noLog });
  const r = await c.send({ kind: 'k', title: 't' });
  assert.deepEqual(r, { ok: false, error: 'HTTP 429', queued: true });
  assert.equal(c.pending, 1);
}

{
  // A dev checkout (npm script, not production, no url, no INBOX_URL) never posts.
  const saved = { url: process.env.INBOX_URL, life: process.env.npm_lifecycle_event, node: process.env.NODE_ENV };
  delete process.env.INBOX_URL;
  process.env.npm_lifecycle_event = 'dev';
  delete process.env.NODE_ENV;
  const logs = [];
  let called = false;
  try {
    const c = createInboxClient({ source: 'a', fetch: async () => { called = true; return okResponse(); }, log: (m) => logs.push(m) });
    assert.deepEqual(await c.send({ kind: 'k', title: 't' }), { ok: false, error: 'disabled', queued: false });
    assert.deepEqual(logs, ['off outside production; set INBOX_URL to send']);
    process.env.NODE_ENV = 'production';
    const p = createInboxClient({ source: 'a', fetch: async () => { called = true; return okResponse(); }, log: noLog });
    assert.equal((await p.send({ kind: 'k', title: 't' })).ok, true);
    assert.equal(called, true);
  } finally {
    for (const [k, v] of [['INBOX_URL', saved.url], ['npm_lifecycle_event', saved.life], ['NODE_ENV', saved.node]]) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

assert.equal(INBOX_SOURCE_LABELS.workflows, 'Workflows');

console.log('inbox-client-check: all checks passed');
