import React, { useState } from 'react';
import { T } from '../tokens';
import { callAI, isAIErr } from '../hooks/useAI';

function CorkNote({ clue, onDiscover, forensics, onForensics, forensicsUsed, hasKey, delay = 0 }) {
  return (
    <div
      className={`cork-note ${clue.found ? "found" : "unknown"} anim-pin`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => !clue.found && onDiscover(clue)}
    >
      <div style={{
        position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
        width: 14, height: 14, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 32%, #F08888, #A03030)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.2)",
        zIndex: 1,
      }} />

      {clue.found ? (
        <>
          {clue.critical && <div className="cork-stamp">CRITICAL</div>}
          <div className="cork-note-title">{clue.name}</div>
          <div className="cork-note-body">{clue.desc}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "#5A4A30", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              📍 {clue.room}
            </span>
          </div>
          {!forensics?.report && (
            <button
              onClick={e => { e.stopPropagation(); onForensics(clue); }}
              disabled={forensics?.loading || !hasKey}
              style={{
                marginTop: 8, background: "transparent", border: "1px solid #1ECFB044",
                borderRadius: 3, padding: "3px 8px", fontSize: 9, cursor: "pointer",
                color: "#0D7A69", fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: "0.1em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {forensics?.loading
                ? <><span style={{ width: 8, height: 8, border: "1px solid #0D7A69", borderTopColor: "#1ECFB0", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Analyzing…</>
                : `🔬 Analyze${forensicsUsed ? "" : " (free)"}`}
            </button>
          )}
          {forensics?.error && (
            <div style={{ marginTop: 6, fontSize: 10, color: T.red }}>{forensics.error}</div>
          )}
          {forensics?.report && (
            <div className="forensics-panel" style={{ marginTop: 10 }}>
              <div className="f-header">🔬 Forensics Report</div>
              <div style={{ fontSize: 10, color: "#0D2520", lineHeight: 1.55 }}>{forensics.report}</div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="cork-note-title" style={{ color: "#6A5A40" }}>Unknown Evidence</div>
          <div style={{ fontSize: 11, color: "#8A7A60", marginTop: 4 }}>Click to examine</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 9, color: "#8A7A60", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              📍 {clue.room}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function CorkboardPanel({ caseData, clues, activeRoom, setActiveRoom, discoverClue, notes, setNotes, settings }) {
  const [forensicsState, setForensicsState] = useState({});
  const [forensicsUsed, setForensicsUsed] = useState(false);

  const clueRoom = c => c.room || caseData.rooms[Math.floor((clues.indexOf(c) / clues.length) * caseData.rooms.length)];
  const roomClues = clues.filter(c => clueRoom(c) === activeRoom);
  const foundTotal = clues.filter(c => c.found).length;
  const pct = Math.round((foundTotal / clues.length) * 100);

  const runForensics = async (clue) => {
    if (forensicsState[clue.id]?.report) return;
    setForensicsState(p => ({ ...p, [clue.id]: { loading: true, report: null, error: "" } }));
    const sys = "You are a forensic scientist writing a brief lab report. 3-4 sentences. Provide specific scientific detail that adds new information. Include one unexpected additional finding that could help or mislead the detective.";
    const pr = `Clue: "${clue.name}" — ${clue.desc}. Case: ${caseData.title}. Write a forensic lab report with an extra finding.`;
    const txt = await callAI(pr, sys, `forensics-${clue.id}`, settings);
    if (isAIErr(txt)) {
      setForensicsState(p => ({ ...p, [clue.id]: { loading: false, report: null, error: txt.replace("[AI_ERROR]", "").trim() } }));
      return;
    }
    setForensicsState(p => ({ ...p, [clue.id]: { loading: false, report: txt, error: "" } }));
    setForensicsUsed(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 className="display" style={{ fontSize: 28, color: T.paper }}>EVIDENCE BOARD</h3>
          <span className="mono" style={{ fontSize: 11, color: T.teal }}>{foundTotal}/{clues.length} FOUND</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${T.teal},${T.gold})` }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {caseData.rooms.map(r => {
          const rClues = clues.filter(c => clueRoom(c) === r);
          const rFound = rClues.filter(c => c.found).length;
          return (
            <button key={r} className={`btn btn-sm ${activeRoom === r ? "btn-gold" : "btn-ghost"}`}
              onClick={() => setActiveRoom(r)}>
              {r} <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>{rFound}/{rClues.length}</span>
            </button>
          );
        })}
      </div>

      <div className="corkboard" style={{ flex: 1, minHeight: 300 }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)",
        }} />
        <div className="corkboard-inner" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", position: "relative" }}>
          {roomClues.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 20px", color: "#6A5A40", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: "0.1em" }}>
              NO EVIDENCE IN THIS LOCATION
            </div>
          )}
          {roomClues.map((c, i) => (
            <CorkNote key={c.id} clue={c} onDiscover={discoverClue} forensics={forensicsState[c.id]} onForensics={runForensics} forensicsUsed={forensicsUsed} hasKey={!!settings.openaiKey} delay={i * 80} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>Detective Notes — {activeRoom}</div>
        <textarea
          className="input"
          placeholder={`Write observations about ${activeRoom}…`}
          value={notes[activeRoom] || ""}
          onChange={e => setNotes(n => ({ ...n, [activeRoom]: e.target.value }))}
          style={{ minHeight: 80, background: "#F8F4E8", color: "#1A1208", border: "1px solid #C8B888" }}
        />
      </div>
    </div>
  );
}
