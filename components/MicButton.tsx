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
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-stretch gap-3">
        {supported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            aria-pressed={listening}
            className={`shrink-0 rounded-full px-6 h-14 text-lg font-semibold transition-colors disabled:opacity-40 ${
              listening
                ? "bg-coral text-sand animate-pulse"
                : "bg-coral/90 text-sand hover:bg-coral"
            }`}
          >
            {listening ? "Listening\u2026" : "\uD83C\uDF99 Speak"}
          </button>
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
              ? "Press Speak, or type your app idea\u2026"
              : "Type your app idea\u2026"
          }
          className="flex-1 h-14 rounded-xl bg-sand/10 border border-slate/30 px-5 text-lg text-sand placeholder:text-slate focus:outline-none focus:border-aqua disabled:opacity-40"
        />
        <button
          type="button"
          onClick={() => submit(text)}
          disabled={disabled || !text.trim()}
          className="shrink-0 rounded-xl px-8 h-14 text-lg font-bold bg-aqua text-navy hover:brightness-110 transition disabled:opacity-40"
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
          className="self-start text-sm text-slate hover:text-aqua transition disabled:opacity-40"
        >
          Use demo prompt: &ldquo;{defaultPrompt}&rdquo;
        </button>
      )}
    </div>
  );
}
