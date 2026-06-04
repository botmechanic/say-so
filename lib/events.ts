/**
 * Shared event vocabulary between the streaming API route and the client UI.
 * Kept free of any server-only imports so it can be imported from both sides.
 */

export type BuildPhase =
  | "idle"
  | "listening"
  | "starting"
  | "building"
  | "verifying"
  | "done"
  | "error";

export type LogLevel = "text" | "thinking" | "tool" | "system";

export type BuildEvent =
  | { type: "status"; phase: BuildPhase; message?: string }
  | {
      type: "log";
      level: LogLevel;
      text: string;
      tool?: string;
      toolStatus?: string;
    }
  | { type: "proof"; url: string }
  | { type: "result"; status: string; durationMs?: number; result?: string }
  | { type: "error"; message: string }
  | { type: "done" };

/** The pre-tested default request, used by the demo button and as a fallback. */
export const DEFAULT_REQUEST =
  "a todo list app where I can add and delete tasks";

export const PHASE_LABELS: Record<BuildPhase, string> = {
  idle: "Ready",
  listening: "Listening",
  starting: "Starting",
  building: "Building",
  verifying: "Verifying",
  done: "Done",
  error: "Error",
};
