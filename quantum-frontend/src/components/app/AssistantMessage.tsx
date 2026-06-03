import { useState } from "react";
import { compileTikz } from "../../api/client";
import { displaySummary, isMathSchemaEcho } from "../../api/cotLeak";
import { pickExample } from "../../api/mock";
import type { FinalAnswer, WorkflowMode } from "../../api/types";
import type { ChatMessage } from "../../types/chat";
import { renderMixedLatex } from "../sketch/MathBlock";
import { GraphEditorCanvas } from "../graph/GraphEditorCanvas";
import { DiagramLessonView } from "../lab/DiagramLessonView";
import { ReasoningPanel } from "../lab/ReasoningPanel";
import { ThinkingTrace } from "../lab/ThinkingTrace";
import { TikzDiagram } from "../lab/TikzDiagram";
import { isTeachMode, STEP_LABELS } from "./chatConstants";
import { DiagramEditActions } from "./DiagramEditActions";
import { EditorModal } from "./EditorModal";
import { ExportActions } from "./ExportActions";
import { PhysicsValidationPanel } from "./PhysicsValidationPanel";
import { RefinementActions } from "./RefinementActions";
import { StudyPanels } from "./StudyPanels";
import { TikzEditor } from "./TikzEditor";
import { WorkflowErrorPanel } from "./WorkflowErrorPanel";

type EditTarget =
  | { scope: "main"; code: string }
  | { scope: "panel"; panelId: string; code: string };

interface AssistantMessageProps {
  message: ChatMessage;
  userPrompt: string;
  running: boolean;
  onRetryOffline: () => void;
  onRefinement?: (prompt: string) => void;
  onUpdateResult?: (result: FinalAnswer) => void;
}

