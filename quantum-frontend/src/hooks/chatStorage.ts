import type { Conversation, PersistedChatState } from "../types/chat";
import {
  ACTIVE_KEY,
  HISTORY_OPEN_KEY,
  loadHistoryOpen,
  STORAGE_KEY,
} from "./chatPersistence";

const DB_NAME = "quantum-chat";
const DB_VERSION = 1;
const STORE_META = "meta";
const STORE_CONVERSATIONS = "conversations";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
      if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
        db.createObjectStore(STORE_CONVERSATIONS, { keyPath: "id" });
      }
    };
  });
}

async function getMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readonly");
    const req = tx.objectStore(STORE_META).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, "readwrite");
    tx.objectStore(STORE_META).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putConversations(conversations: Conversation[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONVERSATIONS, "readwrite");
    const store = tx.objectStore(STORE_CONVERSATIONS);
    store.clear();
    for (const conv of conversations) {
      store.put(conv);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllConversations(): Promise<Conversation[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONVERSATIONS, "readonly");
    const req = tx.objectStore(STORE_CONVERSATIONS).getAll();
    req.onsuccess = () => resolve((req.result as Conversation[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

function loadLegacyLocalStorage(): PersistedChatState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeRaw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    return {
      conversations: JSON.parse(raw) as Conversation[],
      activeConversationId: activeRaw || null,
    };
  } catch {
    return null;
  }
}

function clearLegacyLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_KEY);
}

export async function loadChatState(): Promise<PersistedChatState> {
  try {
    const legacy = loadLegacyLocalStorage();
    if (legacy) {
      await putConversations(legacy.conversations);
      await setMeta(ACTIVE_KEY, legacy.activeConversationId);
      clearLegacyLocalStorage();
      return legacy;
    }

    const conversations = await getAllConversations();
    const activeConversationId = await getMeta<string | null>(ACTIVE_KEY);
    return {
      conversations: conversations.sort((a, b) => b.updatedAt - a.updatedAt),
      activeConversationId: activeConversationId ?? null,
    };
  } catch {
    return { conversations: [], activeConversationId: null };
  }
}

export async function saveChatState(
  conversations: Conversation[],
  activeConversationId: string | null,
): Promise<void> {
  try {
    await putConversations(conversations);
    await setMeta(ACTIVE_KEY, activeConversationId);
  } catch {
    // fallback to localStorage without images if IDB fails
  }
}

export { loadHistoryOpen, saveHistoryOpen } from "./chatPersistence";

export async function saveHistoryOpenAsync(open: boolean): Promise<void> {
  try {
    await setMeta(HISTORY_OPEN_KEY, open);
  } catch {
    localStorage.setItem(HISTORY_OPEN_KEY, String(open));
  }
}

export async function loadHistoryOpenAsync(): Promise<boolean> {
  try {
    const v = await getMeta<boolean | string>(HISTORY_OPEN_KEY);
    if (v === null) return loadHistoryOpen();
    return v === true || v === "true";
  } catch {
    return loadHistoryOpen();
  }
}
