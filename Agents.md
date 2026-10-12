# 현재 프로젝트 분석

분석일: 2026-10-07 (Asia/Seoul)
분석 범위: src 전체, package.json, Vite·ESLint·shadcn 설정, HTML 진입점, README.
이 파일은 현재 코드 상태를 정리한 분석 문서다. 개선 제안은 아직 코드에 적용하지 않았다.

## 1. 프로젝트 요약

React와 Vite로 구성한 JavaScript SPA의 초기 골격이다. 두 URL에 페이지가 연결되어 있으며, 각 페이지는 이름만 출력한다. 공통 UI 컴포넌트와 테마 설정은 준비되어 있지만 실제 페이지에는 아직 연결되지 않았다.

package.json 선언 기준 주요 기술:

| 기술 | 버전 범위 | 역할 |
| --- | --- | --- |
| React / React DOM | ^19.2.8 | 화면 구성 및 렌더링 |
| Vite | ^8.3.0 | 개발 서버 및 빌드 |
| React Router DOM | ^7.18.4 | URL별 페이지 전환 |
| Tailwind CSS / Vite 플러그인 | ^4.3.3 | 유틸리티 CSS |
| shadcn | ^4.21.3 | UI 구성 및 스타일 기반 |
| Base UI | ^1.8.0 | Button, Input 프리미티브 |
| ESLint | ^10.10.0 | 코드 정적 검사 |

버전 범위는 실제 설치 버전과 다를 수 있다. 이번 빌드에서 실행된 Vite는 8.3.3이다.

## 2. 구조와 실행 흐름

```text
index.html
└─ src/main.jsx
   └─ StrictMode → BrowserRouter → App
      └─ Routes
         ├─ /      → Home
         └─ /sub01 → Subpage1
```

| 파일 | 현재 역할 및 상태 |
| --- | --- |
| src/main.jsx | 전역 CSS를 로드하고 라우터와 App을 렌더링 |
| src/App.jsx | 두 Route 선언. 공통 레이아웃과 미일치 경로 처리는 없음 |
| src/pages/Home.jsx | Home 텍스트 출력 |
| src/pages/Subpage1.jsx | Subpage1 텍스트 출력 |
| src/pages/Header.jsx | 파란 배경의 헤더. 현재 렌더링 트리에 연결되지 않음 |
| src/components/Sample.jsx | props.data 출력 예제. 현재 사용되지 않음 |
| src/components/ui/button.jsx | 변형 및 크기를 지원하는 Base UI 기반 버튼 |
| src/components/ui/card.jsx | Card와 헤더·제목·본문·푸터 등 구성 요소 |
| src/components/ui/input.jsx | Base UI 기반 입력 필드 |
| src/lib/utils.js | cn 패키지의 cn 함수 재내보내기 |
| src/index.css | Tailwind, 폰트, 테마 변수, 기본 스타일 |
| src/App.css | 이전 템플릿 스타일. 현재 import되지 않음 |
| src/components/style.css | .my-button 스타일. 현재 import되지 않음 |

App에는 페이지 이동 링크가 없다. 소스상 /와 /sub01을 직접 방문하면 각 페이지가 렌더링되는 구조다. 다른 URL에 대응하는 Route는 없다.
API 호출, 상태 관리, 폼 제출, 인증, 데이터 저장 로직은 현재 src에서 확인되지 않는다.

## 3. 설정 분석

- vite.config.js에 React와 Tailwind 플러그인이 설정되어 있다.
- @ 경로 별칭은 Vite와 jsconfig.json에서 모두 src를 가리킨다.
- components.json은 JavaScript용 shadcn base-nova 스타일과 neutral 테마를 지정한다.
- UI 컴포넌트들은 cn을 패키지에서 직접 import한다. 설정상 utils 별칭에 해당하는 src/lib/utils.js는 현재 이 컴포넌트들이 사용하지 않는다.
- index.css에 라이트·다크 테마 변수가 있지만, 다크 모드 전환 UI나 상태 로직은 없다.
- README는 React + Vite 기본 템플릿 설명이며 현재 페이지 구성이나 개발 규칙은 담고 있지 않다.
- package.json에 dev, build, lint, preview 스크립트가 있으며 테스트 스크립트는 없다.

## 4. 확인된 문제와 개선 사항

### 우선순위 1: 린트 오류 정리

실행한 npm run lint에서 오류 9개가 발생했다.

