import { NavLink } from "react-router-dom";
import "./Header.css";

export function Header() {
  return (
    <header className="header panel">
      <NavLink to="/" className="header__brand" aria-label="quantum home">
        <span className="header__mark" aria-hidden="true">
          q
        </span>
        <span>quantum</span>
      </NavLink>
      <nav className="header__nav" aria-label="Primary">
        <NavLink to="/story" className={({ isActive }) => (isActive ? "active" : "")}>
          Story
        </NavLink>
        <NavLink to="/lab" className={({ isActive }) => (isActive ? "active" : "")}>
          Lab
        </NavLink>
      </nav>
    </header>
  );
}
