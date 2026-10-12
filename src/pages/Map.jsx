import { useEffect, useRef, useState } from "react";
import { ExternalLink, LocateFixed, MapPin, Search, Utensils } from "lucide-react";
import NearbySignals from "../components/NearbySignals";
import { SIGNAL_RADIUS_METERS } from "../lib/trafficSignals";
import { loadKakaoMap } from "../lib/kakaoMap";

const defaultLocation = { name: "서울시청", latitude: 37.5665, longitude: 126.978 };

export default function MapPage() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const followLocationRef = useRef(false);
  const restaurantMarkerRef = useRef(null);
  const searchRequestRef = useRef(0);
  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [location, setLocation] = useState(defaultLocation);
  const [positionRequest, setPositionRequest] = useState(0);
  const [positionStatus, setPositionStatus] = useState("idle");
  const [positionError, setPositionError] = useState("");

  useEffect(() => {
    if (positionRequest === 0) return;
    let cancelled = false;
    let watchId;
    Promise.resolve().then(() => {
      if (cancelled) return;
      if (!window.isSecureContext || !navigator.geolocation) {
        setPositionStatus("error");
        setPositionError("현재 위치는 HTTPS 또는 localhost에서 위치 기능을 지원하는 브라우저로 확인해 주세요.");
        return;
      }
      watchId = navigator.geolocation.watchPosition(
        ({ coords }) => {
          if (cancelled) return;
          setLocation({ name: "현재 위치", latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
          setPositionStatus("ready");
        },
        (reason) => {
          if (cancelled) return;
          setPositionStatus("error");
          setPositionError({
            1: "위치 권한이 거부되었습니다. 브라우저의 사이트 설정에서 위치 권한을 허용한 뒤 다시 시도해 주세요.",
            2: "현재 위치를 확인할 수 없습니다. 기기의 위치 서비스를 확인해 주세요.",
            3: "위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.",
          }[reason.code] || "현재 위치를 가져오지 못했습니다.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
    return () => {
      cancelled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [positionRequest]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let observer;
    let marker;
    let radiusCircle;
    let removeMapListeners;
    const container = containerRef.current;

    loadKakaoMap().then((maps) => {
      if (cancelled) return;
      const center = new maps.LatLng(defaultLocation.latitude, defaultLocation.longitude);
      const map = new maps.Map(container, { center, level: 3 });
      mapRef.current = map;
      marker = new maps.Marker({ map, position: center, title: "지도 중심 · 검색 기준" });
      markerRef.current = marker;
      radiusCircle = new maps.Circle({
        map,
        center,
        radius: SIGNAL_RADIUS_METERS,
        strokeWeight: 2,
        strokeColor: "#2563eb",
        strokeOpacity: 0.9,
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
      });
      const onDragStart = () => { followLocationRef.current = false; };
      const onCenterChanged = () => {
        const currentCenter = map.getCenter();
        marker.setPosition(currentCenter);
        radiusCircle.setPosition(currentCenter);
      };
      const onIdle = () => {
        const position = map.getCenter();
        setMapCenter({ latitude: position.getLat(), longitude: position.getLng() });
      };
      onIdle();
      maps.event.addListener(map, "idle", onIdle);
      maps.event.addListener(map, "dragstart", onDragStart);
      maps.event.addListener(map, "center_changed", onCenterChanged);
      removeMapListeners = () => {
        maps.event.removeListener(map, "idle", onIdle);
        maps.event.removeListener(map, "dragstart", onDragStart);
        maps.event.removeListener(map, "center_changed", onCenterChanged);
      };
      map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT);
      observer = new ResizeObserver(() => {
        const currentCenter = map.getCenter();
        map.relayout();
        map.setCenter(currentCenter);
      });
      observer.observe(container);
      setStatus("ready");
    }).catch((reason) => {
      if (cancelled) return;
      setError(reason.message);
      setStatus("error");
    });

    return () => {
      cancelled = true;
      removeMapListeners?.();
      searchRequestRef.current += 1;
      restaurantMarkerRef.current?.setMap(null);
      restaurantMarkerRef.current = null;
      observer?.disconnect();
      marker?.setMap(null);
      radiusCircle?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
      container.replaceChildren();
    };
  }, [attempt]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !followLocationRef.current) return;
    const center = new window.kakao.maps.LatLng(location.latitude, location.longitude);
    mapRef.current.setCenter(center);
    markerRef.current?.setPosition(center);

  }, [location, status]);

  function requestCurrentLocation() {
   
    followLocationRef.current = true;
    setPositionStatus("loading");
    setPositionError("");
    setPositionRequest((value) => value + 1);
  }

  function resetLocation() {
    const maps = window.kakao?.maps;
    if (!mapRef.current || !maps) return;
   
    followLocationRef.current = true;
    mapRef.current.setLevel(3);
    mapRef.current.panTo(new maps.LatLng(location.latitude, location.longitude));
  }

  function searchRestaurants(event) {
    event.preventDefault();
    const maps = window.kakao?.maps;
    if (!mapRef.current || !query.trim()) return;
    if (!maps?.services) {
      setSearchStatus("error");
      return;
    }
    const request = ++searchRequestRef.current;
    setSearchStatus("loading");
    setRestaurants([]);
    restaurantMarkerRef.current?.setMap(null);
    restaurantMarkerRef.current = null;
    new maps.services.Places().keywordSearch(query.trim(), (places, resultStatus) => {
      if (request !== searchRequestRef.current || !mapRef.current) return;
      if (resultStatus === maps.services.Status.OK) {
        setRestaurants(places);
        setSearchStatus("ready");
      } else {
        setSearchStatus(resultStatus === maps.services.Status.ZERO_RESULT ? "empty" : "error");
      }
    }, { location: mapRef.current.getCenter(), radius: 5000, category_group_code: "FD6", sort: maps.services.SortBy.DISTANCE, size: 10 });
  }

  function showRestaurant(place) {
    const maps = window.kakao?.maps;
    if (!maps || !mapRef.current) return;
    const position = new maps.LatLng(Number(place.y), Number(place.x));
    restaurantMarkerRef.current?.setMap(null);
    restaurantMarkerRef.current = new maps.Marker({ map: mapRef.current, position, title: place.place_name });
    followLocationRef.current = false;
    mapRef.current.panTo(position);
  }

  return (
    <>
      <div className="absolute inset-0 z-0 bg-muted" aria-busy={status === "loading"}>
        <div ref={containerRef} className="h-full w-full" role="region" aria-label={`${location.name} 주변 카카오 지도`} />
        {status !== "ready" && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <MapPin size={32} className="portal-blue" aria-hidden="true" />
          <p role="status" className="text-sm text-muted-foreground">{status === "loading" ? "카카오 지도를 불러오는 중입니다…" : error}</p>
          {status === "error" && <button type="button" className="nexis-cta" onClick={() => { setStatus("loading"); setError(""); setAttempt((value) => value + 1); }}>다시 시도</button>}
        </div>}
      </div>
      <div className="pointer-events-none relative z-20 px-5 pt-3 pb-[520px] md:px-8 md:pt-4">
        <div className="container mx-auto pointer-events-auto rounded-xl border border-border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="flex items-center gap-1.5 text-sm font-bold"><MapPin size={16} className="portal-blue" aria-hidden="true" />위치 안내</h1>
              <span className="text-xs text-muted-foreground">{location.name}{location.accuracy == null ? " · 기본 위치" : ` · 정확도 약 ${Math.round(location.accuracy)}m`}</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400">반경 100m</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button type="button" className="portal-text-link disabled:opacity-40" disabled={positionStatus === "loading"} onClick={requestCurrentLocation}><LocateFixed size={17} />{positionStatus === "loading" ? "위치 확인 중…" : "현재 위치 다시 확인"}</button>
              <button type="button" className="portal-text-link disabled:opacity-40" disabled={status !== "ready"} onClick={resetLocation}><LocateFixed size={17} />{location.accuracy == null ? "기본 위치로" : "현재 위치로"}</button>
              <a className="portal-text-link" href={`https://map.kakao.com/link/map/${encodeURIComponent(location.name)},${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer">카카오맵에서 보기 <ExternalLink size={16} /></a>
            </div>
          </div>
          {(positionStatus === "loading" || positionStatus === "error") && <p role="status" className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {positionStatus === "loading" ? "위치 확인 중입니다. 브라우저의 위치 권한을 허용해 주세요." : `${positionError} ${location.accuracy == null ? "기본 위치를 표시합니다." : "마지막으로 확인한 위치를 표시합니다."}`}
          </p>}
        </div>
        <div className="mt-2 flex justify-end">
          <NearbySignals key={`${status}:${mapCenter.latitude}:${mapCenter.longitude}`} location={mapCenter} mapRef={mapRef} mapStatus={status} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 px-5 md:px-8">
        <section aria-label="주변 맛집 검색" className="container mx-auto pointer-events-auto rounded-xl border border-border bg-background/95 p-5 shadow-lg backdrop-blur-sm md:p-6">
          <label htmlFor="restaurant-search" className="mb-2 flex items-center gap-2 text-lg font-bold"><Utensils size={20} className="portal-blue" aria-hidden="true" />주변 맛집 찾기</label>
          <p id="restaurant-search-hint" className="mb-4 text-sm text-muted-foreground">지도 중심에서 5km 이내의 음식점을 가까운 순으로 최대 10곳 찾아보세요.</p>
          <form role="search" onSubmit={searchRestaurants} className="flex gap-2">
            <input id="restaurant-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="음식이나 식당 이름을 입력하세요" aria-describedby="restaurant-search-hint" required maxLength={100} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
            <button type="submit" disabled={status !== "ready" || searchStatus === "loading" || !query.trim()} className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"><Search size={18} aria-hidden="true" />검색</button>
          </form>
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {searchStatus === "loading" ? "맛집을 찾고 있습니다…" : searchStatus === "empty" ? "검색 결과가 없습니다. 다른 음식이나 식당 이름으로 검색해 주세요." : searchStatus === "error" ? "검색하지 못했습니다. 잠시 후 다시 시도해 주세요." : searchStatus === "ready" ? `${restaurants.length}곳을 찾았습니다. 식당 이름을 누르면 지도에 표시합니다.` : status !== "ready" ? "지도가 준비되면 검색할 수 있습니다." : "예: 파스타, 삼겹살, 초밥"}
          </p>
          {restaurants.length > 0 && <ul className="mt-3 max-h-48 divide-y divide-border overflow-y-auto">
            {restaurants.map((place) => <li key={place.id} className="flex items-center justify-between gap-3 py-3">
              <button type="button" onClick={() => showRestaurant(place)} className="min-w-0 text-left hover:text-blue-600">
                <span className="block text-sm font-semibold">{place.place_name}</span>
                <span className="block text-xs text-muted-foreground">{place.road_address_name || place.address_name}{place.distance && ` · ${place.distance}m`}</span>
              </button>
              <a href={`https://place.map.kakao.com/${encodeURIComponent(place.id)}`} target="_blank" rel="noopener noreferrer" className="portal-text-link shrink-0" aria-label={`${place.place_name} 상세 보기 (새 탭)`}>상세 <ExternalLink size={14} aria-hidden="true" /></a>
            </li>)}
          </ul>}
        </section>
      </div>
    </>
  );
}
