import type { Conversation, PersistedChatState } from "../types/chat";

export const STORAGE_KEY = "quantum:conversations:v1";
export const ACTIVE_KEY = "quantum:activeConversationId";
export const HISTORY_OPEN_KEY = "quantum:historyOpen:v1";
export const MAX_CONVERSATIONS = 10;

export function prepareForPersistence(conversations: Conversation[]): Conversation[] {
  return [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
}

export function loadPersistedState(): PersistedChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeRaw = localStorage.getItem(ACTIVE_KEY);
    const conversations = raw ? (JSON.parse(raw) as Conversation[]) : [];
    const activeConversationId = activeRaw || null;
    return { conversations, activeConversationId };
  } catch {
    return { conversations: [], activeConversationId: null };
  }
}

export function savePersistedState(
  conversations: Conversation[],
  activeConversationId: string | null,
): void {
  try {
    const prepared = prepareForPersistence(conversations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prepared));
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_KEY, activeConversationId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function truncateTitle(text: string, max = 48): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function newConversationId(): string {
  return crypto.randomUUID();
}

export function newMessageId(): string {
  return crypto.randomUUID();
}

export function loadHistoryOpen(): boolean {
  try {
    const raw = localStorage.getItem(HISTORY_OPEN_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function saveHistoryOpen(open: boolean): void {
  try {
    localStorage.setItem(HISTORY_OPEN_KEY, String(open));
  } catch {
    // ignore
  }
}
