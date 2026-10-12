let sdkPromise;

export function loadKakaoMap() {
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps);
  if (sdkPromise) return sdkPromise;

  const key = import.meta.env.VITE_KAKAO_MAP_KEY?.trim();
  if (!key) return Promise.reject(new Error("지도 키가 설정되지 않았습니다."));

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.remove();
      reject(new Error("지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
    };
    const timeout = window.setTimeout(fail, 15000);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      if (!window.kakao?.maps?.load) return fail();
      window.kakao.maps.load(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(window.kakao.maps);
      });
    };
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromise = undefined;
    throw error;
  });
  return sdkPromise;
}
