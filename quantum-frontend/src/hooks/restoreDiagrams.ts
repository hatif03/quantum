import type { FinalAnswer } from "../api/types";
import type { Conversation } from "../types/chat";

export interface RestoreTarget {
  conversationId: string;
  messageId: string;
  tikz: string;
  panelId?: string;
}

export function collectRestoreTargets(conversations: Conversation[]): RestoreTarget[] {
  const targets: RestoreTarget[] = [];

  for (const conv of conversations) {
    for (const message of conv.messages) {
      if (message.role !== "assistant" || message.status !== "done" || !message.result) {
        continue;
      }

      const result = message.result;

      if (result.tikz?.code && !result.tikz_image) {
        targets.push({
          conversationId: conv.id,
          messageId: message.id,
          tikz: result.tikz.code,
        });
      }

      if (result.diagram_lesson?.panels) {
        for (const panel of result.diagram_lesson.panels) {
          if (panel.tikz && !panel.image_url) {
            targets.push({
              conversationId: conv.id,
              messageId: message.id,
              tikz: panel.tikz,
              panelId: panel.id,
            });
          }
        }
      }
    }
  }

  return targets;
}

export function applyCompileResult(
  result: FinalAnswer,
  target: RestoreTarget,
  tikzImage: string | null | undefined,
): FinalAnswer {
  const next = { ...result };

  if (target.panelId && next.diagram_lesson?.panels) {
    const panels = next.diagram_lesson.panels.map((panel) =>
      panel.id === target.panelId ? { ...panel, image_url: tikzImage ?? null } : panel,
    );
    next.diagram_lesson = { ...next.diagram_lesson, panels };
    if (tikzImage) {
      next.diagram_images = {
        ...(next.diagram_images ?? {}),
        [target.panelId]: tikzImage,
      };
    }
  } else if (tikzImage) {
    next.tikz_image = tikzImage;
  }

  return next;
}