| 원인 | 위치 | 개수 | 개선 방향 |
| --- | --- | --- | --- |
| 사용하지 않는 React import | App, Sample, Header, Home, Subpage1, ui/card, ui/input | 7 | 사용하지 않는 import 제거 |
| 컴포넌트와 일반 값의 혼합 export | src/components/ui/button.jsx:57 | 1 | buttonVariants를 별도 모듈로 분리하는 등 Fast Refresh 규칙에 맞게 정리 |
| __dirname 미정의 | vite.config.js:13 | 1 | ESM 방식의 경로 계산으로 변경하고 사용하는 Node 버전과 함께 확인 |

Vite 빌드는 현재 성공한다. 다만 Vite도 __dirname 사용에 대해 향후 native config loader와 호환되지 않는다는 경고를 출력한다. 린트 설정에서 오류를 숨기기보다 ESM에 맞는 경로 표현으로 정리하는 것이 좋다.

### 우선순위 2: 테마 의도 통일

src/index.css 앞부분의 @theme와 뒤쪽 @theme inline에서 같은 토큰을 다시 정의한다.

- --color-primary: 앞에서는 파란색 #1D4ED8, 뒤에서는 var(--primary)로 지정한다. :root의 --primary는 어두운 무채색이다.
- --color-secondary: 앞에서는 #64748B, 뒤에서는 var(--secondary)로 지정한다.
- --font-sans: 앞에서는 Pretendard, 뒤에서는 Geist Variable로 지정한다. html에는 font-sans가 적용된다.
- --font-body에는 Pretendard가 남아 있지만 프로젝트 소스에 Pretendard를 로드하는 선언은 확인되지 않는다.
- --breakpoint-2xl이 1280px로 지정되어 있다. xl은 별도로 정의하지 않으므로 반응형 구간을 설계할 때 Tailwind에서 생성되는 값과 의도를 확인해야 한다.

사용자 지정 색상과 shadcn 의미 기반 토큰 중 기준을 정하고 중복을 정리하면 스타일 예측이 쉬워진다. 실제 브라우저의 계산 스타일은 이번 분석에서 확인하지 않았다.

### 우선순위 3: 페이지 기능 연결

- Header를 공통으로 사용할 경우 App의 공통 레이아웃으로 연결하고 components 디렉터리로 이동하는 방안을 고려한다.
- Link 또는 NavLink로 페이지 이동 수단을 추가한다.
- 미일치 URL을 처리할 페이지가 필요하면 path="*" Route를 추가한다.
- Sample을 학습 예제로 사용할 경우 Home에서 data를 전달해 연결한다. 출력 문구의 '받으자료는'은 '받은 자료는'으로 수정할 수 있다.
- Button, Card, Input은 준비되어 있으나 현재 페이지에서 사용되지 않는다. 실제 화면 요구에 맞춰 연결한다.

### 우선순위 4: 정리 및 문서화

- import되지 않은 App.css와 components/style.css, 미사용 이미지가 필요한지 검토한다.
- 한국어 서비스로 확정되면 index.html의 lang="en"을 ko로 바꾸고 title을 서비스명으로 지정한다.
- README에 프로젝트 목적, 실행 명령, 페이지 경로를 기록한다.
- 따옴표, 세미콜론, 들여쓰기 등 코드 스타일을 통일한다.
- BrowserRouter를 배포할 때는 /sub01 직접 접근과 새로고침이 index.html로 연결되도록 호스팅 설정을 확인한다. 현재 배포 환경은 확인되지 않았다.

## 5. 검증 결과

| 명령 | 결과 |
| --- | --- |
| npm run build | 성공. 26개 모듈 변환, dist 생성. __dirname 관련 경고 발생 |
| npm run lint | 실패. 오류 9개, 경고 0개 |

브라우저 화면, 사용자 상호작용, 배포 환경은 검증하지 않았다. 현재 페이지에서 import되지 않는 UI 컴포넌트의 실제 동작까지 빌드 성공으로 보장하지는 않는다.

## 6. 권장 작업 순서

1. 린트 오류 9개를 해결하고 build와 lint를 재확인한다.
2. 폰트와 색상 토큰의 기준을 정리한다.
3. 공통 헤더, 페이지 이동 링크, 미일치 경로 화면을 연결한다.
4. Home과 Subpage1의 실제 콘텐츠를 구현한다.
5. 불필요한 템플릿 파일과 README를 정리한다.

현재 상태는 기본 라우팅과 UI 기반이 준비된 초기 단계다. 다음 작업은 검사 오류를 정리하고 준비된 컴포넌트를 실제 페이지에 연결하는 것이다.
