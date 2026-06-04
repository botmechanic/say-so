"use client";

import { useEffect, useRef, useState } from "react";

type MicButtonProps = {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
  defaultPrompt?: string;
};

export function MicButton({ onSubmit, disabled, defaultPrompt }: MicButtonProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability probe on mount
    setSupported(true);
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setText("");
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const submit = (value: string) => {
    if (disabled) return;
    onSubmit(value);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        {supported && (
          <div className="relative flex shrink-0 justify-center sm:justify-start">
            {listening && (
              <>
                <span
                  className="mic-ring absolute inset-0 rounded-full border-2 border-coral/50"
                  aria-hidden="true"
                />
                <span
                  className="mic-ring mic-ring-delay absolute inset-0 rounded-full border-2 border-coral/35"
                  aria-hidden="true"
                />
              </>
            )}
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              aria-pressed={listening}
              className={`relative z-10 flex h-16 min-w-[9.5rem] items-center justify-center gap-2 rounded-full px-8 text-lg font-bold transition-all disabled:opacity-40 ${
                listening
                  ? "bg-coral text-sand shadow-[0_0_40px_rgba(255,78,120,0.55)]"
                  : "bg-coral text-sand shadow-[0_0_32px_rgba(255,78,120,0.35)] hover:shadow-[0_0_48px_rgba(255,78,120,0.5)] hover:brightness-110"
              }`}
            >
              <MicIcon className={listening ? "animate-pulse" : ""} />
              {listening ? "Listening\u2026" : "Speak"}
            </button>
          </div>
        )}

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(text);
          }}
          disabled={disabled}
          placeholder={
            supported
              ? "Or type your app idea\u2026"
              : "Type your app idea\u2026"
          }
          className="h-14 flex-1 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 text-lg text-sand placeholder:text-slate/80 backdrop-blur-sm focus:border-aqua/60 focus:outline-none focus:ring-2 focus:ring-aqua/20 disabled:opacity-40"
        />

        <button
          type="button"
          onClick={() => submit(text)}
          disabled={disabled || !text.trim()}
          className="h-14 shrink-0 rounded-2xl bg-aqua px-8 text-lg font-bold text-navy shadow-[0_0_24px_rgba(25,224,200,0.25)] transition hover:brightness-110 disabled:opacity-40"
        >
          Build it
        </button>
      </div>

      {defaultPrompt && (
        <button
          type="button"
          onClick={() => {
            setText(defaultPrompt);
            submit(defaultPrompt);
          }}
          disabled={disabled}
          className="self-start text-sm text-slate/90 transition hover:text-aqua disabled:opacity-40"
        >
          Use demo prompt: &ldquo;{defaultPrompt}&rdquo;
        </button>
      )}
    </div>
  );
}

function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
