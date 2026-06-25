import React, { useState } from 'react';
import { T, OPENAI_MODELS } from '../tokens';
import { Toggle, APIWarn, SectionLabel, Divider } from './UI';
import { callAI, isAIErr } from '../hooks/useAI';

export function SettingsScreen({ settings, onChange, onBack }) {
  const [testStatus, setTestStatus] = useState("");
  const [testing, setTesting] = useState(false);

  const test = async () => {
    setTesting(true); setTestStatus("");
    const r = await callAI("Reply with exactly: Connection OK", "Reply with: Connection OK", "test", settings);
    if (isAIErr(r)) {
      setTestStatus(`❌ ${r.replace("[AI_ERROR]", "").trim()}`);
    } else {
      setTestStatus("✅ Connected — AI responding normally");
    }
    setTesting(false);
  };

  const set = (key, val) => onChange({ ...settings, [key]: val });

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "32px 24px" }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 28 }} onClick={onBack}>
        ← Back
      </button>

      <h2 className="display" style={{ fontSize: 42, color: T.paper, marginBottom: 4 }}>SETTINGS</h2>
      <p style={{ color: T.inkSec, marginBottom: 32, fontSize: 14 }}>Configure AI engine, model, voices, and game options.</p>

      {!settings.openaiKey && <div style={{ marginBottom: 20 }}><APIWarn /></div>}

      {/* OpenAI */}
      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <SectionLabel>OpenAI API Key</SectionLabel>
        <input
          className="input" type="password" placeholder="sk-..."
          value={settings.openaiKey || ""}
          onChange={e => set("openaiKey", e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <SectionLabel style={{ marginBottom: 10 }}>Model</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
          {OPENAI_MODELS.map(m => (
            <div key={m.id} className={`model-row ${settings.openaiModel === m.id ? "active" : ""}`}
              onClick={() => set("openaiModel", m.id)}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: m.tier === "advanced" ? T.purple : m.tier === "fast" ? T.green : T.teal,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: settings.openaiModel === m.id ? T.teal : T.ink }}>{m.label}</div>
                <div style={{ fontSize: 11, color: T.inkSec }}>{m.desc}</div>
              </div>
              <span className={`tag tag-${m.tier === "advanced" ? "purple" : m.tier === "fast" ? "green" : "teal"}`} style={{ fontSize: 9 }}>{m.tier}</span>
              {settings.openaiModel === m.id && <span style={{ color: T.teal, fontSize: 14 }}>✓</span>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" onClick={test} disabled={testing}>
            {testing ? <><span className="spinner" /> Testing…</> : "🔌 Test Connection"}
          </button>
          {testStatus && (
            <span style={{ fontSize: 12, color: testStatus.startsWith("✅") ? T.green : T.red }}>
              {testStatus}
            </span>
          )}
        </div>
      </div>

      {/* ElevenLabs */}
      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <SectionLabel style={{ marginBottom: 10 }}>ElevenLabs Voice (Optional)</SectionLabel>
        <input
          className="input" placeholder="ElevenLabs API Key"
          value={settings.elevenLabsKey || ""}
          onChange={e => set("elevenLabsKey", e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <input
          className="input" placeholder="Voice ID (e.g. EXAVITQu4vr4xnSDxMaL)"
          value={settings.elevenLabsVoiceId || ""}
          onChange={e => set("elevenLabsVoiceId", e.target.value)}
        />
        <p style={{ fontSize: 11, color: T.inkMut, marginTop: 8, lineHeight: 1.6 }}>
          Suspects speak their responses aloud. Note: ElevenLabs requires a server-side proxy to work from a deployed web app — voices work in local development.
        </p>
      </div>

      {/* Options */}
      <div className="card" style={{ padding: 20 }}>
        <SectionLabel style={{ marginBottom: 16 }}>Game Options</SectionLabel>
        {[
          { k: "aiHints",       l: "AI Hint System",     d: "Request a subtle hint once per round" },
          { k: "lieDetector",   l: "AI Lie Detector",    d: "Scores deception % after each interrogation answer" },
          { k: "narratorEnabled", l: "AI Noir Narrator", d: "Atmospheric one-liner between phases" },
          { k: "voiceEnabled",  l: "Voice (ElevenLabs)", d: "Suspects speak during interrogation" },
          { k: "showDevLog",    l: "Dev Log Panel",      d: "Real-time event & error overlay (bottom right)" },
        ].map(o => (
          <label key={o.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, cursor: "pointer" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{o.l}</div>
              <div style={{ fontSize: 12, color: T.inkSec }}>{o.d}</div>
            </div>
            <Toggle on={settings[o.k]} onChange={() => set(o.k, !settings[o.k])} />
          </label>
        ))}
      </div>
    </div>
  );
}
