import { Agent, CursorAgentError } from "@cursor/sdk";
import type { SDKMessage } from "@cursor/sdk";
import type { BuildEvent } from "./events";
import { buildPrompt } from "./prompts";
import { PROOF_PATH, WORKSPACE_DIR, proofExists, resetScratch } from "./scratch";

const MODEL_ID = process.env.SAY_SO_MODEL ?? "composer-2.5";

function truncate(value: string, max = 220): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "\u2026" : clean;
}

function describeInput(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return truncate(input);
  try {
    return truncate(JSON.stringify(input));
  } catch {
    return "";
  }
}

/** Heuristic: are we in the self-verification (screenshot) step yet? */
function looksLikeVerification(message: SDKMessage): boolean {
  const blob = JSON.stringify(message).toLowerCase();
  return blob.includes("screenshot") || blob.includes("proof.png");
}

/**
 * Run one build end to end: reset the scratch workspace, create a local agent,
 * send the prompt, stream normalized events, then surface the proof screenshot.
 * One request = one fresh agent (respects the one-active-run-per-agent rule).
 */
export async function* runBuild(userRequest: string): AsyncGenerator<BuildEvent> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    yield {
      type: "error",
      message:
        "CURSOR_API_KEY is not set. Add it to .env.local and restart the dev server.",
    };
    yield { type: "done" };
    return;
  }

  let enteredVerifying = false;

  yield { type: "status", phase: "starting", message: "Preparing workspace" };
  await resetScratch();

  let agent: Awaited<ReturnType<typeof Agent.create>> | undefined;
  try {
    agent = await Agent.create({
      apiKey,
      name: "Say So build",
      model: { id: MODEL_ID },
      local: { cwd: WORKSPACE_DIR },
    });

    const run = await agent.send(buildPrompt(userRequest));
    yield {
      type: "status",
      phase: "building",
      message: "Agent is scaffolding the app",
    };

    for await (const message of run.stream()) {
      if (!enteredVerifying && looksLikeVerification(message)) {
        enteredVerifying = true;
        yield {
          type: "status",
          phase: "verifying",
          message: "Agent is verifying its own work",
        };
      }

      switch (message.type) {
        case "assistant": {
          for (const block of message.message.content) {
            if (block.type === "text" && block.text.trim()) {
              yield { type: "log", level: "text", text: block.text.trim() };
            } else if (block.type === "tool_use") {
              yield {
                type: "log",
                level: "tool",
                tool: block.name,
                text: describeInput(block.input),
              };
            }
          }
          break;
        }
        case "tool_call": {
          yield {
            type: "log",
            level: "tool",
            tool: message.name,
            toolStatus: message.status,
            text: describeInput(message.args),
          };
          break;
        }
        case "thinking": {
          if (message.text.trim()) {
            yield { type: "log", level: "thinking", text: truncate(message.text, 300) };
          }
          break;
        }
        case "task": {
          if (message.text?.trim()) {
            yield { type: "log", level: "system", text: message.text.trim() };
          }
          break;
        }
        default:
          break;
      }
    }

    const result = await run.wait();
    yield {
      type: "result",
      status: result.status,
      durationMs: result.durationMs,
      result: result.result ? truncate(result.result, 400) : undefined,
    };

    if (result.status === "error") {
      yield { type: "error", message: "The agent run failed before finishing." };
    }

    if (await proofExists()) {
      yield {
        type: "status",
        phase: "done",
        message: "App built and verified",
      };
      yield { type: "proof", url: `/api/proof?t=${Date.now()}` };
    } else {
      yield {
        type: "status",
        phase: "done",
        message: "Build finished without a screenshot",
      };
    }
  } catch (err) {
    if (err instanceof CursorAgentError) {
      yield {
        type: "error",
        message: `The run could not start: ${err.message}`,
      };
    } else {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      };
    }
    yield { type: "status", phase: "error" };
  } finally {
    if (agent) {
      try {
        await agent[Symbol.asyncDispose]();
      } catch {
        // best-effort cleanup
      }
    }
  }

  yield { type: "done" };
}

export { PROOF_PATH };
