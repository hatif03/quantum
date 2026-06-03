import { Link } from "react-router-dom";
import { useConversations } from "../../hooks/useConversations";
import { ChatComposer } from "./ChatComposer";
import { ChatSidebar } from "./ChatSidebar";
import { ChatThread } from "./ChatThread";
import "./AppShell.css";

export function AppShell() {
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
    retryOffline,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const handleRetryOffline = (assistantMessageId: string) => {
    if (!activeConversationId) return;
    void retryOffline(activeConversationId, assistantMessageId);
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
        conversations={conversations}
        activeConversationId={activeConversationId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onCollapse={toggleHistory}
        onSelect={selectConversation}
        onNewChat={startNewChat}
        onDelete={deleteConversation}
        onRename={renameConversation}
      />

      <main className="app-shell__main">
        <ChatThread
          conversation={activeConversation}
          running={running}
          onExampleSelect={setPrompt}
          onRetryOffline={handleRetryOffline}
        />
        <div className="app-shell__composer-wrap">
          <ChatComposer
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
