"use client";

import { useCallback, useRef, useState } from "react";
import { MicButton } from "@/components/MicButton";
import { BuildStream } from "@/components/BuildStream";
import { ProofPanel } from "@/components/ProofPanel";
import {
  DEFAULT_REQUEST,
  PHASE_LABELS,
  type BuildEvent,
  type BuildPhase,
} from "@/lib/events";

type StreamLog = Extract<BuildEvent, { type: "log" }>;

const ACTIVE_PHASES: BuildPhase[] = ["starting", "building", "verifying"];

export default function Home() {
  const [phase, setPhase] = useState<BuildPhase>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [logs, setLogs] = useState<StreamLog[]>([]);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const runningRef = useRef(false);

  const isRunning = ACTIVE_PHASES.includes(phase);

  const handleEvent = useCallback((event: BuildEvent) => {
    switch (event.type) {
      case "status":
        setPhase(event.phase);
        if (event.message) setStatusMessage(event.message);
        break;
      case "log":
        setLogs((prev) => [...prev, event]);
        break;
      case "proof":
        setProofUrl(event.url);
        break;
      case "error":
        setPhase("error");
        setStatusMessage(event.message);
        setLogs((prev) => [
          ...prev,
          { type: "log", level: "system", text: `Error: ${event.message}` },
        ]);
        break;
      case "result":
      case "done":
        break;
    }
  }, []);

  const startBuild = useCallback(
    async (requested: string) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setPrompt(requested || DEFAULT_REQUEST);
      setLogs([]);
      setProofUrl(null);
      setStatusMessage("Starting the agent\u2026");
      setPhase("starting");

      try {
        const res = await fetch("/api/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: requested }),
        });
        if (!res.body) throw new Error("No response stream from the server.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const line = frame.replace(/^data: /, "").trim();
            if (!line) continue;
            try {
              handleEvent(JSON.parse(line) as BuildEvent);
            } catch {
              // ignore malformed frame
            }
          }
        }
      } catch (err) {
        handleEvent({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        runningRef.current = false;
        setPhase((current) => (current === "error" ? current : "done"));
      }
    },
    [handleEvent],
  );

  return (
    <div className="min-h-screen w-full bg-navy text-sand flex flex-col items-center px-6 py-8">
      <header className="w-full max-w-6xl flex flex-col items-center text-center gap-2 mb-6">
        <h1 className="text-5xl font-black tracking-tight">
          <span className="text-coral">Say</span>{" "}
          <span className="text-aqua">So</span>
        </h1>
        <p className="text-lg text-slate">
          Voice to a tested, running app. You just have to say so.
        </p>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-6 flex-1">
        <section className="flex flex-col gap-4">
          <MicButton
            onSubmit={startBuild}
            disabled={isRunning}
            defaultPrompt={DEFAULT_REQUEST}
          />
          <StatusBar phase={phase} message={statusMessage} prompt={prompt} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[420px]">
          <div className="min-h-[420px]">
            <BuildStream logs={logs} />
          </div>
          <div className="min-h-[420px]">
            <ProofPanel proofUrl={proofUrl} phase={phase} />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusBar({
  phase,
  message,
  prompt,
}: {
  phase: BuildPhase;
  message: string;
  prompt: string;
}) {
  const tone: Record<BuildPhase, string> = {
    idle: "bg-slate/20 text-slate",
    listening: "bg-coral/20 text-coral",
    starting: "bg-azure/20 text-azure",
    building: "bg-azure/20 text-azure",
    verifying: "bg-aqua/20 text-aqua",
    done: "bg-aqua/20 text-aqua",
    error: "bg-coral/20 text-coral",
  };
  const active = ["starting", "building", "verifying"].includes(phase);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-5 py-3 ${tone[phase]}`}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full bg-current ${
          active ? "animate-pulse" : ""
        }`}
      />
      <span className="font-bold uppercase tracking-widest text-sm">
        {PHASE_LABELS[phase]}
      </span>
      <span className="text-sm opacity-90 truncate">
        {message}
        {prompt && phase !== "idle" ? ` \u2014 \u201c${prompt}\u201d` : ""}
      </span>
    </div>
  );
}
