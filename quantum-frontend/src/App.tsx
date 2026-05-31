import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { JourneyPage } from "./pages/JourneyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JourneyPage />} />
        <Route path="/story" element={<Navigate to="/" replace />} />
        <Route
          path="/lab"
          element={<Navigate to={{ pathname: "/", hash: "#lab" }} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