export function AssistantMessage({
  message,
  userPrompt,
  running,
  onRetryOffline,
  onRefinement,
  onUpdateResult,
}: AssistantMessageProps) {
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [visualModalOpen, setVisualModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [draftCode, setDraftCode] = useState("");
  const [recompiling, setRecompiling] = useState(false);

  const workflowMode = message.mode ?? "diagram";
  const isStreaming =
    message.status === "pending" || message.status === "streaming";
  const isError = message.status === "error";
  const result = message.result;
  const displayExample = result ? pickExample(userPrompt) : pickExample(userPrompt);

  const openCodeEditor = (target: EditTarget) => {
    setEditTarget(target);
    setDraftCode(target.code);
    setCodeModalOpen(true);
  };

  const openVisualEditor = (target: EditTarget) => {
    setEditTarget(target);
    setDraftCode(target.code);
    setVisualModalOpen(true);
  };

  const applyMainTikz = (code: string, tikzImage?: string | null) => {
    if (!result || !onUpdateResult) return;
    onUpdateResult({
      ...result,
      tikz: { ...result.tikz!, code },
      tikz_image: tikzImage ?? result.tikz_image,
    });
  };

  const applyPanelTikz = (
    panelId: string,
    code: string,
    tikzImage?: string | null,
  ) => {
    if (!result || !onUpdateResult || !result.diagram_lesson) return;
    onUpdateResult({
      ...result,
      diagram_lesson: {
        ...result.diagram_lesson,
        panels: result.diagram_lesson.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                tikz: code,
                image_url: tikzImage ?? p.image_url,
                compile_ok: Boolean(tikzImage),
              }
            : p,
        ),
      },
      diagram_images: tikzImage
        ? { ...result.diagram_images, [panelId]: tikzImage }
        : result.diagram_images,
    });
  };

  const applyEdit = (code: string, tikzImage?: string | null) => {
    if (!editTarget) return;
    if (editTarget.scope === "main") {
      applyMainTikz(code, tikzImage);
    } else {
      applyPanelTikz(editTarget.panelId, code, tikzImage);
    }
    setCodeModalOpen(false);
    setVisualModalOpen(false);
  };

  const handleMainRecompile = async () => {
    const code = result?.tikz?.code;
    if (!code || !onUpdateResult || !result) return;
    setRecompiling(true);
    try {
      const res = await compileTikz(code);
      onUpdateResult({
        ...result,
        tikz_image: res.tikz_image ?? result.tikz_image,
        compile_report: res.compile_report ?? {
          ok: res.ok,
          errors: res.errors,
          warnings: res.warnings,
        },
      });
    } finally {
      setRecompiling(false);
    }
  };

  if (isError) {
    return (
      <WorkflowErrorPanel
        message={message.text}
        kind={message.errorKind ?? "unknown"}
        onRetryOffline={onRetryOffline}
        running={running}
      />
    );
  }

  const mainTikz = result?.tikz?.code;

  return (
    <>
      {isStreaming && message.thinkingText && (
        <ThinkingTrace
          phase={message.thinkingPhase || message.activeStep || ""}
          text={message.thinkingText}
          running={isStreaming}
        />
      )}
      {isStreaming && (
        <>
          <p className="chat-workbench__status" aria-busy="true">
            Working…
          </p>
          {message.activeStep &&
            message.activeStep !== "idle" &&
            STEP_LABELS[message.activeStep] && (
              <p className="chat-workbench__step">
                {STEP_LABELS[message.activeStep]}
              </p>
            )}
        </>
      )}

      {isTeachMode(workflowMode) &&
        (result?.diagram_lesson?.panels?.length ? (
          <DiagramLessonView
            lesson={result.diagram_lesson}
            diagramImages={result.diagram_images}
            fallbackExample={displayExample}
            activeIndex={activePanelIndex}
            onActiveIndexChange={setActivePanelIndex}
            onPanelUpdate={
              onUpdateResult
                ? (panelId, patch) =>
                    onUpdateResult({
                      ...result,
                      diagram_lesson: {
                        ...result.diagram_lesson!,
                        panels: result.diagram_lesson!.panels.map((p) =>
                          p.id === panelId ? { ...p, ...patch } : p,
                        ),
                      },
                      diagram_images: patch.image_url
                        ? { ...result.diagram_images, [panelId]: patch.image_url }
                        : result.diagram_images,
                    })
                : undefined
            }
            onEditCode={
              onUpdateResult
                ? (panelId, code) => openCodeEditor({ scope: "panel", panelId, code })
                : undefined
            }
            onEditVisually={
              onUpdateResult
                ? (panelId, code) => openVisualEditor({ scope: "panel", panelId, code })
                : undefined
            }
          />
        ) : (
          <TikzDiagram
            example={displayExample}
            tikzImage={result?.tikz_image}
            animating={isStreaming}
          />
        ))}

      {workflowMode === "diagram" && (
        <>
          <TikzDiagram
            example={displayExample}
            tikzImage={result?.tikz_image}
            animating={isStreaming}
          />
          {mainTikz && onUpdateResult && (
            <DiagramEditActions
              hasTikz
              onEditCode={() => openCodeEditor({ scope: "main", code: mainTikz })}
              onEditVisually={() => openVisualEditor({ scope: "main", code: mainTikz })}
              onRecompile={() => void handleMainRecompile()}
              recompiling={recompiling}
            />
          )}
        </>
      )}

      {result && (
        <AssistantResultBody
          result={result}
          mode={workflowMode}
          offlineNotice={message.offlineNotice ?? false}
          activePanelIndex={activePanelIndex}
          onRefinement={onRefinement}
          onEditVisually={
            mainTikz && onUpdateResult
              ? () => openVisualEditor({ scope: "main", code: mainTikz })
              : undefined
          }
          compileErrors={result.compile_report?.errors}
        />
      )}

      <EditorModal
        open={codeModalOpen}
        title="Edit TikZ code"
        onClose={() => setCodeModalOpen(false)}
        footer={
          onUpdateResult && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => applyEdit(draftCode)}
            >
              Apply & close
            </button>
          )
        }
      >
        <TikzEditor
          code={editTarget?.code ?? draftCode}
          onSave={setDraftCode}
          onRecompiled={(patch) => {
            setDraftCode(patch.code);
            if (patch.tikz_image) applyEdit(patch.code, patch.tikz_image);
          }}
        />
      </EditorModal>

      <EditorModal
        open={visualModalOpen}
        title="Visual diagram editor"
        onClose={() => setVisualModalOpen(false)}
        size="large"
      >
        <GraphEditorCanvas
          initialTikz={editTarget?.code ?? draftCode}
          compact
          onApply={
            onUpdateResult
              ? (applied) => {
                  applyEdit(applied.tikz, applied.tikz_image);
                }
              : undefined
          }
        />
      </EditorModal>
    </>
  );
}

