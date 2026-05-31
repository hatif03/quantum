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
      </button>
    </p>
  );
}
