import { useEffect } from "react";
import { AppShell } from "../components/app/AppShell";
import "./AppPage.css";

export function AppPage() {
  useEffect(() => {
    document.documentElement.classList.add("app-route");
    return () => {
      document.documentElement.classList.remove("app-route");
    };
  }, []);

  return (
    <div className="app-page">
      <AppShell />
    </div>
  );
}
