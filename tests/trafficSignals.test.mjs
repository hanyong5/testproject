import test from 'node:test';
import assert from 'node:assert/strict';
import { nearbyIntersections, normalizeSignals, signalDisplay } from '../src/lib/trafficSignals.js';
import { createTrafficMiddleware } from '../server/trafficSignals.mjs';

const now = 1791641731334;
const base = { itstId: '1', dataId: 'sample-1', trsmUtcTime: now };
test('100m radius excludes outside points and invalid coordinates', () => {
  const result = nearbyIntersections([
    { itstId: 1, mapCtptIntLat: 37.5665, mapCtptIntLot: 126.978 },
    { itstId: 2, mapCtptIntLat: 37.567, mapCtptIntLot: 126.978 },
    { itstId: 3, mapCtptIntLat: 37.568, mapCtptIntLot: 126.978 },
    { itstId: 4, mapCtptIntLat: null, mapCtptIntLot: null },
  ], { latitude: 37.5665, longitude: 126.978 });
  assert.deepEqual(result.map((item) => item.id), ['1', '2']);
});
test('deciseconds convert to seconds; zero and null are distinct', () => {
  const signals = normalizeSignals({ ...base, ntPdsgStatNm: 'stop-And-Remain', ntPdsgRmdrCs: 130, etStsgStatNm: 'protected-Movement-Allowed', etStsgRmdrCs: 0, wtPdsgStatNm: 'dark', wtPdsgRmdrCs: null });
  assert.equal(signals.find((s) => s.key === 'ntPdsg').remainingSeconds, 13);
  assert.equal(signals.find((s) => s.key === 'etStsg').remainingSeconds, 0);
  assert.equal(signals.find((s) => s.key === 'wtPdsg').remainingSeconds, null);
});
test('newer phase never receives a previous snapshot countdown', () => {
  const [signal] = normalizeSignals({ ...base, ntPdsgStatNm: 'stop-And-Remain', ntPdsgRmdrCs: 130 }, { ...base, dataId: 'sample-2', trsmUtcTime: now + 1000, ntPdsgStatNm: 'protected-Movement-Allowed' }, null);
  assert.equal(signal.label, '녹색');
  assert.equal(signal.remainingSeconds, null);
});
test('stale and expired signals turn unknown, without guessing next phase', () => {
  const [signal] = normalizeSignals({ ...base, ntPdsgStatNm: 'protected-Movement-Allowed', ntPdsgRmdrCs: 30 });
  assert.equal(signalDisplay(signal, now + 1000).remaining, 2);
  assert.equal(signalDisplay(signal, now + 3000).label, '전환 확인 중');
  assert.equal(signalDisplay(signal, now + 16000).color, 'gray');
  assert.equal(signalDisplay(signal, now - 6000).color, 'gray');
});
test('only explicit flashing states animate; missing timestamps are unknown', () => {
  const [signal] = normalizeSignals({ ...base, ntPdsgStatNm: 'stop-Then-Proceed' });
  assert.equal(signalDisplay(signal, now).flashing, true);
  assert.equal(signalDisplay({ ...signal, observedAt: null }, now).flashing, false);
});
async function invoke(middleware, url) {
  let code;
  let output;
  await middleware({ url, method: 'GET' }, { setHeader() {}, set statusCode(value) { code = value; }, end(value) { output = JSON.parse(value); } }, () => assert.fail('unexpected next'));
  return { code, output };
}
test('middleware paginates coordinates and calls all three signal services', async () => {
  const called = [];
  const middleware = createTrafficMiddleware('test-secret', async (url) => {
    called.push(url.pathname);
    const rows = url.pathname.includes('Crossroad') ? (url.searchParams.get('pageNo') === '1' ? [{ itstId: '1', mapCtptIntLat: 37.5665, mapCtptIntLot: 126.978 }] : []) : [{ ...base, ntPdsgStatNm: 'stop-And-Remain', ntPdsgRmdrCs: 130 }];
    return { ok: true, json: async () => rows };
  });
  const result = await invoke(middleware, '/api/traffic-signals?lat=37.5665&lng=126.978');
  assert.equal(result.code, 200);
  assert.equal(result.output.intersections.length, 1);
  assert.equal(called.length, 5);
  assert.deepEqual(result.output.intersections[0].sources, { fusion: 'ok', phase: 'ok', timing: 'ok' });
  assert.equal(JSON.stringify(result).includes('test-secret'), false);
});
test('middleware reports partial failures and never exposes upstream error bodies', async () => {
  const middleware = createTrafficMiddleware('test-secret', async (url) => {
    if (url.pathname.includes('Crossroad')) return { ok: true, json: async () => url.searchParams.get('pageNo') === '1' ? [{ itstId: '1', mapCtptIntLat: 37.5665, mapCtptIntLot: 126.978 }] : [] };
    if (url.pathname.includes('Fusion')) throw new Error('https://example.com?apikey=test-secret');
    return { ok: true, json: async () => [{ ...base, ntPdsgStatNm: 'stop-And-Remain' }] };
  });
  const result = await invoke(middleware, '/api/traffic-signals?lat=37.5665&lng=126.978');
  assert.equal(result.output.intersections[0].sources.fusion, 'error');
  assert.equal(result.output.intersections[0].signals.length, 1);
  assert.equal(JSON.stringify(result).includes('test-secret'), false);
  assert.equal((await invoke(middleware, '/api/traffic-signals?lat=&lng=999')).code, 400);
});
test('missing key is explicit', async () => {
  assert.equal((await invoke(createTrafficMiddleware(''), '/api/traffic-signals?lat=37&lng=127')).code, 503);
});
test('429 Retry-After is honored without repeated upstream requests', async () => {
  let calls = 0;
  const middleware = createTrafficMiddleware('test-secret', async () => {
    calls++;
    return { ok: false, status: 429, headers: { get: () => '20835, 20835' } };
  });
  const first = await invoke(middleware, '/api/traffic-signals?lat=37.563&lng=126.903');
  const second = await invoke(middleware, '/api/traffic-signals?lat=37.564&lng=126.904');
  assert.equal(first.code, 429);
  assert.ok(first.output.retryAfter > 20830);
  assert.equal(second.code, 429);
  assert.equal(calls, 1);
});

