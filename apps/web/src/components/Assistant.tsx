import type { ChatMessage, ChatResponse } from "@civicpulse/contract";
import { useState, type FormEvent } from "react";
import { post } from "../lib/api";

const PROMPTS = ["Track my complaint", "Emergency numbers", "How long do repairs take?", "How do I report an issue?"];

/** PulseBot: floating assistant. Groq-backed when configured, rules-based otherwise. */
export function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi, I am PulseBot. Ask me about tracking a report (include its CIV id), repair times, emergency numbers or how to file a report." },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(message: string) {
    const m = message.trim();
    if (!m || busy) return;
    const history = msgs.slice(1);
    setMsgs((x) => [...x, { role: "user", content: m }]);
    setText("");
    setBusy(true);
    try {
      const res = await post<ChatResponse>("/ai/chat", { message: m, history });
      setMsgs((x) => [...x, { role: "assistant", content: res.reply }]);
    } catch {
      setMsgs((x) => [...x, { role: "assistant", content: "Sorry, I cannot reach the server right now. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      {open ? (
        <section aria-label="PulseBot assistant" className="flex h-[26rem] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-lg border bg-white shadow-xl">
          <header className="flex items-center justify-between border-b p-2">
            <strong>PulseBot</strong>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="min-h-11 min-w-11">✕</button>
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto p-2 text-sm" aria-live="polite">
            {msgs.map((m, i) => (
              <p key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${m.role === "user" ? "ml-auto bg-teal-700 text-white" : "bg-slate-100"}`}>
                {m.content}
              </p>
            ))}
            {busy && <p className="text-slate-400">Thinking...</p>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1">
                {PROMPTS.map((p) => (
                  <button key={p} onClick={() => ask(p)} className="min-h-11 rounded-full border px-3 text-xs">{p}</button>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={onSubmit} className="flex gap-1 border-t p-2">
            <input className="min-h-11 flex-1 rounded border px-2 text-sm" aria-label="Message" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} />
            <button className="min-h-11 rounded bg-teal-700 px-3 text-white disabled:opacity-40" disabled={busy || !text.trim()}>Send</button>
          </form>
        </section>
      ) : (
        <button onClick={() => setOpen(true)} className="min-h-12 rounded-full bg-teal-700 px-5 font-medium text-white shadow-lg">
          💬 Ask PulseBot
        </button>
      )}
    </div>
  );
}
