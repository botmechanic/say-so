"use client";

import type { BuildPhase } from "@/lib/events";

type ProofPanelProps = {
  proofUrl: string | null;
  phase: BuildPhase;
};

export function ProofPanel({ proofUrl, phase }: ProofPanelProps) {
  return (
    <div className="h-full rounded-2xl bg-navy/60 border border-slate/20 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-widest text-slate">
          Proof
        </span>
        {proofUrl && (
          <span className="text-xs font-semibold text-aqua">
            verified by the agent
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-navy/40">
        {proofUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proofUrl}
            alt="Screenshot the agent took of the app it built"
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <p className="text-slate text-center px-6">
            {phase === "verifying"
              ? "The agent is taking a screenshot of the app it built\u2026"
              : "When the agent finishes, its own screenshot of the running app lands here."}
          </p>
        )}
      </div>
    </div>
  );
}
