import { useEffect, useRef } from "react";
import { compileTikz, getApiBaseUrl } from "../api/client";
import type { FinalAnswer } from "../api/types";
import type { Conversation } from "../types/chat";
import {
  applyCompileResult,
  collectRestoreTargets,
  type RestoreTarget,
} from "./restoreDiagrams";

const MAX_CONCURRENT = 2;
const DEBOUNCE_MS = 500;

async function runPool(
  targets: RestoreTarget[],
  onResult: (target: RestoreTarget, tikzImage: string | null) => void,
): Promise<void> {
  let index = 0;

  async function worker() {
    while (index < targets.length) {
      const i = index++;
      const target = targets[i];
      try {
        const compiled = await compileTikz(target.tikz);
        onResult(target, compiled.tikz_image ?? null);
      } catch {
        // Skip failed restores silently
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT, targets.length) },
    () => worker(),
  );
  await Promise.all(workers);
}

interface UseRestoreDiagramsOptions {
  conversations: Conversation[];
  updateMessageResult: (
    conversationId: string,
    messageId: string,
    updater: (result: FinalAnswer) => FinalAnswer,
  ) => void;
}

export function useRestoreDiagrams({
  conversations,
  updateMessageResult,
}: UseRestoreDiagramsOptions): void {
  const restoredRef = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const targets = collectRestoreTargets(conversations).filter((t) => {
        const key = `${t.messageId}:${t.panelId ?? "main"}`;
        return !restoredRef.current.has(key);
      });

      if (targets.length === 0) return;

      void runPool(targets, (target, tikzImage) => {
        const key = `${target.messageId}:${target.panelId ?? "main"}`;
        restoredRef.current.add(key);
        updateMessageResult(target.conversationId, target.messageId, (result) =>
          applyCompileResult(result, target, tikzImage),
        );
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [conversations, updateMessageResult]);
}
