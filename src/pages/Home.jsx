import RecentPosts from "../components/RecentPosts";
import { Link } from "react-router-dom";
import { ArrowRight, Cloud, Database, ShieldCheck, Layers } from "lucide-react";

const solutions = [
  { icon: Cloud, tag: "01 / CLOUD", title: "Nexis Cloud Core", description: "분산된 인프라를 하나로. 비즈니스의 성장에 맞춰 유연하게 확장하는 클라우드.", feature: "하이브리드 인프라 · 운영 자동화" },
  { icon: Database, tag: "02 / DATA & AI", title: "Nexis Flow AI", description: "흩어진 데이터를 가치 있는 인사이트로. 실시간으로 연결되는 데이터 파이프라인.", feature: "실시간 분석 · AI 워크플로" },
  { icon: ShieldCheck, tag: "03 / SECURITY", title: "Nexis Shield Enterprise", description: "연결의 모든 순간을 안전하게. 기업의 핵심 자산을 지키는 통합 보안.", feature: "제로 트러스트 · 접근 제어" },
];

export default function Home() {
  return (
    <>
      <section className="nexis-hero portal-home-hero"><div className="nexis-container home-hero-grid">
        <div><p className="nexis-eyebrow">CONNECTED TECHNOLOGY. CLEAR POSSIBILITIES.</p><h1>복잡한 기술을 넘어,<br />비즈니스의<br /><span className="portal-blue">다음 가능성으로.</span></h1><p className="nexis-description">클라우드, 데이터, 보안을 하나의 흐름으로 연결합니다.<br />넥시스와 함께 더 유연하고 단단한 미래를 설계하세요.</p><div className="portal-actions"><Link className="nexis-cta" to="/product">솔루션 둘러보기 <ArrowRight size={17} /></Link><Link className="portal-text-link" to="/about">NEXIS 알아보기 <ArrowRight size={16} /></Link></div></div>
        <div className="platform-visual" aria-label="클라우드, 데이터, 보안을 연결하는 NEXIS 플랫폼"><div className="platform-top"><span>NEXIS SYSTEM ARCHITECTURE</span><span className="platform-status">● CONNECTED</span></div><div className="platform-core"><Layers size={36} /><strong>NEXIS</strong><span>INTELLIGENT PLATFORM</span></div><div className="platform-connectors" /><div className="platform-nodes">{solutions.map(({ icon: Icon, tag }) => <div key={tag}><Icon size={25} /><span>{tag.split(" / ")[1]}</span></div>)}</div><p>ONE PLATFORM. CONNECTED POSSIBILITIES.</p></div>
      </div></section>
      <section className="portal-principles"><div className="nexis-container">{[["CONNECT", "흩어진 기술을 하나로"], ["SIMPLIFY", "복잡한 운영을 명쾌하게"], ["SCALE", "비즈니스에 맞춰 유연하게"]].map(([tag, text]) => <div key={tag}><span className="nexis-eyebrow">{tag}</span><strong>{text}</strong></div>)}</div></section>
      <section className="nexis-container nexis-section"><div className="section-heading"><div><p className="nexis-eyebrow">OUR SOLUTIONS</p><h2>하나의 연결, 세 가지 핵심 역량</h2></div><Link className="portal-text-link" to="/product">전체 제품 보기 <ArrowRight size={16} /></Link></div><div className="industry-grid">{solutions.map(({ icon: Icon, tag, title, description, feature }) => <article className="industry-card home-solution" key={tag}><Icon className="portal-blue" size={30} /><p className="nexis-eyebrow">{tag}</p><h3>{title}</h3><p>{description}</p><div className="industry-bottom">{feature}</div></article>)}</div></section>
      <section className="nexis-container"><div className="developer-panel"><div><p className="nexis-eyebrow">BUILT AROUND YOUR BUSINESS</p><h2>기술의 중심에는<br />언제나 비즈니스가 있습니다.</h2><p>운영 환경과 성장 목표를 먼저 이해하고,<br />필요한 기술을 연결하는 것. 넥시스가 지향하는 방식입니다.</p></div><div className="home-story"><span>ABOUT NEXIS</span><p>연결은 더 간결하게.<br />가능성은 더 넓게.</p><Link className="portal-text-link" to="/about">우리의 방향 알아보기 <ArrowRight size={16} /></Link></div></div></section>
      <section className="nexis-container nexis-section"><div className="section-heading"><div><p className="nexis-eyebrow">NEWS & UPDATES</p><h2>NEXIS 소식</h2></div><Link className="portal-text-link" to="/board">게시판 바로가기 <ArrowRight size={16} /></Link></div><RecentPosts /></section>
    </>
  );
}
