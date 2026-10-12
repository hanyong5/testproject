import { useEffect, useRef, useState } from 'react';
import { SIGNAL_RADIUS_METERS } from '../lib/trafficSignals';
import './NearbySignals.css';

const empty = [];
const locationCache = new Map();
let retryAt = 0;

export default function NearbySignals({ location, mapRef, mapStatus }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(null);
  const { latitude, longitude } = location;
  const enabled = mapStatus === 'ready';
  const intersections = enabled && result?.latitude === latitude && result?.longitude === longitude ? result.intersections : empty;

  useEffect(() => () => requestRef.current?.abort(), []);

  async function showLocations() {
    if (!enabled || requestRef.current) return;
    const cacheKey = `${latitude},${longitude}`;
    const cached = locationCache.get(cacheKey);
    if (cached?.expires > Date.now()) {
      setError('');
      setResult(cached.result);
      return;
    }
    if (retryAt > Date.now()) {
      setError(`호출 제한 중입니다. 약 ${Math.ceil((retryAt - Date.now()) / 60000)}분 후 다시 조회해 주세요.`);
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ lat: latitude, lng: longitude, locationsOnly: 'true' });
      const response = await fetch(`/api/traffic-signals?${params}`, { signal: controller.signal });
      const body = await response.json();
      if (response.status === 429) {
        const seconds = Number(body.retryAfter);
        retryAt = Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000;
        throw new Error(`호출 제한 중입니다. 약 ${Math.ceil((retryAt - Date.now()) / 60000)}분 후 다시 조회해 주세요.`);
      }
      if (!response.ok) throw new Error(body.error || '위치를 불러오지 못했습니다.');
      if (!Array.isArray(body.intersections)) throw new Error('위치 정보 서버에 연결되지 않았습니다.');
      if (!controller.signal.aborted) {
        const nextResult = { latitude, longitude, intersections: body.intersections };
        if (locationCache.size >= 100) locationCache.delete(locationCache.keys().next().value);
        locationCache.set(cacheKey, { result: nextResult, expires: Date.now() + 86400000 });
        setResult(nextResult);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setResult(null);
        setError(reason instanceof SyntaxError ? '위치 정보 서버에 연결되지 않았습니다.' : reason.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!enabled || !maps || !map) return;
    const overlays = intersections.map((intersection) => {
      const content = document.createElement('div');
      content.className = 'traffic-map-marker';
      content.title = `${intersection.name} · ${Math.round(intersection.distance)}m · 교차로 중심점`;
      const icon = document.createElement('span');
      icon.className = 'traffic-map-marker-icon';
      icon.textContent = '🚦';
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'traffic-map-marker-name';
      label.textContent = intersection.name;
      content.append(icon, label);
      return new maps.CustomOverlay({ map, position: new maps.LatLng(intersection.latitude, intersection.longitude), content, yAnchor: 1, zIndex: 5 });
    });
    return () => { overlays.forEach((overlay) => overlay.setMap(null)); };
  }, [enabled, latitude, longitude, intersections, mapRef, mapStatus]);

  return <section aria-label="지도 중심 주변 신호등 위치" className="pointer-events-auto w-full max-w-[340px] rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
    <h2 className="text-sm font-bold">지도 중심 {SIGNAL_RADIUS_METERS}m 신호등 위치</h2>
    <button type="button" onClick={showLocations} disabled={!enabled || loading} className="portal-text-link mt-3 disabled:opacity-40">{loading ? '위치 조회 중…' : '이 위치의 신호등 조회'}</button>
    <p role="status" className="mt-3 text-xs leading-relaxed text-muted-foreground">{!enabled ? '지도를 불러오는 중입니다.' : loading ? '반경 100m 안의 신호등 위치를 조회하고 있습니다…' : error || (result?.latitude === latitude && result?.longitude === longitude ? intersections.length ? `${intersections.length}곳의 교차로 위치를 표시합니다.` : '반경 100m 안에 제공되는 신호등 위치가 없습니다.' : '조회 버튼을 누르면 반경 100m 안의 신호등 위치를 표시합니다.')}</p>
    <p className="mt-2 text-xs text-muted-foreground">서울시 제공 교차로 중심점 기준입니다. 개별 신호등 기둥 위치와 다를 수 있습니다.</p>
  </section>;
}
