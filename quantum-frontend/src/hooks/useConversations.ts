import { useCallback, useEffect, useRef, useState } from "react";
import {
  DiagramHttpError,
  DiagramNetworkError,
  generateDiagram,
} from "../api/client";
import type { WorkflowMode, WorkflowStepId } from "../api/types";
import {
  loadChatState,
  loadHistoryOpenAsync,
  saveChatState,
  saveHistoryOpenAsync,
} from "./chatStorage";
import {
  newConversationId,
  newMessageId,
  prepareForPersistence,
  truncateTitle,
} from "./chatPersistence";
import type { ChatMessage, Conversation } from "../types/chat";
import {
  buildDiagramRequest,
  enrichAnswerExtras,
} from "./conversationHelpers";

const STEP_MAP: Record<string, WorkflowStepId> = {
  lesson_planner: "lesson_planner",
  diagram_lesson: "diagram_lesson",
  compile_panels: "compile_panels",
  diagram_generator: "diagram_generator",
  math_explainer: "math_explainer",
  complete: "complete",
};

const SAVE_DEBOUNCE_MS = 300;

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 768px)").matches;
}

function closeHistoryOnMobile(setHistoryOpen: (open: boolean) => void) {
  if (isMobileViewport()) {
    setHistoryOpen(false);
  }
}

