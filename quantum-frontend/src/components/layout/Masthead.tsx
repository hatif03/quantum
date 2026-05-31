import "./Masthead.css";

export function Masthead() {
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <p className="masthead">
      <button
        type="button"
        className="masthead__brand"
        onClick={scrollTop}
        aria-label="quantum — scroll to beginning"
      >
        quantum
        <svg
          className="masthead__scribble"
          viewBox="0 0 80 8"
          aria-hidden="true"
        >
          <path
            d="M 2 5 Q 20 2 40 4 T 78 3"
            fill="none"
            stroke="var(--sketch-blue)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </p>
  );
}
