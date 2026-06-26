import React, { useState, useEffect, useRef } from 'react';
import { T, MOODS, getMood } from '../tokens';

// ── API Warning Banner ───────────────────────────────────────
export function APIWarn() {
  return (
    <div className="api-warn">
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.red, marginBottom: 3 }}>No OpenAI API Key</div>
        <div style={{ fontSize: 12, color: T.inkSec, lineHeight: 1.6 }}>
          AI features are disabled. Go to <strong style={{ color: T.teal }}>⚙ Settings</strong> and add your OpenAI key to enable interrogations, witnesses, lie detection, and the narrator.
        </div>
      </div>
    </div>
  );
}

// ── Toggle Switch ────────────────────────────────────────────
export function Toggle({ on, onChange }) {
  return (
    <div className="toggle" style={{ background: on ? T.teal : T.smoke }} onClick={onChange}>
      <div className="toggle-knob" style={{ left: on ? 20 : 3 }} />
    </div>
  );
}

// ── Suspicion Meter ──────────────────────────────────────────
export function SuspicionMeter({ value, label = "Suspicion" }) {
  const p = Math.min(100, Math.max(0, value));
  const c = p < 30 ? T.green : p < 60 ? T.amber : p < 80 ? T.orange : T.red;
  const lbl = p < 20 ? "CLEAR" : p < 40 ? "LOW" : p < 60 ? "MODERATE" : p < 80 ? "HIGH" : "CRITICAL";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="label">{label}</span>
        <span className="mono" style={{ fontSize: 10, color: c }}>{lbl} — {p}%</span>
      </div>
      <div className="susp-track">
        <div className="susp-fill" style={{ width: `${p}%`, background: `linear-gradient(90deg,${c}88,${c})` }} />
      </div>
    </div>
  );
}

// ── Lie Meter ────────────────────────────────────────────────
export function LieMeter({ value }) {
  const p = Math.min(100, Math.max(0, value));
  const c = p < 25 ? T.green : p < 50 ? T.teal : p < 75 ? T.amber : T.red;
  const lbl = p < 25 ? "TRUTHFUL" : p < 50 ? "UNCERTAIN" : p < 75 ? "EVASIVE" : "LYING";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span className="label">Deception Analysis</span>
        <span className="mono" style={{ fontSize: 10, color: c }}>{lbl} {p}%</span>
      </div>
      <div className="susp-track">
        <div className="susp-fill" style={{ width: `${p}%`, background: `linear-gradient(90deg,${T.green},${T.amber},${T.red})` }} />
      </div>
    </div>
  );
}

// ── Mood Badge ───────────────────────────────────────────────
export function MoodBadge({ count, guilty }) {
  const mood = getMood(count, guilty);
  const m = MOODS[mood];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 3, background: `${m.color}15`, border: `1px solid ${m.color}30`, fontSize: 11, fontWeight: 600, color: m.color }}>
      <span>{m.icon}</span><span>{m.label}</span>
    </div>
  );
}

