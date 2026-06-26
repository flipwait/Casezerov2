import React, { useState, useEffect } from 'react';
import { T } from '../tokens';
import { SuspicionMeter, SectionLabel } from './UI';

export function VerdictScreen({ verdict, caseData, player, onEnd, isTutorial }) {
  const [phase, setPhase] = useState(0);
  const [tab, setTab] = useState("result");
  const [revealKiller, setRevealKiller] = useState(false);

  const isTimer = verdict.timerExpired;
  const correct = verdict.correct;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const bgColor = isTimer ? T.amber : correct ? T.green : T.red;
  const headerText = isTimer ? "TIME EXPIRED" : correct ? "CASE SOLVED" : verdict.permadeath ? "GAME OVER" : "WRONG ACCUSATION";
  const emoji = isTimer ? "⌛" : correct ? "🏆" : verdict.permadeath ? "💀" : "😞";
  const subText = isTimer
    ? `The clock ran out. ${verdict.killer.name} escapes.`
    : correct
      ? `${player.name} correctly identified ${verdict.killer.name}.`
      : `${player.name} accused ${verdict.suspect?.name}. The killer was ${verdict.killer.name}.`;

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse 100% 60% at 50% 0%, ${bgColor}10, transparent)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <div style={{
        maxWidth: 660, width: "100%",
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "none" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{emoji}</div>
          <span className={`tag tag-${isTimer ? "gold" : correct ? "green" : "red"}`}
            style={{ marginBottom: 16, display: "inline-flex", fontSize: 11, padding: "5px 14px" }}>
            {headerText}
          </span>
          <h1 className="display" style={{ fontSize: "clamp(36px,6vw,64px)", color: T.paper, marginBottom: 10, lineHeight: 1 }}>
            {isTimer ? "The killer escapes."
              : correct ? "Brilliant work, Detective."
              : verdict.permadeath ? "One shot. One miss."
              : "The real killer walks free."}
          </h1>
          <p style={{ color: T.inkSec, fontSize: 15, lineHeight: 1.7 }}>{subText}</p>

          {isTutorial && correct && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: `${T.green}10`, border: `1px solid ${T.green}30`, borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: T.green }}>🎓 Tutorial complete! You're ready for the real cases.</div>
            </div>
          )}
        </div>

        {/* Gold line */}
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${bgColor}44,transparent)`, marginBottom: 24 }} />

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 20,
          opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.6s ease 0.3s",
        }}>
          {[["result","Result"],["debrief","Debrief"],["evidence","Evidence"],["votes","Votes"]].map(([id, lbl]) => (
            <button key={id} className={`btn btn-sm ${tab === id ? "btn-gold" : "btn-ghost"}`}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        <div style={{ opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.6s ease 0.4s" }}>

          {/* RESULT */}
          {tab === "result" && (
            <div>
              {!revealKiller ? (
                <button className="btn btn-gold btn-lg"
                  style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}
                  onClick={() => setRevealKiller(true)}>
                  Reveal the Full Truth
                </button>
              ) : (
                <div className="card card-gold" style={{ padding: 20, marginBottom: 14 }}>
                  <SectionLabel style={{ marginBottom: 8 }}>The Full Story</SectionLabel>
                  <div className="display" style={{ fontSize: 22, color: T.gold, marginBottom: 6 }}>
                    {verdict.killer.name} — {verdict.killer.role}
                  </div>
                  <p style={{ fontSize: 14, color: T.inkSec, lineHeight: 1.75 }}>{verdict.reason}</p>
                </div>
              )}
            </div>
          )}

          {/* DEBRIEF */}
          {tab === "debrief" && (
            <div>
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <SectionLabel style={{ marginBottom: 8 }}>Your Suspicion Level</SectionLabel>
                <SuspicionMeter value={verdict.revSuspicion || 15} />
                <div style={{ fontSize: 12, color: T.inkMut, marginTop: 8 }}>
                  {(verdict.revSuspicion || 15) < 40
                    ? "You stayed clear during the reverse interrogation."
                    : "Your alibi raised some eyebrows with the interrogator."}
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <SectionLabel style={{ marginBottom: 8 }}>Evidence Summary</SectionLabel>
                <div style={{ fontSize: 13, color: T.inkSec, marginBottom: 10 }}>
                  Found {verdict.foundClues.length} of {caseData.clues.length} clues ·{" "}
                  {verdict.foundClues.filter(c => c.critical).length} critical
                </div>
                {verdict.foundClues.map(c => (
                  <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: c.critical ? T.gold : T.teal, fontSize: 12 }}>◆</span>
                    <span style={{ fontSize: 12, color: T.inkSec }}>
                      <strong style={{ color: T.ink }}>{c.name}</strong> — {c.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVIDENCE */}
          {tab === "evidence" && (
            <div>
              <SectionLabel style={{ marginBottom: 12 }}>All Clues — Full Reveal</SectionLabel>
              {caseData.clues.map(c => (
                <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 12, opacity: c.found ? 1 : 0.45 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{c.found ? "🔎" : "❓"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                      {c.name}
                      {c.critical && <span className="tag tag-gold" style={{ fontSize: 9, marginLeft: 8 }}>CRITICAL</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T.inkSec, lineHeight: 1.55 }}>
                      {c.desc}
                      {!c.found && <span style={{ color: T.inkMut }}> (missed — was in {c.room})</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VOTES */}
          {tab === "votes" && (
            <div>
              <SectionLabel style={{ marginBottom: 12 }}>Team Vote Results</SectionLabel>
              {Object.keys(verdict.teamVotes || {}).length === 0 && (
                <p style={{ color: T.inkMut, fontSize: 13 }}>No team votes were cast this game.</p>
              )}
              {Object.entries(verdict.teamVotes || {}).map(([pid, sid]) => {
                const p = (verdict.players || []).find(x => x.id.toString() === pid) || { name: "Player", color: T.teal };
                const s = caseData.suspects.find(x => x.id === sid) || { name: "Unknown", guilty: false };
                return (
                  <div key={pid} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, padding: "10px 14px", background: T.void, borderRadius: 6, border: `1px solid ${s.guilty ? T.green : T.red}22` }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: T.inkSec }}>→ {s.name}</span>
                    <span className={`tag tag-${s.guilty ? "green" : "red"}`} style={{ fontSize: 9 }}>
                      {s.guilty ? "CORRECT" : "WRONG"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex", gap: 10, marginTop: 24,
          opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.6s ease 0.5s",
        }}>
          <button className="btn btn-teal btn-lg" style={{ flex: 1, justifyContent: "center" }}
            onClick={() => onEnd("lobby")}>▶ Play Again</button>
          <button className="btn btn-ghost btn-lg" onClick={() => onEnd("home")}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}
