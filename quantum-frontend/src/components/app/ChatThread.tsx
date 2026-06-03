import { useEffect, useRef } from "react";
import { PROCESS_EXAMPLES } from "../../api/mock";
import type { FinalAnswer } from "../../api/types";
import type { Conversation } from "../../types/chat";
import { MathBlock } from "../sketch/MathBlock";
import { AssistantMessage } from "./AssistantMessage";
import "../lab/ChatWorkbench.css";
import "./ChatThread.css";

interface ChatThreadProps {
  conversation: Conversation | null;
  running: boolean;
  comparePick?: string[];
  onExampleSelect: (prompt: string) => void;
  onRetryOffline: (assistantMessageId: string) => void;
  onRefinement?: (prompt: string) => void;
  onUpdateResult?: (messageId: string, result: FinalAnswer) => void;
  onCompareSelect?: (messageId: string, userPrompt: string, result: FinalAnswer) => void;
}

export function ChatThread({
  conversation,
  running,
  comparePick = [],
  onExampleSelect,
  onRetryOffline,
  onRefinement,
  onUpdateResult,
  onCompareSelect,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = conversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.status]);

  if (!hasMessages) {
    return (
      <div className="chat-thread chat-thread--empty">
        <div className="chat-thread__welcome">
          <h1 className="chat-thread__welcome-title">What process shall we map?</h1>
          <p className="chat-thread__welcome-body">
            Describe a collision or decay, ask for the math, or request a full teach-mode
            lesson with linked diagrams.
          </p>
          <div
            className="chat-thread__suggestions"
            role="group"
            aria-label="Suggested prompts"
          >
            {PROCESS_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                className="chat-thread__suggestion chip"
                onClick={() => onExampleSelect(ex.prompt)}
              >
                <MathBlock latex={ex.shortLatex} />
                <span className="chat-thread__suggestion-label">{ex.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-thread" role="log" aria-live="polite">
      {onCompareSelect && (
        <p className="chat-thread__compare-hint">
          Compare mode: click two assistant replies to compare side-by-side.
        </p>
      )}
      <div className="chat-thread__messages">
        {messages.map((message, index) => {
          if (message.role === "user") {
            return (
              <div
                key={message.id}
                className="chat-workbench__message chat-workbench__message--user chat-thread__bubble"
              >
                <p>{message.text}</p>
              </div>
            );
          }

          const userPrompt =
            index > 0 && messages[index - 1].role === "user"
              ? messages[index - 1].text
              : "";

          const isCompareSelected = comparePick.includes(message.id);

          return (
            <div
              key={message.id}
              className={`chat-workbench__message chat-workbench__message--assistant chat-thread__bubble${isCompareSelected ? " chat-thread__bubble--compare" : ""}`}
            >
              {onCompareSelect && message.result && message.status === "done" && (
                <button
                  type="button"
                  className="chat-thread__compare-btn btn btn--ghost"
                  onClick={() =>
                    onCompareSelect(message.id, userPrompt, message.result!)
                  }
                >
                  {isCompareSelected ? "Selected" : "Compare"}
                </button>
              )}
              <AssistantMessage
                message={message}
                userPrompt={userPrompt}
                running={running}
                onRetryOffline={() => onRetryOffline(message.id)}
                onRefinement={onRefinement}
                onUpdateResult={
                  onUpdateResult
                    ? (result) => onUpdateResult(message.id, result)
                    : undefined
                }
              />
            </div>
          );
        })}
        <div ref={bottomRef} className="chat-thread__anchor" aria-hidden="true" />
      </div>
    </div>
  );
}