function AssistantResultBody({
  result,
  mode,
  offlineNotice,
  activePanelIndex,
  onRefinement,
  onEditVisually,
  compileErrors,
}: {
  result: FinalAnswer;
  mode: WorkflowMode;
  offlineNotice: boolean;
  activePanelIndex: number;
  onRefinement?: (prompt: string) => void;
  onEditVisually?: () => void;
  compileErrors?: string[];
}) {
  const showMath = mode === "explain" || isTeachMode(mode);
  const activePanelId =
    result.diagram_lesson?.panels[activePanelIndex]?.id ?? null;
  const summaryText = displaySummary(result);
  const warnings = result.parse_warnings ?? [];
  const panelCount = result.diagram_lesson?.panels?.length ?? 0;
  const anyCompileOk =
    result.diagram_lesson?.panels?.some((p) => p.compile_ok) ?? false;
  const diagramWarning =
    isTeachMode(mode) &&
    (warnings.includes("diagram_lesson") ||
      (panelCount > 0 && !anyCompileOk));
  const mathIsPlaceholder =
    result.math_explanation != null && isMathSchemaEcho(result.math_explanation);
  const mathWarning =
    isTeachMode(mode) &&
    (warnings.includes("math_explanation") ||
      mathIsPlaceholder ||
      (!result.math_explanation && panelCount > 0 && !diagramWarning));
  const showMathPanel =
    showMath && result.math_explanation && !mathIsPlaceholder;
  const planWarning = isTeachMode(mode) && warnings.includes("lesson_plan");

  return (
    <div className="chat-workbench__result">
      {offlineNotice && (
        <p className="chat-workbench__offline-notice">
          Showing offline demo — start the backend for live K2 responses.
        </p>
      )}
      {diagramWarning && (
        <p className="chat-workbench__parse-warning" role="status">
          {panelCount === 0
            ? "Couldn't parse diagram lesson panels."
            : "Some diagram panels failed to compile."}
        </p>
      )}
      {mathWarning && !diagramWarning && (
        <p className="chat-workbench__parse-warning" role="status">
          {mathIsPlaceholder
            ? "Math explanation could not be parsed (template echoed). Rebuild the API image and try again, or check logs/sessions."
            : "Math explanation may be incomplete."}
        </p>
      )}
      {planWarning && panelCount >= 2 && !diagramWarning && (
        <p className="chat-workbench__parse-warning" role="status">
          Lesson plan outline was not fully parsed; panels may not match the plan.
        </p>
      )}
      {result.debug_session_id && (
        <p className="chat-workbench__debug-session" role="note">
          Debug session: <code>{result.debug_session_id}</code>
          {" — "}
          logs saved on server under{" "}
          <code>logs/sessions/{result.debug_session_id}</code>
        </p>
      )}
      {summaryText && (
        <p className="chat-workbench__summary">{renderMixedLatex(summaryText)}</p>
      )}

      {result.physics_report && (
        <PhysicsValidationPanel report={result.physics_report} />
      )}

      {onRefinement && (
        <RefinementActions
          onRefinement={onRefinement}
          compileFailed={result.compile_report?.ok === false}
          compileErrors={compileErrors}
        />
      )}

      <ExportActions result={result} onEditVisually={onEditVisually} />
      <StudyPanels result={result} />

      {showMathPanel && (
        <ReasoningPanel
          explanation={result.math_explanation!}
          activePanelId={activePanelId}
        />
      )}

      {!result.tikz_image &&
        !result.diagram_images &&
        result.tikz?.code &&
        mode === "diagram" && (
          <p className="chat-workbench__parse-warning" role="status">
            Diagram preview unavailable — TikZ source is saved. Use Edit code to recompile.
          </p>
        )}
    </div>
  );
}
