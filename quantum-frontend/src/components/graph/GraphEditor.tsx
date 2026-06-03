import { Link } from "react-router-dom";
import { GraphEditorCanvas } from "./GraphEditorCanvas";
import "./GraphEditor.css";

export function GraphEditor() {
  return (
    <div className="graph-editor">
      <header className="graph-editor__header">
        <Link to="/app" className="graph-editor__back">
          ← Back to chat
        </Link>
        <h1 className="graph-editor__title">Visual diagram builder</h1>
      </header>
      <div className="graph-editor__body">
        <GraphEditorCanvas />
      </div>
    </div>
  );
}
