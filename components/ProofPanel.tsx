"use client";

import { AnimatePresence, motion } from "motion/react";
import type { BuildPhase } from "@/lib/events";
import { FrostedPanel } from "./FrostedPanel";

type ProofPanelProps = {
  proofUrl: string | null;
  phase: BuildPhase;
};

export function ProofPanel({ proofUrl, phase }: ProofPanelProps) {
  return (
    <FrostedPanel title="Proof" subtitle="agent-verified">
      <div className="relative flex h-full min-h-[340px] items-center justify-center overflow-hidden rounded-xl bg-navy/35">
        <AnimatePresence mode="wait">
          {proofUrl ? (
            <motion.div
              key={proofUrl}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-full w-full items-center justify-center p-3"
            >
              <div className="proof-glow-once relative rounded-xl p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofUrl}
                  alt="Screenshot the agent took of the app it built"
                  className="max-h-[min(420px,58vh)] max-w-full rounded-lg object-contain shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                />
                <motion.span
                  initial={{ opacity: 0, y: 8, x: 8 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
                  className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-aqua/40 bg-navy/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-aqua shadow-lg backdrop-blur-sm"
                >
                  <span aria-hidden="true">✓</span>
                  Verified by the agent
                </motion.span>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xs px-6 text-center text-base leading-relaxed text-slate"
            >
              {phase === "verifying"
                ? "The agent is taking a screenshot of the app it built\u2026"
                : "When the agent finishes, its own screenshot of the running app lands here."}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </FrostedPanel>
  );
}
