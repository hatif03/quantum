import { ChatWorkbench } from "../lab/ChatWorkbench";
import { JourneyChapter } from "./JourneyChapter";
import "./LabChapter.css";

export function LabChapter() {
  return (
    <JourneyChapter
      id="lab"
      title="Try it"
      snap={false}
      framed={false}
      className="journey-chapter--lab"
    >
      <ChatWorkbench />
    </JourneyChapter>
  );
}
