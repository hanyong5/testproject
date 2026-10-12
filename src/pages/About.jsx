import { Link } from "react-router-dom";
import { ArrowRight, Network, ShieldCheck, Compass } from "lucide-react";
import PageHero from "../components/PageHero";

export default function About() {
  return (
    <>
      <PageHero label="회사소개" eyebrow="ABOUT NEXIS" title={<>기술을 연결하고,<br />비즈니스의 가능성을 넓힙니다.</>} description="NEXIS는 클라우드, 데이터, 보안을 연결하는 엔터프라이즈 기술 브랜드입니다. 복잡한 기술이 명쾌한 비즈니스 경험으로 이어지는 미래를 지향합니다." />
      <section className="nexis-container nexis-section about-mission"><div><p className="nexis-eyebrow">OUR DIRECTION</p><h2>더 많은 기술보다,<br />더 나은 연결을 생각합니다.</h2></div><div><p>기업의 기술 환경은 갈수록 복잡해지고 있습니다. 각각의 시스템이 제 역할을 넘어 함께 작동할 때, 비즈니스는 더 큰 가능성을 만날 수 있습니다.</p><p>넥시스는 인프라 운영부터 데이터 활용과 보안까지 하나의 관점으로 바라봅니다. 일관된 경험과 유연한 설계를 통해 기술의 복잡함을 줄이는 것이 우리의 방향입니다.</p></div></section>
      <section className="comparison-section"><div className="nexis-container"><div className="center-heading"><p className="nexis-eyebrow">WHAT WE VALUE</p><h2>우리가 지향하는 세 가지 원칙</h2></div><div className="industry-grid">{[{ icon: Network, title: "연결성", text: "서로 다른 환경과 데이터를 자연스럽게 연결하고, 통합된 관점에서 운영할 수 있도록 설계합니다." }, { icon: ShieldCheck, title: "신뢰성", text: "보안을 설계의 시작점으로 삼고, 안정적인 운영을 위한 기반을 우선합니다." }, { icon: Compass, title: "유연성", text: "변화하는 비즈니스 요구에 맞춰 필요한 기능을 선택하고 확장할 수 있는 구조를 지향합니다." }].map(({ icon: Icon, title, text }, index) => <article className="industry-card value-card" key={title}><div className="value-number">0{index + 1}<Icon size={25} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="nexis-container nexis-section"><div className="section-heading"><div><p className="nexis-eyebrow">HOW IT CONNECTS</p><h2>기반부터 가치까지, 하나의 흐름</h2></div><p>제품을 관통하는 NEXIS의 설계 철학</p></div><div className="about-steps">{[["01", "기반을 연결하다", "Cloud Core", "인프라를 통합하고 유연한 운영 환경을 구성합니다."], ["02", "데이터를 활용하다", "Flow AI", "데이터의 흐름을 연결해 의사결정에 필요한 인사이트를 찾습니다."], ["03", "신뢰를 더하다", "Shield Enterprise", "접근과 데이터를 보호해 연결의 기반을 단단하게 만듭니다."]].map(([number, title, product, text]) => <article key={number}><span className="nexis-eyebrow">STEP {number}</span><h3>{title}</h3><strong>{product}</strong><p>{text}</p></article>)}</div></section>
      <section className="nexis-container nexis-section"><div className="contact-panel"><div><p className="nexis-eyebrow">EXPLORE OUR PLATFORM</p><h2>우리의 방향을<br />솔루션으로 만나보세요.</h2><p>비즈니스에 맞는 기술 조합을 살펴보세요.</p></div><Link className="nexis-cta" to="/product">제품 & 솔루션 <ArrowRight size={18} /></Link></div></section>
    </>
  );
}