function initialStepForMode(mode: WorkflowMode): WorkflowStepId {
  if (mode === "explain") return "math_explainer";
  if (mode === "diagram") return "diagram_generator";
  return "lesson_planner";
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<WorkflowMode>("diagram");
  const [running, setRunning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadChatState().then(({ conversations: loaded, activeConversationId: active }) => {
      setConversations(loaded);
      setActiveConversationId(active);
      setStorageReady(true);
    });
    void loadHistoryOpenAsync().then(setHistoryOpen);
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  useEffect(() => {
    if (!storageReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const prepared = prepareForPersistence(conversations);
      void saveChatState(prepared, activeConversationId);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [conversations, activeConversationId, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    void saveHistoryOpenAsync(historyOpen);
  }, [historyOpen, storageReady]);

  const toggleHistory = useCallback(() => {
    setHistoryOpen((open) => !open);
  }, []);

  const updateConversation = useCallback(
    (id: string, updater: (conv: Conversation) => Conversation) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? updater(c) : c)),
      );
    },
    [],
  );

  const updateMessageResult = useCallback(
    (
      conversationId: string,
      messageId: string,
      updater: (result: import("../api/types").FinalAnswer) => import("../api/types").FinalAnswer,
    ) => {
      updateConversation(conversationId, (conv) => ({
        ...conv,
        updatedAt: Date.now(),
        messages: conv.messages.map((m) => {
          if (m.id !== messageId || !m.result) return m;
          return { ...m, result: updater(m.result) };
        }),
      }));
    },
    [updateConversation],
  );

  const updateAssistantMessage = useCallback(
    (
      conversationId: string,
      messageId: string,
      patch: Partial<ChatMessage>,
    ) => {
      updateConversation(conversationId, (conv) => ({
        ...conv,
        updatedAt: Date.now(),
        messages: conv.messages.map((m) =>
          m.id === messageId ? { ...m, ...patch } : m,
        ),
      }));
    },
    [updateConversation],
  );

  const runGeneration = useCallback(
    async (
      conversationId: string,
      assistantMessageId: string,
      userPrompt: string,
      workflowMode: WorkflowMode,
      forceMock = false,
    ) => {
      setRunning(true);
      const thinkingPhaseRef = { current: "" };

      updateAssistantMessage(conversationId, assistantMessageId, {
        status: "streaming",
        activeStep: initialStepForMode(workflowMode),
        thinkingText: "",
        thinkingPhase: "",
        text: "",
        result: null,
        errorKind: null,
        offlineNotice: false,
      });

      try {
        const conv = conversations.find((c) => c.id === conversationId);
        const priorMessages =
          conv?.messages.filter((m) => m.id !== assistantMessageId) ?? [];
        const answer = enrichAnswerExtras(
          await generateDiagram(
            buildDiagramRequest(priorMessages, userPrompt, workflowMode),
            (step) => {
            updateAssistantMessage(conversationId, assistantMessageId, {
              activeStep: STEP_MAP[step] ?? "lesson_planner",
            });
          },
          {
            forceMock,
            onThinking: (phase, delta) => {
              if (thinkingPhaseRef.current !== phase) {
                thinkingPhaseRef.current = phase;
                updateAssistantMessage(conversationId, assistantMessageId, {
                  thinkingPhase: phase,
                  thinkingText: delta,
                });
              } else {
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== conversationId) return c;
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              thinkingText: (m.thinkingText ?? "") + delta,
                            }
                          : m,
                      ),
                    };
                  }),
                );
              }
            },
          },
        ),
        );

        updateAssistantMessage(conversationId, assistantMessageId, {
          status: "done",
          activeStep: "complete",
          result: answer,
          thinkingText: "",
          thinkingPhase: "",
          offlineNotice: forceMock,
        });
      } catch (e) {
        let errorKind: ChatMessage["errorKind"] = "unknown";
        let message = "Generation failed";

        if (e instanceof DiagramNetworkError) {
          errorKind = "network";
          message = e.message;
        } else if (e instanceof DiagramHttpError) {
          errorKind = "http";
          message = e.message;
        } else if (e instanceof Error) {
          message = e.message;
        }

        updateAssistantMessage(conversationId, assistantMessageId, {
          status: "error",
          activeStep: "error",
          text: message,
          errorKind,
          thinkingText: "",
          thinkingPhase: "",
        });
      } finally {
        setRunning(false);
      }
    },
    [updateAssistantMessage, conversations],
  );

  const sendWithPrompt = useCallback(
    async (text: string, workflowMode: WorkflowMode = mode) => {
      const trimmed = text.trim();
      if (!trimmed || running) return;

      let conversationId = activeConversationId;
      const now = Date.now();
      const userMessage: ChatMessage = {
        id: newMessageId(),
        role: "user",
        createdAt: now,
        mode: workflowMode,
        text: trimmed,
      };
      const assistantMessage: ChatMessage = {
        id: newMessageId(),
        role: "assistant",
        createdAt: now + 1,
        mode: workflowMode,
        text: "",
        status: "pending",
      };

      if (!conversationId) {
        conversationId = newConversationId();
        const newConv: Conversation = {
          id: conversationId,
          title: truncateTitle(trimmed),
          createdAt: now,
          updatedAt: now,
          messages: [userMessage, assistantMessage],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(conversationId);
      } else {
        updateConversation(conversationId, (conv) => ({
          ...conv,
          updatedAt: now,
          title: conv.messages.length === 0 ? truncateTitle(trimmed) : conv.title,
          messages: [...conv.messages, userMessage, assistantMessage],
        }));
      }

      setPrompt("");
      closeHistoryOnMobile(setHistoryOpen);

      await runGeneration(
        conversationId,
        assistantMessage.id,
        trimmed,
        workflowMode,
        false,
      );
    },
    [
      running,
      mode,
      activeConversationId,
      runGeneration,
      updateConversation,
    ],
  );

  const sendMessage = useCallback(async () => {
    await sendWithPrompt(prompt, mode);
  }, [prompt, mode, sendWithPrompt]);

  const retryOffline = useCallback(
    async (conversationId: string, assistantMessageId: string) => {
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv || running) return;

      const assistantIndex = conv.messages.findIndex(
        (m) => m.id === assistantMessageId,
      );
      if (assistantIndex <= 0) return;

      const userMessage = conv.messages[assistantIndex - 1];
      if (userMessage.role !== "user") return;

      const workflowMode = userMessage.mode ?? "diagram";
      await runGeneration(
        conversationId,
        assistantMessageId,
        userMessage.text,
        workflowMode,
        true,
      );
    },
    [conversations, running, runGeneration],
  );

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setPrompt("");
    closeHistoryOnMobile(setHistoryOpen);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setPrompt("");
    closeHistoryOnMobile(setHistoryOpen);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setPrompt("");
      }
    },
    [activeConversationId],
  );

  const renameConversation = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c,
      ),
    );
  }, []);

  const toggleStar = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)),
    );
  }, []);

  return {
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
    updateMessageResult,
    sendWithPrompt,
    toggleStar,
  };
}
