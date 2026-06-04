"use client";

import { useEffect, useRef } from "react";
import type { BuildEvent } from "@/lib/events";

type StreamLog = Extract<BuildEvent, { type: "log" }>;

const LEVEL_STYLES: Record<StreamLog["level"], string> = {
  text: "text-sand",
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
    <div className="h-full overflow-y-auto rounded-2xl bg-navy/60 border border-slate/20 p-5 font-mono text-sm leading-relaxed">
      {logs.length === 0 ? (
        <p className="text-slate">The agent&rsquo;s work will stream here&hellip;</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {logs.map((log, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-20 text-right text-slate/70 uppercase tracking-wide text-[10px] pt-1">
                {LEVEL_LABELS[log.level]}
              </span>
              <span className={`flex-1 break-words ${LEVEL_STYLES[log.level]}`}>
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
  );
}
