import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { HomePage } from "./pages/HomePage";
import { StoryPage } from "./pages/StoryPage";

const LabPage = lazy(() =>
  import("./pages/LabPage").then((m) => ({ default: m.LabPage })),
);

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Suspense fallback={<div className="page">Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/lab" element={<LabPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
