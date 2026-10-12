export const SIGNAL_RADIUS_METERS = 100;
export const SIGNAL_STALE_MS = 15000;
const directions = { nt: '북', ne: '북동', et: '동', se: '남동', st: '남', sw: '남서', wt: '서', nw: '북서' };
const movements = { Pdsg: '보행', Stsg: '직진', Ltsg: '좌회전', Utsg: '유턴', Bssg: '버스', Bcsg: '자전거' };
const states = {
  'stop-And-Remain': ['적색', 'red', false],
  'stop-Then-Proceed': ['적색 점멸', 'red', true],
  'protected-Movement-Allowed': ['녹색', 'green', false],
  'permissive-Movement-Allowed': ['비보호 진행', 'green', false],
  'protected-clearance': ['황색', 'yellow', false],
  'permissive-clearance': ['황색', 'yellow', false],
  'caution-Conflicting-Traffic': ['황색 점멸', 'yellow', true],
  dark: ['소등', 'gray', false],
  unavailable: ['정보 없음', 'gray', false],
};

export function distanceMeters(a, b) {
  const rad = Math.PI / 180;
  const dlat = (b.latitude - a.latitude) * rad;
  const dlng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dlng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function nearbyIntersections(rows, location) {
  return rows.map((row) => ({
    id: String(row.itstId), name: row.itstNm || `교차로 ${row.itstId}`,
    latitude: Number(row.mapCtptIntLat), longitude: Number(row.mapCtptIntLot),
  })).filter((row) => row.latitude > 0 && row.latitude <= 90 && row.longitude > 0 && row.longitude <= 180)
    .map((row) => ({ ...row, distance: distanceMeters(location, row) }))
    .filter((row) => row.distance <= SIGNAL_RADIUS_METERS).sort((a, b) => a.distance - b.distance);
}

export function normalizeSignals(fusion, phase, timing) {
  const records = [fusion, phase, timing].filter(Boolean).sort((a, b) => Number(b.trsmUtcTime || 0) - Number(a.trsmUtcTime || 0));
  return Object.entries(directions).flatMap(([direction, directionLabel]) => Object.entries(movements).flatMap(([movement, movementLabel]) => {
    const key = direction + movement;
    const stateRecord = records.find((row) => row[key + 'StatNm'] != null);
    const timeRecord = records.find((row) => row[key + 'RmdrCs'] != null);
    if (!stateRecord && !timeRecord) return [];
    const rawState = stateRecord?.[key + 'StatNm'];
    const [label, color, flashing] = states[rawState] || ['알 수 없음', 'gray', false];
    const observedAt = Number(stateRecord?.trsmUtcTime) || null;
    // Never attach a countdown from a different signal phase snapshot.
    const aligned = stateRecord && timeRecord && stateRecord.dataId === timeRecord.dataId && observedAt === Number(timeRecord.trsmUtcTime);
    const rawRemaining = aligned ? Number(timeRecord[key + 'RmdrCs']) : NaN;
    const remainingSeconds = Number.isFinite(rawRemaining) && rawRemaining >= 0 && rawRemaining < 36000 ? rawRemaining / 10 : null;
    return [{ key, direction: directionLabel, movement: movementLabel, label, color, flashing, observedAt, remainingSeconds }];
  }));
}

export function signalDisplay(signal, now) {
  const age = now - signal.observedAt;
  const fresh = signal.observedAt != null && age >= -5000 && age <= SIGNAL_STALE_MS;
  const remaining = fresh && signal.remainingSeconds != null ? Math.max(0, signal.remainingSeconds - Math.max(0, age) / 1000) : null;
  const expired = remaining === 0;
  return {
    label: !fresh ? '갱신 지연' : expired ? '전환 확인 중' : signal.label,
    color: fresh && !expired ? signal.color : 'gray',
    flashing: fresh && !expired && signal.flashing,
    remaining: remaining != null && remaining > 0 ? Math.ceil(remaining) : null,
  };
}
