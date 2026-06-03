import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Masthead.css";

export function Masthead() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#lab") {
      window.location.replace("/app");
    }
  }, [location.hash]);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="masthead">
      <button
        type="button"
        className="masthead__brand"
        onClick={scrollTop}
        aria-label="quantum — scroll to beginning"
      >
        quantum
        <svg className="masthead__scribble" viewBox="0 0 80 8" aria-hidden="true">
          <path
            d="M 2 5 Q 20 2 40 4 T 78 3"
            fill="none"
            stroke="var(--sketch-blue)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <Link to="/app" className="btn btn--primary masthead__app-link">
        Try our app
      </Link>
    </header>
  );
}
