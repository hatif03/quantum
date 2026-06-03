import { useMemo, useState } from "react";
import type { Conversation } from "../../types/chat";
import "./ChatSidebar.css";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  open: boolean;
  sidebarFilter: "all" | "favorites";
  onFilterChange: (filter: "all" | "favorites") => void;
  onClose: () => void;
  onCollapse: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onToggleStar: (id: string) => void;
}

type DateGroup = "today" | "yesterday" | "older";

function groupLabel(group: DateGroup): string {
  if (group === "today") return "Today";
  if (group === "yesterday") return "Yesterday";
  return "Older";
}

function dateGroup(updatedAt: number): DateGroup {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;

  if (updatedAt >= startOfToday) return "today";
  if (updatedAt >= startOfYesterday) return "yesterday";
  return "older";
}

function groupConversations(conversations: Conversation[]) {
  const groups: Record<DateGroup, Conversation[]> = {
    today: [],
    yesterday: [],
    older: [],
  };

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const conv of sorted) {
    groups[dateGroup(conv.updatedAt)].push(conv);
  }

  return (["today", "yesterday", "older"] as const).filter(
    (key) => groups[key].length > 0,
  ).map((key) => ({ key, items: groups[key] }));
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  open,
  sidebarFilter,
  onFilterChange,
  onClose,
  onCollapse,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  onToggleStar,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const grouped = useMemo(() => groupConversations(filtered), [filtered]);

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <>
      <div
        className={`chat-sidebar__backdrop${open ? " chat-sidebar__backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`chat-sidebar${open ? " chat-sidebar--open" : ""}`}
        aria-label="Chat history"
      >
        <div className="chat-sidebar__header">
          <button type="button" className="btn btn--primary chat-sidebar__new" onClick={onNewChat}>
            New chat
          </button>
          <button
            type="button"
            className="chat-sidebar__collapse"
            onClick={onCollapse}
            aria-label="Hide chat history"
            title="Hide history"
          >
            ‹
          </button>
        </div>

        <div className="chat-sidebar__toolbar">
          <input
            type="search"
            className="chat-sidebar__search"
            placeholder="Search chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search conversations"
          />
          <div className="chat-sidebar__filters" role="tablist">
            <button
              type="button"
              role="tab"
              className={`chat-sidebar__filter${sidebarFilter === "all" ? " chat-sidebar__filter--active" : ""}`}
              onClick={() => onFilterChange("all")}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              className={`chat-sidebar__filter${sidebarFilter === "favorites" ? " chat-sidebar__filter--active" : ""}`}
              onClick={() => onFilterChange("favorites")}
            >
              Favorites
            </button>
          </div>
        </div>

        <nav className="chat-sidebar__list">
          {grouped.length === 0 && (
            <p className="chat-sidebar__empty">No conversations yet.</p>
          )}
          {grouped.map(({ key, items }) => (
            <div key={key} className="chat-sidebar__group">
              <h2 className="chat-sidebar__group-label">{groupLabel(key)}</h2>
              <ul className="chat-sidebar__items">
                {items.map((conv) => (
                  <li key={conv.id} className="chat-sidebar__item">
                    {renamingId === conv.id ? (
                      <input
                        className="chat-sidebar__rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        autoFocus
                        aria-label="Rename conversation"
                      />
                    ) : (
                      <button
                        type="button"
                        className={`chat-sidebar__conv-btn${
                          conv.id === activeConversationId
                            ? " chat-sidebar__conv-btn--active"
                            : ""
                        }`}
                        onClick={() => onSelect(conv.id)}
                      >
                        {conv.starred && <span aria-hidden="true">★ </span>}
                        {conv.title}
                      </button>
                    )}
                    <div className="chat-sidebar__item-actions">
                      <button
                        type="button"
                        className="chat-sidebar__action"
                        onClick={() => onToggleStar(conv.id)}
                        aria-label={conv.starred ? "Unstar" : "Star"}
                      >
                        {conv.starred ? "Unstar" : "Star"}
                      </button>
                      <button
                        type="button"
                        className="chat-sidebar__action"
                        onClick={() => {
                          setRenamingId(conv.id);
                          setRenameValue(conv.title);
                        }}
                        aria-label={`Rename ${conv.title}`}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="chat-sidebar__action chat-sidebar__action--danger"
                        onClick={() => onDelete(conv.id)}
                        aria-label={`Delete ${conv.title}`}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
