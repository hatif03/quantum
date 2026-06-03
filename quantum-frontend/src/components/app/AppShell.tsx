import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useConversations } from "../../hooks/useConversations";
import { useRestoreDiagrams } from "../../hooks/useRestoreDiagrams";
import type { FinalAnswer } from "../../api/types";
import { CompareView } from "./CompareView";
import { ChatComposer } from "./ChatComposer";
import { ChatSidebar } from "./ChatSidebar";
import { ChatThread } from "./ChatThread";
import "./AppShell.css";

export function AppShell() {
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "favorites">("all");
  const [comparePair, setComparePair] = useState<{
    left: { label: string; prompt: string; result: FinalAnswer };
    right: { label: string; prompt: string; result: FinalAnswer };
  } | null>(null);
  const [comparePick, setComparePick] = useState<string[]>([]);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    prompt,
    setPrompt,
    mode,
    setMode,
    running,
    historyOpen,
    toggleHistory,
    setHistoryOpen,
    sendMessage,
    sendWithPrompt,
    retryOffline,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    updateMessageResult,
    toggleStar,
  } = useConversations();

  useRestoreDiagrams({ conversations, updateMessageResult });

  const filteredConversations =
    sidebarFilter === "favorites"
      ? conversations.filter((c) => c.starred)
      : conversations;

  const handleRetryOffline = (assistantMessageId: string) => {
    if (!activeConversationId) return;
    void retryOffline(activeConversationId, assistantMessageId);
  };

  const handleExampleSelect = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    composerRef.current?.focus();
  };

  const handleCompareSelect = (messageId: string, userPrompt: string, _result: FinalAnswer) => {
    setComparePick((prev) => {
      const next = prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId].slice(-2);
      if (next.length === 2 && activeConversation) {
        const items = next
          .map((id, i) => {
            const idx = activeConversation.messages.findIndex((m) => m.id === id);
            const msg = activeConversation.messages[idx];
            const user =
              idx > 0 && activeConversation.messages[idx - 1].role === "user"
                ? activeConversation.messages[idx - 1].text
                : userPrompt;
            if (!msg?.result) return null;
            return {
              messageId: id,
              label: `Diagram ${i + 1}`,
              prompt: user,
              result: msg.result,
            };
          })
          .filter(Boolean) as { label: string; prompt: string; result: FinalAnswer }[];
        if (items.length === 2) {
          setComparePair({ left: items[0], right: items[1] });
          setComparePick([]);
        }
      }
      return next;
    });
  };

  return (
    <div
      className={`app-shell${historyOpen ? "" : " app-shell--history-closed"}`}
    >
      <header className="app-shell__header">
        <div className="app-shell__header-start">
          <button
            type="button"
            className={`app-shell__history-btn${historyOpen ? " app-shell__history-btn--open" : ""}`}
            onClick={toggleHistory}
            aria-label={historyOpen ? "Hide chat history" : "Show chat history"}
            aria-expanded={historyOpen}
            title={historyOpen ? "Hide history" : "Show history"}
          >
            <span className="app-shell__history-icon" aria-hidden="true" />
          </button>
          <Link to="/" className="app-shell__brand">
            quantum
            <svg className="app-shell__scribble" viewBox="0 0 80 8" aria-hidden="true">
              <path
                d="M 2 5 Q 20 2 40 4 T 78 3"
                fill="none"
                stroke="var(--sketch-blue)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>
        <div className="app-shell__header-actions">
          <Link to="/app/build" className="btn btn--ghost app-shell__story-link">
            Build
          </Link>
          <Link to="/" className="btn btn--ghost app-shell__story-link">
            How it works
          </Link>
          <button
            type="button"
            className="btn btn--primary app-shell__new-chat"
            onClick={startNewChat}
          >
            New chat
          </button>
        </div>
      </header>

      <ChatSidebar
        conversations={filteredConversations}
        activeConversationId={activeConversationId}
        open={historyOpen}
        sidebarFilter={sidebarFilter}
        onFilterChange={setSidebarFilter}
        onClose={() => setHistoryOpen(false)}
        onCollapse={toggleHistory}
        onSelect={selectConversation}
        onNewChat={startNewChat}
        onDelete={deleteConversation}
        onRename={renameConversation}
        onToggleStar={toggleStar}
      />

      <main className="app-shell__main">
        {comparePair && (
          <CompareView
            left={comparePair.left}
            right={comparePair.right}
            onClose={() => setComparePair(null)}
          />
        )}
        <ChatThread
          conversation={activeConversation}
          running={running}
          comparePick={comparePick}
          onExampleSelect={handleExampleSelect}
          onRetryOffline={handleRetryOffline}
          onRefinement={(text) => void sendWithPrompt(text, mode)}
          onUpdateResult={
            activeConversationId
              ? (messageId, result) =>
                  updateMessageResult(activeConversationId, messageId, () => result)
              : undefined
          }
          onCompareSelect={handleCompareSelect}
        />
        <div className="app-shell__composer-wrap">
          <ChatComposer
            ref={composerRef}
            prompt={prompt}
            mode={mode}
            running={running}
            onPromptChange={setPrompt}
            onModeChange={setMode}
            onSubmit={() => void sendMessage()}
          />
        </div>
      </main>
    </div>
  );
}
