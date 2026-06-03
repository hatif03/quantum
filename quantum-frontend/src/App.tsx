import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppPage } from "./pages/AppPage";
import { GraphEditorPage } from "./pages/GraphEditorPage";
import { JourneyPage } from "./pages/JourneyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JourneyPage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/app/build" element={<GraphEditorPage />} />
        <Route path="/story" element={<Navigate to="/" replace />} />
        <Route path="/lab" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
