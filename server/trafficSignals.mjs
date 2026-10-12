import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { nearbyIntersections, normalizeSignals, SIGNAL_RADIUS_METERS } from '../src/lib/trafficSignals.js';

const endpoints = {
  fusion: 'v2xSignalPhaseTimingFusionCurrentInfo',
  phase: 'v2xSignalPhaseCurrentInfo',
  timing: 'v2xSignalPhaseTimingCurrentInfo',
  intersections: 'v2xCrossroadMapInformation',
};

export function createTrafficMiddleware(apiKey, fetcher = fetch, { cacheFile } = {}) {
  const cache = new Map();
  let cooldownUntil = 0;
  const saved = { pages: {}, cooldownUntil: 0 };
  // Store coordinates and retry time only; never persist the API key or live phases.
  const loaded = cacheFile ? readFile(cacheFile, 'utf8').then((text) => {
    const data = JSON.parse(text);
    if (data.pages && typeof data.pages === 'object') saved.pages = data.pages;
    if (Number.isFinite(data.cooldownUntil)) cooldownUntil = data.cooldownUntil;
  }).catch(() => {}) : Promise.resolve();
  let saveQueue = Promise.resolve();
  function persist() {
    if (!cacheFile) return Promise.resolve();
    saved.cooldownUntil = cooldownUntil;
    const snapshot = JSON.stringify(saved);
    saveQueue = saveQueue.then(async () => {
      await mkdir(dirname(cacheFile), { recursive: true });
      const temporary = `${cacheFile}.${process.pid}.tmp`;
      await writeFile(temporary, snapshot, { mode: 0o600 });
      await rename(temporary, cacheFile);
    }).catch(() => { console.warn('교통 좌표 캐시를 저장하지 못했습니다. 메모리 캐시를 사용합니다.'); });
    return saveQueue;
  }
  function rateLimitError() {
    const error = new Error('서울시 교통 API 호출이 제한되었습니다. 안내된 재시도 시간까지 기다려 주세요.');
    error.status = 429;
    error.retryAfter = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
    return error;
  }
  async function request(kind, params = {}, ttl = 2000) {
    await loaded;
    const cacheKey = kind + JSON.stringify(params);
    const page = saved.pages[cacheKey];
    if (kind === 'intersections' && page?.expires > Date.now() && Array.isArray(page.rows)) return page.rows;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.promise;
    if (cooldownUntil > Date.now()) throw rateLimitError();
    const promise = (async () => {
      const url = new URL(`https://t-data.seoul.go.kr/apig/apiman-gateway/tapi/${endpoints[kind]}/1.0`);
      url.search = new URLSearchParams({ apikey: apiKey, type: 'json', ...params });
      let response;
      try {
        response = await fetcher(url, { signal: AbortSignal.timeout(10000) });
      } catch { throw new Error('서울시 교통 API에 연결하지 못했습니다.'); }
      if (response.status === 429) {
        // Gateways may repeat Retry-After values (e.g. "20835, 20835").
        const header = response.headers?.get('retry-after') || '';
        const seconds = /^\d+(?:\s*,\s*\d+)*$/.test(header.trim())
          ? Math.max(...header.split(',').map(Number))
          : Math.ceil((Date.parse(header) - Date.now()) / 1000);
        cooldownUntil = Math.max(cooldownUntil, Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
        await persist();
        throw rateLimitError();
      }
      if (!response.ok) throw new Error(`서울시 교통 API 요청 실패 (${response.status}). 인증키와 서비스 활용 승인을 확인해 주세요.`);
      let body;
      try { body = await response.json(); } catch { throw new Error('서울시 교통 API 응답 형식이 올바르지 않습니다.'); }
      if (!Array.isArray(body)) throw new Error('서울시 교통 API가 데이터를 반환하지 않았습니다. 인증키와 서비스 활용 승인을 확인해 주세요.');
      if (kind === 'intersections') {
        saved.pages[cacheKey] = { rows: body, expires: Date.now() + ttl };
        await persist();
      }
      return body;
    })();
    cache.set(cacheKey, { promise, expires: Date.now() + ttl });
    try { return await promise; } catch (error) { cache.delete(cacheKey); throw error; }
  }

  let intersectionsPromise;
  let intersectionsExpiry = 0;
  async function intersections() {
    if (intersectionsPromise && intersectionsExpiry > Date.now()) return intersectionsPromise;
    intersectionsExpiry = Date.now() + 86400000;
    intersectionsPromise = (async () => {
      const found = new Map();
      for (let page = 1; page <= 100; page++) {
        if (page > 1) await delay(1100);
        const rows = await request('intersections', { pageNo: String(page), numOfRows: '1000' }, 86400000);
        if (!rows.length) return [...found.values()];
        const before = found.size;
        for (const row of rows) found.set(String(row.itstId), row);
        if (found.size === before) throw new Error('교차로 좌표 API의 페이지 응답을 확인할 수 없습니다.');
      }
      throw new Error('교차로 좌표 조회 범위를 초과했습니다.');
    })();
    try { return await intersectionsPromise; } catch (error) { intersectionsPromise = null; throw error; }
  }

  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    const isDefault = url.pathname === '/api/traffic-signals/default';
    if (!isDefault && url.pathname !== '/api/traffic-signals') return next();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.method !== 'GET') return send(405, { error: 'GET 요청만 지원합니다.' });
    const latitude = Number(url.searchParams.get('lat'));
    const longitude = Number(url.searchParams.get('lng'));
    if (!isDefault && (!url.searchParams.has('lat') || !url.searchParams.has('lng') || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) return send(400, { error: '유효한 현재 위치가 필요합니다.' });
    if (!apiKey) return send(503, { error: '서버에 VITE_TDATA_API_KEY를 설정해 주세요.' });
    try {
      if (isDefault) {
        // This intersection returned live phase and timing data during integration.
        const row = (await intersections()).find((item) => String(item.itstId) === '20386');
        if (!row) return send(404, { error: '시작 교차로의 좌표를 찾지 못했습니다.' });
        const records = await request('fusion', { itstId: '20386', pageNo: '1', numOfRows: '10' });
        const record = records.filter((item) => String(item.itstId) === '20386').sort((a, b) => Number(b.trsmUtcTime) - Number(a.trsmUtcTime))[0];
        if (!normalizeSignals(record).length) return send(404, { error: '시작 교차로의 신호 정보가 현재 제공되지 않습니다.' });
        return send(200, { location: { name: row.itstNm || '신호 제공 교차로', latitude: Number(row.mapCtptIntLat), longitude: Number(row.mapCtptIntLot) } });
      }
      const nearby = nearbyIntersections(await intersections(), { latitude, longitude });
      if (url.searchParams.get('locationsOnly') === 'true') return send(200, { intersections: nearby, radius: SIGNAL_RADIUS_METERS });
      const results = [];
      for (let i = 0; i < nearby.length; i += 4) {
        const batch = await Promise.all(nearby.slice(i, i + 4).map(async (intersection) => {
          const kinds = ['fusion', 'phase', 'timing'];
          const responses = await Promise.allSettled(kinds.map((kind) => request(kind, { itstId: intersection.id, pageNo: '1', numOfRows: '10' })));
          const sources = Object.fromEntries(responses.map((result, index) => [kinds[index], result.status === 'fulfilled' ? 'ok' : 'error']));
          const records = responses.map((result) => result.status === 'fulfilled' ? result.value.filter((row) => String(row.itstId) === intersection.id).sort((a, b) => Number(b.trsmUtcTime) - Number(a.trsmUtcTime))[0] : null);
          return { ...intersection, sources, signals: normalizeSignals(...records) };
        }));
        results.push(...batch);
      }
      send(200, { intersections: results, serverTime: Date.now(), radius: SIGNAL_RADIUS_METERS, retryAfter: cooldownUntil > Date.now() ? Math.ceil((cooldownUntil - Date.now()) / 1000) : null });
    } catch (error) {
      if (error.status === 429) res.setHeader('Retry-After', String(error.retryAfter));
      send(error.status || 502, { error: error.message, retryAfter: error.retryAfter });
    }
  };
}

export function trafficSignalsPlugin(apiKey) {
  const keyId = createHash('sha256').update(apiKey || '').digest('hex').slice(0, 16);
  const middleware = createTrafficMiddleware(apiKey, fetch, {
    cacheFile: resolve('node_modules/.cache/traffic-signals', `${keyId}.json`),
  });
  return { name: 'seoul-traffic-signals', configureServer(server) { server.middlewares.use(middleware); }, configurePreviewServer(server) { server.middlewares.use(middleware); } };
}