// ── Case Timer ───────────────────────────────────────────────
export function CaseTimer({ minutes, onExpire, paused }) {
  const total = minutes * 60;
  const [rem, setRem] = useState(total);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!minutes || paused || done) return;
    const id = setInterval(() => setRem(r => {
      if (r <= 1) { clearInterval(id); setDone(true); onExpire?.(); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [minutes, paused, done]);
  if (!minutes) return null;
  const m = Math.floor(rem / 60), s = rem % 60;
  const pct = (rem / total) * 100;
  const crit = rem < 120, warn = rem < 300;
  const cls = crit ? "timer-crit" : warn ? "timer-warn" : "timer-ok";
  return (
    <div className="timer-wrap" style={{ background: crit ? `${T.red}12` : T.shadow, border: `1px solid ${crit ? T.red : warn ? T.amber : T.smoke}` }}>
      <span style={{ fontSize: 16 }}>{crit ? "🚨" : warn ? "⏳" : "⏱"}</span>
      <div>
        <div className={`timer-display ${cls}`}>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</div>
        <div style={{ width: 70 }} className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%`, background: crit ? T.red : warn ? T.amber : T.teal, transition: "width 1s linear" }} />
        </div>
      </div>
    </div>
  );
}

// ── Narrator Bar ─────────────────────────────────────────────
export function NarratorBar({ text, loading }) {
  if (!text && !loading) return null;
  return (
    <div className="narrator-bar">
      {loading
        ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: T.purple }}>
            <span className="spinner" style={{ borderTopColor: T.purple }} /> Narrator composing…
          </span>
        : <>🎙 {text}</>}
    </div>
  );
}

// ── Log Panel ────────────────────────────────────────────────
export function LogPanel({ logs, onClear, onExport }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const ref = useRef(null);
  useEffect(() => { if (open && ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs, open]);
  const ec = logs.filter(l => l.level === "ERROR").length;
  const wc = logs.filter(l => l.level === "WARN").length;
  const fil = filter === "ALL" ? logs : logs.filter(l => l.level === filter);
  return (
    <div className="log-panel">
      <div className="log-header" onClick={() => setOpen(o => !o)}>
        <span style={{ color: T.inkSec, fontSize: 11 }}>
          DEV LOG {ec > 0 && <span style={{ color: T.red }}> ●{ec}E</span>}
          {wc > 0 && <span style={{ color: T.amber }}> ▲{wc}W</span>}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          {open && <span onClick={e => { e.stopPropagation(); onExport?.(); }} style={{ color: T.teal, cursor: "pointer" }}>↓</span>}
          {open && <span onClick={e => { e.stopPropagation(); onClear?.(); }} style={{ color: T.inkMut, cursor: "pointer" }}>✕</span>}
          <span style={{ color: T.inkMut }}>{open ? "▼" : "▲"}</span>
        </div>
      </div>
      {open && <>
        <div style={{ display: "flex", gap: 3, padding: "4px 6px", borderBottom: `1px solid ${T.smoke}` }}>
          {["ALL","DEBUG","INFO","WARN","ERROR"].map(f =>
            <span key={f} onClick={() => setFilter(f)} style={{ cursor: "pointer", fontSize: 10, padding: "2px 6px", borderRadius: 2, background: filter === f ? T.smoke : "transparent", color: filter === f ? T.ink : T.inkMut }}>{f}</span>
          )}
        </div>
        <div ref={ref} className="log-scroll">
          {fil.length === 0 && <div style={{ color: T.inkMut, padding: 8 }}>No logs.</div>}
          {fil.map(e =>
            <div key={e.id} className={`log-entry log-${e.level}`}>
              <span style={{ color: T.inkMut }}>{e.ts?.slice(11, 19)} [{e.cat}] </span>{e.msg}
              {e.data && e.data !== "{}" && <span style={{ color: T.inkMut, opacity: 0.6 }}> {e.data.slice(0, 70)}</span>}
            </div>
          )}
        </div>
      </>}
    </div>
  );
}

// ── Error Display in Chat ────────────────────────────────────
export function AIErrorBubble({ message }) {
  const clean = message.replace("[AI_ERROR]", "").trim();
  return (
    <div className="bubble bubble-error" style={{ alignSelf: "flex-start", maxWidth: "90%" }}>
      <span style={{ fontWeight: 700 }}>⚠ AI Error:</span> {clean}
    </div>
  );
}

// ── Player Chip ──────────────────────────────────────────────
export function PlayerChip({ player, active, onClick }) {
  return (
    <div className="player-chip" style={{ opacity: active ? 1 : 0.4, borderColor: active ? player.color : T.smoke }} onClick={onClick}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: player.color, flexShrink: 0 }} />
      <span style={{ fontSize: 12 }}>{player.name}</span>
    </div>
  );
}

// ── Section Label ────────────────────────────────────────────
export function SectionLabel({ children, style = {} }) {
  return <div className="label" style={{ marginBottom: 8, ...style }}>{children}</div>;
}

// ── Divider ──────────────────────────────────────────────────
export function Divider({ style = {} }) {
  return <div className="divider" style={{ margin: "16px 0", ...style }} />;
}
