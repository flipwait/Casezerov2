// ============================================================
// CaseZero V2 — AI Engine (OpenAI only)
// ============================================================
import { useCallback } from 'react';

export const AI_ERR = "[AI_ERROR]";
export const isAIErr = (t) => !t || t.startsWith(AI_ERR) || (t.startsWith("[") && t.includes("error"));

export async function callAI(prompt, sys = "", ctx = "generic", settings = {}) {
  const id = `ai_${Date.now()}`;
  const model = settings.openaiModel || "gpt-4o";
  console.info(`[CZ2][AI][${model}] ${ctx}`, { id, len: prompt.length });

  if (!settings.openaiKey) {
    console.warn("[CZ2][AI] No key");
    return `${AI_ERR} No OpenAI API key — go to ⚙ Settings.`;
  }

  try {
    const isO1 = model.startsWith("o1");
    const messages = isO1
      ? [{ role: "user", content: `${sys}\n\n${prompt}` }]
      : [
          { role: "system", content: sys || "You power a detective mystery game. Be dramatic, concise, and immersive." },
          { role: "user", content: prompt },
        ];
    const body = { model, messages, max_tokens: isO1 ? 2000 : 1000 };
    if (!isO1) body.temperature = 0.85;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.openaiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let eb = "";
      try { const ej = await res.json(); eb = ej?.error?.message || ""; } catch { eb = await res.text().catch(() => ""); }
      console.error(`[CZ2][AI] HTTP ${res.status}`, eb.slice(0, 150));
      if (res.status === 401) return `${AI_ERR} Invalid API key (401). Check Settings.`;
      if (res.status === 429) return `${AI_ERR} Rate limit reached. Wait a moment and try again.`;
      if (res.status === 400) return `${AI_ERR} Bad request (400): ${eb.slice(0, 80)}`;
      return `${AI_ERR} OpenAI error ${res.status}: ${eb.slice(0, 80)}`;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) { console.warn("[CZ2][AI] Empty response"); return `${AI_ERR} Empty response from model.`; }
    console.info(`[CZ2][AI] OK [${ctx}]`, { len: text.length });
    return text;
  } catch (err) {
    console.error(`[CZ2][AI] threw: ${err.message}`, { ctx });
    return `${AI_ERR} ${err.message}`;
  }
}

export function safeJSON(raw, fallback = {}) {
  if (isAIErr(raw)) return { ...fallback, _error: raw };
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) try { return JSON.parse(m[0]); } catch {}
    return { ...fallback, _parseError: true, _raw: raw.slice(0, 200) };
  }
}

export async function speakText(text, settings) {
  if (!settings.voiceEnabled || !settings.elevenLabsKey || !settings.elevenLabsVoiceId || isAIErr(text)) return;
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${settings.elevenLabsVoiceId}`, {
      method: "POST",
      headers: { "xi-api-key": settings.elevenLabsKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_monolingual_v1" }),
    });
    if (!res.ok) { console.error(`[CZ2][TTS] HTTP ${res.status}`); return; }
    new Audio(URL.createObjectURL(await res.blob())).play();
  } catch (e) { console.warn("[CZ2][TTS]", e.message); }
}
