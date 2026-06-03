import { useEffect } from "react";
import { GraphEditor } from "../components/graph/GraphEditor";
import "./GraphEditorPage.css";

export function GraphEditorPage() {
  useEffect(() => {
    document.documentElement.classList.add("app-route");
    return () => {
      document.documentElement.classList.remove("app-route");
    };
  }, []);

  return (
    <div className="graph-editor-page">
      <GraphEditor />
    </div>
  );
}
