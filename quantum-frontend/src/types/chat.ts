import type { FinalAnswer, WorkflowMode, WorkflowStepId } from "../api/types";
import type { WorkflowErrorKind } from "../hooks/useWorkflow";

export type ChatMessageStatus = "pending" | "streaming" | "done" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  createdAt: number;
  mode?: WorkflowMode;
  text: string;
  result?: FinalAnswer | null;
  thinkingText?: string;
  thinkingPhase?: string;
  activeStep?: WorkflowStepId;
  status?: ChatMessageStatus;
  errorKind?: WorkflowErrorKind;
  offlineNotice?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  starred?: boolean;
  messages: ChatMessage[];
}

export interface PersistedChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
}
