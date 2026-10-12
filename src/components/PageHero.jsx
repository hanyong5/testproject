import { Link } from "react-router-dom";

export default function PageHero({ label, eyebrow, title, description }) {
  return (
    <section className="nexis-hero">
      <div className="nexis-container">
        <p className="nexis-breadcrumb"><Link to="/">Home</Link> / {label}</p>
        <p className="nexis-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="nexis-description portal-hero-description">{description}</p>
      </div>
    </section>
  );
}
