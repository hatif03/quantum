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
      <p className="journey-chapter__lab-intro">
        Pick a mode below, describe a collision or decay, and send. Responses appear above the input.
      </p>
      <ChatWorkbench />
    </JourneyChapter>
  );
}
