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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Scroll the panel itself, not the page — keeps the live tail visible during demo.
    container.scrollTop = container.scrollHeight;
  }, [logs]);

  return (
    <FrostedPanel title="Build stream" subtitle="live agent output">
      <div
        ref={scrollRef}
        className="h-full max-h-[min(480px,58vh)] overflow-y-auto scroll-smooth rounded-xl bg-navy/30 p-4 font-mono text-[13px] leading-relaxed"
      >
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
      </div>
    </FrostedPanel>
  );
}
