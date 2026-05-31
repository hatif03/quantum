import { Link } from "react-router-dom";
import { FeynmanSketch } from "../components/story/FeynmanSketch";
import "./HomePage.css";

export function HomePage() {
  return (
    <div className="page home">
      <div className="home__hero panel">
        <p className="eyebrow">Particle physics, on paper</p>
        <h1>quantum</h1>
        <p className="home__lede">
          Turn collisions and decays into validated Feynman diagrams—maps physicists use to
          calculate, not photographs of the subatomic world.
        </p>
        <div className="home__actions">
          <Link to="/story" className="btn btn--primary">
            Read the story
          </Link>
          <Link to="/lab" className="btn">
            Open the lab
          </Link>
        </div>
        <div className="home__sketch">
          <FeynmanSketch animate showLabels />
        </div>
      </div>
    </div>
  );
}
