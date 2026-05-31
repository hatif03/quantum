import { StoryBook } from "../components/story/StoryBook";
import "./StoryPage.css";

export function StoryPage() {
  return (
    <div className="page story-page">
      <header className="story-page__intro">
        <p className="eyebrow">Chapter zero</p>
        <h1>Why Feynman diagrams matter</h1>
        <p>A short book—five pages—to read before you draw.</p>
      </header>
      <StoryBook />
    </div>
  );
}
