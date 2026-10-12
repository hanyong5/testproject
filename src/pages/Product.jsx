import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Cloud, ShieldCheck, Zap, Code2, Activity, Database } from "lucide-react";

const products = [
  { id: "cloud", tag: "CORE INFRA", meta: "Architecture Suite", name: "Nexis Cloud Core", description: "차세대 하이브리드 멀티클라우드 오케스트레이션 플랫폼입니다. 분산된 인프라를 하나의 제어판에서 통합하고, 워크로드에 따른 탄력적인 자원 할당으로 운영을 단순화합니다.", features: ["멀티클라우드 비용 통합 관리", "워크로드 자동 스케일링", "IaC 기반 인프라 프로비저닝", "하이브리드 네트워크 구성"], metric: "복잡한 인프라를 하나의 플랫폼으로", icon: Cloud },
  { id: "ai", tag: "DATA & AI", meta: "Real-time Stream Engine", name: "Nexis Flow AI", description: "실시간 데이터 처리와 엔터프라이즈 AI를 연결하는 데이터 파이프라인 솔루션입니다. 다양한 데이터를 통합하고, 비즈니스에 필요한 인사이트를 더 빠르게 발견하세요.", features: ["실시간 이벤트 스트리밍", "드래그 앤 드롭 파이프라인", "머신러닝 기반 이상 징후 탐지", "사내 문서 기반 AI 검색"], metric: "데이터에서 의사결정까지, 실시간으로", icon: Zap },
  { id: "security", tag: "ZERO TRUST", meta: "Security & Compliance", name: "Nexis Shield Enterprise", description: "제로 트러스트 기반의 통합 보안 솔루션입니다. 접근 제어부터 데이터 보호, 컴플라이언스 점검까지 연결해 기업의 중요한 자산을 안전하게 관리합니다.", features: ["역할 기반 접근 제어", "중요 데이터 암호화", "보안 정책 통합 모니터링", "위협 탐지 및 대응 자동화"], metric: "비즈니스의 모든 순간을 안전하게", icon: ShieldCheck },
];
const filters = [["all", "전체 솔루션"], ["cloud", "클라우드 인프라"], ["ai", "데이터 & AI 파이프라인"], ["security", "엔터프라이즈 보안"]];

function Dashboard({ type }) {
  return (
    <div className={`nexis-dashboard ${type}`} aria-label="솔루션 대시보드 예시">
      <div className="dashboard-top"><span className="dashboard-dots">● ● ●</span><span>NEXIS / LIVE CONSOLE</span><span className="live-dot">● CONNECTED</span></div>
      <div className="dashboard-heading">{type === "ai" ? "Pipeline Throughput" : type === "cloud" ? "Infrastructure overview" : "Security command center"}<Activity size={20} /></div>
      <div className="dashboard-number">{type === "ai" ? "2,500,000" : type === "cloud" ? "128" : "99.99%"}<small>{type === "ai" ? "events / sec" : type === "cloud" ? "active nodes" : "protected"}</small></div>
      <svg viewBox="0 0 400 130" role="img" aria-label="시간에 따라 증가하는 예시 데이터 그래프"><path d="M0 110 C40 30 60 40 100 70 S160 90 195 45 S250 10 280 65 S345 145 400 15 L400 130 L0 130Z" fill="currentColor" opacity=".12" /><path d="M0 110 C40 30 60 40 100 70 S160 90 195 45 S250 10 280 65 S345 145 400 15" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
      <div className="dashboard-stats"><span>LATENCY<strong>4.2 ms</strong></span><span>ACTIVE NODES<strong>64 pods</strong></span><span>SYSTEM HEALTH<strong>Optimal</strong></span></div>
      <p className="dashboard-caption">ILLUSTRATIVE DATA · 대시보드 예시</p>
    </div>
  );
}

