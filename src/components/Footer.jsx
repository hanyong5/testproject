import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="nexis-footer"><div className="nexis-container footer-grid"><div><Link to="/" className="nexis-logo">NEXIS <small>CORP</small></Link><p>기술로 연결하는 비즈니스의 가능성.</p></div><div><span className="nexis-eyebrow">EXPLORE</span><Link to="/about">회사소개</Link><Link to="/product">제품 & 솔루션</Link></div><div><span className="nexis-eyebrow">CONNECT</span><Link to="/board">게시판 & 소식</Link><Link to="/">Home</Link></div></div><div className="nexis-container footer-bottom">© {new Date().getFullYear()} NEXIS Corp. All rights reserved. <span>샘플 솔루션 소개 페이지</span></div></footer>
  );
}

export default Footer;
