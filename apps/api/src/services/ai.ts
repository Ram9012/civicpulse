import { CATEGORIES, type AiSuggestion, type Category, type ChatMessage, type Priority } from "@civicpulse/contract";
import { z } from "zod";
import { config } from "../config.js";

const KEYWORDS: Record<Category, string[]> = {
  road: ["pothole", "road", "crater", "asphalt", "speed breaker", "footpath", "pavement", "tar"],
  streetlight: ["streetlight", "street light", "lamp", "electric", "wire", "cable", "transformer", "pole", "dark", "power"],
  garbage: ["garbage", "waste", "trash", "dustbin", "bin", "sanitation", "smell", "litter", "dump"],
  water: ["water", "pipe", "leak", "drain", "sewage", "sewer", "flood", "overflow", "manhole"],
  traffic: ["traffic", "signal", "jam", "accident", "zebra", "parking", "gridlock"],
  parks: ["park", "swing", "garden", "playground", "bench", "gym", "tree"],
};

const SEVERE = ["spark", "burst", "flood", "accident", "exposed", "fire", "collapse", "danger", "school", "hazard", "injur", "high-voltage", "high voltage"];

/** Typical target days per category (shown by the assistant as "usual", never as a promise). */
export const TYPICAL_DAYS: Record<Category, number> = {
  road: 5,
  streetlight: 3,
  garbage: 2,
  water: 3,
  traffic: 3,
  parks: 6,
};

/** Deterministic keyword triage. Used when Groq is off or fails, so the feature always works. */
export function ruleSuggest(text: string): AiSuggestion {
  const t = text.toLowerCase();
  let best: Category = "road";
  let bestHits: string[] = [];
  for (const c of CATEGORIES) {
    const hits = KEYWORDS[c].filter((k) => t.includes(k));
    if (hits.length > bestHits.length) {
      best = c;
      bestHits = hits;
    }
  }
  const severe = SEVERE.filter((k) => t.includes(k));
  const priority: Priority = severe.length >= 2 ? "critical" : severe.length === 1 ? "high" : "medium";
  const clean = text.replace(/\s+/g, " ").trim();
  return {
    category: best,
    priority,
    departmentId: null,
    confidence: bestHits.length ? Math.min(0.95, 0.5 + 0.12 * bestHits.length) : 0.2,
    summary: clean.length > 140 ? `${clean.slice(0, 137)}...` : clean,
    keywords: [...new Set([...bestHits, ...severe])].slice(0, 6),
    source: "rules",
  };
}

const groqSuggestion = z.object({
  category: z.enum(CATEGORIES as [Category, ...Category[]]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  summary: z.string().max(300),
  keywords: z.array(z.string()).max(8).default([]),
  confidence: z.number().min(0).max(1),
});

const groqOn = () => config.aiEnabled && !!config.groqApiKey;

async function groqChat(messages: { role: string; content: string }[], json: boolean): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.groqApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.groqModel,
      temperature: 0.2,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message.content ?? "";
}

/** Advisory triage: Groq when enabled, keyword rules otherwise (or on any Groq failure). */
export async function suggest(text: string): Promise<AiSuggestion> {
  if (groqOn()) {
    try {
      const raw = await groqChat(
        [
          {
            role: "system",
            content:
              "You triage civic complaints for an Indian city. Reply with JSON only: " +
              `{"category": one of ${CATEGORIES.join("|")}, "priority": low|medium|high|critical, ` +
              '"summary": one short sentence, "keywords": up to 5 strings, "confidence": number 0..1}. ' +
              "Critical = immediate danger to life (sparking cables, burst mains, accidents).",
          },
          { role: "user", content: text },
        ],
        true
      );
      const parsed = groqSuggestion.parse(JSON.parse(raw));
      return { ...parsed, departmentId: null, source: "groq" };
    } catch (e) {
      console.error("[ai] groq triage failed, using rules:", e instanceof Error ? e.message : e);
    }
  }
  return ruleSuggest(text);
}

export const EMERGENCY_NUMBERS = "Police 100 · Fire 101 · Ambulance 108 · Unified emergency 112";

/** Rules-based assistant. `reportFacts` is pre-resolved by the caller when a CIV id was mentioned. */
export function ruleChat(message: string, reportFacts: string | null): string {
  const m = message.toLowerCase();
  if (reportFacts) return reportFacts;
  if (/emergency|helpline|police|ambulance|fire\b/.test(m)) {
    return `For emergencies call the official numbers first: ${EMERGENCY_NUMBERS}. CivicPulse is for non-emergency civic issues.`;
  }
  if (/how long|time|sla|resolve|resolution/.test(m)) {
    const lines = CATEGORIES.map((c) => `${c}: about ${TYPICAL_DAYS[c]} days`).join(", ");
    return `Typical resolution times (not guarantees): ${lines}.`;
  }
  if (/submit|report|file|complain|how do i|how to/.test(m)) {
    return "To report: open Report, add a photo or video, drop a pin on the map, choose a category and describe the problem. You will get a tracking ID like CIV-10482.";
  }
  if (/track|status|where is/.test(m)) {
    return "Open My reports to see every report with its timeline, or ask me with the tracking ID, for example: status of CIV-10482.";
  }
  return "I can help with tracking a report (give me its CIV id), typical repair times, emergency numbers, and how to file a report. What do you need?";
}

export async function chat(
  message: string,
  history: ChatMessage[],
  reportFacts: string | null
): Promise<{ reply: string; source: "groq" | "rules" }> {
  if (groqOn()) {
    try {
      const reply = await groqChat(
        [
          {
            role: "system",
            content:
              "You are PulseBot, the assistant of CivicPulse, a civic issue reporting platform in Hassan, Karnataka. " +
              "Be brief and friendly. Only answer about CivicPulse, filing and tracking reports, typical repair times, " +
              `and emergencies. Emergency numbers: ${EMERGENCY_NUMBERS}. Typical repair days: ${JSON.stringify(TYPICAL_DAYS)} ` +
              "(typical, not guaranteed). Never invent report data or names of officials. " +
              (reportFacts ? `Facts about the report the user mentioned: ${reportFacts}` : ""),
          },
          ...history.slice(-6),
          { role: "user", content: message },
        ],
        false
      );
      if (reply.trim()) return { reply: reply.trim(), source: "groq" };
    } catch (e) {
      console.error("[ai] groq chat failed, using rules:", e instanceof Error ? e.message : e);
    }
  }
  return { reply: ruleChat(message, reportFacts), source: "rules" };
}