test('coordinate pages survive server recreation and location queries skip phase services', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const directory = await mkdtemp(join(tmpdir(), 'traffic-cache-'));
  try {
    const options = { cacheFile: join(directory, 'cache.json') };
    let calls = 0;
    const fetcher = async (url) => {
      calls++;
      assert.ok(url.pathname.includes('Crossroad'));
      return { ok: true, json: async () => url.searchParams.get('pageNo') === '1' ? [{ itstId: '1', mapCtptIntLat: 37.5665, mapCtptIntLot: 126.978 }] : [] };
    };
    const url = '/api/traffic-signals?lat=37.5665&lng=126.978&locationsOnly=true';
    const middleware = createTrafficMiddleware('test-secret', fetcher, options);
    const results = await Promise.all([invoke(middleware, url), invoke(middleware, url)]);
    assert.ok(results.every((result) => result.code === 200));
    assert.equal(calls, 2);
    const restarted = await invoke(createTrafficMiddleware('test-secret', fetcher, options), url);
    assert.equal(restarted.output.intersections.length, 1);
    assert.equal(calls, 2);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('429 cooldown survives server recreation', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const directory = await mkdtemp(join(tmpdir(), 'traffic-limit-'));
  try {
    const options = { cacheFile: join(directory, 'cache.json') };
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return { ok: false, status: 429, headers: { get: () => '300' } };
    };
    const url = '/api/traffic-signals?lat=37.5665&lng=126.978&locationsOnly=true';
    await invoke(createTrafficMiddleware('test-secret', fetcher, options), url);
    const result = await invoke(createTrafficMiddleware('test-secret', fetcher, options), url);
    assert.equal(result.code, 429);
    assert.ok(result.output.retryAfter > 290);
    assert.equal(calls, 1);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
