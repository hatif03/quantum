import { Link } from "react-router-dom";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <span>Quantum — Feynman diagrams from plain language.</span>
      <Link to="/">Back to top</Link>
    </footer>
  );
}
