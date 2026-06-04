"use client";

import { useEffect, useRef } from "react";
import type { BuildEvent } from "@/lib/events";
import { FrostedPanel } from "./FrostedPanel";

type StreamLog = Extract<BuildEvent, { type: "log" }>;

const LEVEL_STYLES: Record<StreamLog["level"], string> = {
  text: "text-sand/95",
  thinking: "text-slate italic",
  tool: "text-azure",
  system: "text-aqua",
};

const LEVEL_LABELS: Record<StreamLog["level"], string> = {
  text: "agent",
  thinking: "thinking",
  tool: "tool",
  system: "status",
};

export function BuildStream({ logs }: { logs: StreamLog[] }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <FrostedPanel title="Build stream" subtitle="live agent output">
      <div className="h-full max-h-[min(480px,58vh)] overflow-y-auto rounded-xl bg-navy/30 p-4 font-mono text-[13px] leading-relaxed">
        {logs.length === 0 ? (
          <p className="text-slate/90">
            The agent&rsquo;s work will stream here&hellip;
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {logs.map((log, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-[4.5rem] shrink-0 pt-0.5 text-right text-[10px] uppercase tracking-wider text-slate/75">
                  {LEVEL_LABELS[log.level]}
                </span>
                <span
                  className={`min-w-0 flex-1 break-words ${LEVEL_STYLES[log.level]}`}
                >
                  {log.tool && (
                    <span className="font-bold text-azure">
                      {log.tool}
                      {log.toolStatus ? ` (${log.toolStatus})` : ""}
                      {log.text ? ": " : ""}
                    </span>
                  )}
                  {log.text}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>
    </FrostedPanel>
  );
}
