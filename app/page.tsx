"use client";

import Image from "next/image";
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

const PHASE_PROGRESS: Record<BuildPhase, number> = {
  idle: 0,
  listening: 0,
  starting: 18,
  building: 48,
  verifying: 78,
  done: 100,
  error: 100,
};

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
    <div className="relative z-10 flex min-h-screen w-full flex-col items-center px-5 py-8 text-sand sm:px-8">
      <header className="animate-fade-up mb-8 flex w-full max-w-6xl flex-col items-center gap-4 text-center">
        <Image
          src="/say-so-logo.png"
          alt="Say So"
          width={320}
          height={320}
          priority
          className="h-auto w-[min(100%,260px)] drop-shadow-[0_8px_32px_rgba(0,0,0,0.35)] md:w-[300px]"
        />
        <p className="animate-fade-up animate-delay-1 max-w-xl text-lg leading-relaxed text-slate md:text-xl">
          Voice to a tested, running app. You just have to say so.
        </p>
      </header>

      <main className="flex w-full max-w-6xl flex-1 flex-col gap-6">
        <section className="animate-fade-up animate-delay-2 flex flex-col gap-4">
          <MicButton
            onSubmit={startBuild}
            disabled={isRunning}
            defaultPrompt={DEFAULT_REQUEST}
          />
          <StatusBar phase={phase} message={statusMessage} prompt={prompt} />
        </section>

        <section className="animate-fade-up animate-delay-3 grid min-h-[420px] flex-1 grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-6">
          <div className="lg:col-span-3">
            <BuildStream logs={logs} />
          </div>
          <div className="lg:col-span-2">
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
    idle: "border-white/[0.06] bg-white/[0.03] text-slate",
    listening: "border-coral/25 bg-coral/10 text-coral",
    starting: "border-azure/25 bg-azure/10 text-azure",
    building: "border-azure/25 bg-azure/10 text-azure",
    verifying: "border-aqua/30 bg-aqua/10 text-aqua",
    done: "border-aqua/30 bg-aqua/10 text-aqua",
    error: "border-coral/30 bg-coral/10 text-coral",
  };
  const progressColor: Record<BuildPhase, string> = {
    idle: "bg-slate/40",
    listening: "bg-coral",
    starting: "bg-azure",
    building: "bg-azure",
    verifying: "bg-aqua",
    done: "bg-aqua",
    error: "bg-coral",
  };
  const active = ["starting", "building", "verifying"].includes(phase);
  const progress = PHASE_PROGRESS[phase];

  return (
    <div
      className={`status-bar overflow-hidden rounded-2xl border backdrop-blur-sm ${tone[phase]}`}
    >
      <div className="flex items-center gap-3 px-5 py-3.5">
        <span
          className={`inline-block h-3 w-3 shrink-0 rounded-full bg-current ${
            active ? "animate-pulse" : ""
          }`}
        />
        <span className="shrink-0 text-sm font-bold uppercase tracking-[0.2em]">
          {PHASE_LABELS[phase]}
        </span>
        <span className="truncate text-sm opacity-90">
          {message}
          {prompt && phase !== "idle" ? ` \u2014 \u201c${prompt}\u201d` : ""}
        </span>
      </div>
      <div className="h-1 bg-white/[0.06]">
        <div
          className={`status-progress h-full ${progressColor[phase]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
