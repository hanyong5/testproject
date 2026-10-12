# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 주변 신호등 (`/map`)

- `.env`에 `VITE_KAKAO_MAP_KEY`와 서버 전용 `VITE_TDATA_API_KEY`를 설정한 뒤 `npm run dev`를 실행합니다. 환경변수 변경 후 서버를 재시작합니다.
- 지도 중심 반경 100m의 **교차로 중심점**을 조회합니다. 위치 권한을 허용하면 현재 위치로 이동하며, 지도를 드래그한 후 ‘이 위치의 신호등 조회’ 버튼을 눌러 조회합니다. 개별 신호등 기둥의 정확한 위치가 아닙니다. 기존 맛집 검색은 유지됩니다.
- 지도는 `locationsOnly=true`로 교차로 좌표만 조회합니다. 신호 현시·잔여시간 API는 지도 위치 조회에서 호출하지 않습니다.
- 조회 버튼을 누를 때만 요청하며, 같은 위치의 결과는 브라우저 메모리에 24시간 보관합니다. 지도 이동 시 표시는 지우고 자동 조회하지 않습니다.
- 서버는 교차로 좌표 페이지를 `node_modules/.cache/traffic-signals/`에 24시간 캐시합니다. 개발 서버 재시작 후에도 재사용하며, 최초 조회 또는 캐시 만료 시에는 전체 좌표를 여러 페이지로 가져올 수 있습니다.
- 호출 제한 응답의 재시도 시각도 파일에 저장합니다. 브라우저는 남은 대기 시간을 안내하고 제한 시간 동안 재요청을 막습니다. 파일에는 인증키와 실시간 신호 상태를 저장하지 않습니다.
- 로컬 `dev`와 `preview` 모두 API 미들웨어를 제공합니다. **정적 `dist`만 배포하면 API는 동작하지 않습니다.** 운영 서버에서 `server/trafficSignals.mjs`의 `createTrafficMiddleware(VITE_TDATA_API_KEY)`를 `/api/traffic-signals` 경로에 연결해야 합니다.
- 검증: `node --test tests/trafficSignals.test.mjs`, `npm run build`.

공식 자료: [신호 현시](https://t-data.seoul.go.kr/dataprovide/trafficdataviewopenapi.do?data_id=10380), [융합 현시](https://t-data.seoul.go.kr/dataprovide/trafficdataviewopenapi.do?data_id=10381), [잔여시간](https://t-data.seoul.go.kr/dataprovide/trafficdataviewopenapi.do?data_id=10379), [교차로 좌표](https://t-data.seoul.go.kr/dataprovide/trafficdataviewopenapi.do?data_id=10121). 데이터 제공: 서울특별시.

교통 API 키 `VITE_TDATA_API_KEY`는 서버 설정에서만 읽습니다. Vite의 `envPrefix`는 `VITE_KAKAO_`로 제한하여 교통 API 키를 브라우저 환경변수에 노출하지 않습니다.