function Product() {
  const [filter, setFilter] = useState("all");
  return (
    <>
      <section className="nexis-hero">
        <div className="nexis-container">
          <p className="nexis-breadcrumb"><Link to="/">Home</Link> / 제품 & 솔루션</p>
          <div className="hero-layout"><div><p className="nexis-eyebrow">NEXIS INTELLIGENT SOLUTIONS</p><h1>엔터프라이즈를 위한 통합<br className="desktop-break" /> 인텔리전스 & 클라우드 스택</h1><p className="nexis-description">대규모 데이터 분석부터 무중단 워크로드 자동화까지.<br />복잡한 비즈니스를 명쾌하게 연결하는 넥시스의 기술을 만나보세요.</p></div><div className="hero-mark"><Database size={36} /><span>ONE PLATFORM.<br /><strong>LIMITLESS POSSIBILITY.</strong></span></div></div>
          <div className="nexis-filters" aria-label="솔루션 필터">{filters.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        </div>
      </section>
      <section className="nexis-container nexis-section">
        <div className="section-heading"><div><p className="nexis-eyebrow">CORE PRODUCT LINEUP</p><h2>혁신을 현실로 이끄는 세 가지 핵심 스택</h2></div><p>각 컴포넌트는 독립적으로, 함께라면 더욱 강력하게.<br />기업의 성장에 맞춰 유연하게 확장하세요.</p></div>
        <div className="product-stack">{products.filter((p) => filter === "all" || p.id === filter).map((p) => <article key={p.id} className={`solution-card ${p.id === "ai" ? "reverse" : ""}`}><div className="solution-copy"><div className="solution-tag"><span>{p.tag}</span>{p.meta}</div><h3>{p.name}</h3><p className="nexis-description">{p.description}</p><ul className="solution-features">{p.features.map((feature) => <li key={feature}><CheckCircle2 size={15} />{feature}</li>)}</ul><div className="solution-metric"><p.icon size={25} /><strong>{p.metric}</strong></div></div><Dashboard type={p.id} /></article>)}</div>
      </section>
      <section className="comparison-section"><div className="nexis-container"><div className="center-heading"><p className="nexis-eyebrow">TIER COMPARISON MATRIX</p><h2>기업 규모에 최적화된 에디션 비교</h2><p>비즈니스 환경과 필요한 기능에 맞는 플랜을 살펴보세요.</p></div><div className="table-scroll"><table><caption>에디션별 제공 기능 예시 · 실제 제공 조건은 상담 시 확인</caption><thead><tr><th scope="col">기능 및 서비스</th><th scope="col">Enterprise Standard</th><th scope="col">Enterprise Pro</th><th scope="col">Global Scale</th></tr></thead><tbody>{[["인프라 관리", "기본 통합 관리", "고급 자동화", "글로벌 통합 운영"], ["데이터 파이프라인", "기본 제공", "확장 제공", "맞춤 구성"], ["고객 지원", "이메일 지원", "우선 지원", "전담 지원"], ["보안 정책 관리", "기본 정책", "고급 정책", "맞춤 정책"], ["전담 기술 매니저", "—", "선택 옵션", "제공"], ["도입 방식", "표준 구성", "확장 구성", "맞춤 설계"]].map(([name, ...values]) => <tr key={name}><th scope="row">{name}</th>{values.map((value, i) => <td key={i}>{value}</td>)}</tr>)}</tbody></table></div></div></section>
      <section className="nexis-container nexis-section"><div className="section-heading"><div><p className="nexis-eyebrow">POSSIBILITIES IN PRACTICE</p><h2>산업별로 만나는 새로운 가능성</h2></div><p>솔루션 활용 시나리오</p></div><div className="industry-grid">{[["금융 & 핀테크", "실시간 이상거래 탐지", "흩어진 거래 데이터를 연결하고, 이상 패턴을 빠르게 포착해 더 안전한 금융 경험을 만듭니다."], ["제조 & 스마트팩토리", "생산 현장의 지능적인 연결", "설비 데이터를 실시간으로 분석해 운영 상태를 파악하고 공정 최적화를 지원합니다."], ["이커머스 & 리테일", "트래픽 변화에도 유연하게", "수요에 따라 인프라를 확장하고, 고객에게 안정적인 쇼핑 경험을 제공합니다."]].map(([tag, title, description]) => <article className="industry-card" key={tag}><span className="nexis-eyebrow">{tag}</span><h3>{title}</h3><p>{description}</p><span className="industry-bottom">NEXIS SOLUTIONS <ArrowRight size={17} /></span></article>)}</div></section>
      <section className="nexis-container"><div className="developer-panel"><div><p className="nexis-eyebrow">DEVELOPER & ARCHITECT HUB</p><h2>개발자와 아키텍트를 위한<br />더 간결한 기술 경험</h2><p>일관된 인터페이스와 유연한 아키텍처로<br />아이디어를 비즈니스의 다음 단계로 연결합니다.</p></div><div className="developer-items"><div><Code2 /><span><strong>API 중심의 유연한 연결</strong><small>서비스와 데이터를 하나의 흐름으로</small></span></div><div><Cloud /><span><strong>확장 가능한 클라우드 아키텍처</strong><small>비즈니스 규모에 맞춘 인프라 설계</small></span></div></div></div></section>
      <section className="nexis-container nexis-section"><div className="contact-panel"><div><p className="nexis-eyebrow">ENTERPRISE FAST-TRACK</p><h2>우리 기업에 딱 맞는 솔루션,<br />함께 찾아보세요.</h2><p>비즈니스의 다음 도약을 위한 기술을 만나보세요.</p></div><Link className="nexis-cta" to="/board">게시판에서 소식 확인 <ArrowRight size={18} /></Link></div></section>

    </>
  );
}

export default Product;
