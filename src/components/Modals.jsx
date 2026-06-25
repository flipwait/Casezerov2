import React, { useState, useRef, useEffect } from 'react';
import { T, DIFFICULTY } from '../tokens';
import { SuspicionMeter, SectionLabel } from './UI';
import { callAI, isAIErr, safeJSON, speakText } from '../hooks/useAI';

// ============================================================
// DOSSIER MODAL
// ============================================================
export function DossierModal({ suspect, suspects, dynamicAlibis, onClose }) {
  const [cur, setCur] = useState(suspect);
  const d = cur.dossier || {};
  const alibiChanged = dynamicAlibis[cur.id] && dynamicAlibis[cur.id] !== cur.alibi;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide anim-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <span className="tag tag-purple" style={{ marginBottom: 10, display: "inline-flex" }}>📋 Suspect Dossier</span>
            <h3 className="display" style={{ fontSize: 36, color: T.paper, marginTop: 6 }}>{cur.name}</h3>
            <div style={{ fontSize: 13, color: T.inkSec, marginTop: 3 }}>{cur.role} · Age {cur.age}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Suspect switcher */}
        <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
          {suspects.map(s => (
            <button key={s.id} className={`btn btn-sm ${cur.id === s.id ? "btn-purple" : "btn-ghost"}`}
              onClick={() => setCur(s)}>
              {s.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Alibi shift banner */}
        {alibiChanged && (
          <div style={{ padding: "10px 14px", background: `${T.amber}10`, border: `1px solid ${T.amber}30`, borderRadius: 6, marginBottom: 16, fontSize: 12 }}>
            <span style={{ color: T.amber, fontWeight: 700 }}>⚡ ALIBI UPDATED DURING CROSS-EXAM: </span>
            <span style={{ color: T.inkSec }}>{dynamicAlibis[cur.id]}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[["Background", d.background], ["Known Associates", d.associates], ["Prior Record", d.record], ["Financials", d.financials]].map(([label, val]) => (
            <div key={label} className="card" style={{ padding: 14 }}>
              <SectionLabel style={{ marginBottom: 6 }}>{label}</SectionLabel>
              <div style={{ fontSize: 13, color: T.inkSec, lineHeight: 1.65 }}>{val || "Unknown"}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 14 }}>
          <SectionLabel style={{ marginBottom: 6 }}>Original Alibi</SectionLabel>
          <div style={{ fontSize: 13, color: T.inkSec }}>{cur.alibi}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TIMELINE MODAL
// ============================================================
export function TimelineModal({ suspect, suspects, onClose }) {
  const [cur, setCur] = useState(suspect);
  const tl = cur.timeline || [];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide anim-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <span className="tag tag-teal" style={{ marginBottom: 10, display: "inline-flex" }}>⏱ Alibi Timeline</span>
            <h3 className="display" style={{ fontSize: 36, color: T.paper, marginTop: 6 }}>{cur.name}</h3>
            <div style={{ fontSize: 13, color: T.inkSec }}>{cur.role}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
          {suspects.map(s => (
            <button key={s.id} className={`btn btn-sm ${cur.id === s.id ? "btn-teal" : "btn-ghost"}`}
              onClick={() => setCur(s)}>
              {s.name.split(" ")[0]}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", paddingLeft: 20 }}>
          <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 1, background: T.smoke }} />
          {tl.length === 0 && <p style={{ color: T.inkMut, fontSize: 13 }}>No timeline data available.</p>}
          {tl.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, position: "relative" }}>
              <div style={{ position: "absolute", left: -15, top: 4, width: 9, height: 9, borderRadius: "50%", background: T.teal, border: `2px solid ${T.abyss}` }} />
              <div>
                <div className="mono" style={{ fontSize: 12, color: T.teal, marginBottom: 3 }}>{e.t}</div>
                <div style={{ fontSize: 13, color: T.inkSec, lineHeight: 1.55 }}>{e.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACCUSE MODAL
// ============================================================
export function AccuseModal({ suspects, accusation, setAccusation, crossState, onConfirm, onClose, player }) {
  return (
    <div className="overlay">
      <div className="modal anim-up">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚖</div>
          <h3 className="display" style={{ fontSize: 36, color: T.red, marginBottom: 6 }}>FINAL ACCUSATION</h3>
          <p style={{ color: T.inkSec, fontSize: 13, lineHeight: 1.7 }}>
            One chance. Choose carefully, {player.name}.<br />
            This is irreversible.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {suspects.map(s => (
            <div key={s.id} className={`accuse-card ${accusation === s.id ? "selected" : ""}`}
              onClick={() => setAccusation(s.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{s.avatar || "👤"}</span>
                  <div>
                    <div className="display" style={{ fontSize: 20 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: T.inkSec }}>{s.role}</div>
                    {crossState[s.id]?.cracked && (
                      <span className="tag tag-red" style={{ fontSize: 9, marginTop: 5 }}>CRACKED UNDER PRESSURE</span>
                    )}
                  </div>
                </div>
                {accusation === s.id && <span style={{ color: T.red, fontSize: 24 }}>◉</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-red btn-lg" disabled={!accusation} onClick={onConfirm} style={{ flex: 1, justifyContent: "center" }}>
            CONFIRM ACCUSATION
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEAM VOTE MODAL
// ============================================================
export function TeamVoteModal({ players, suspects, teamVotes, setTeamVotes, onClose }) {
  const tally = {};
  suspects.forEach(s => { tally[s.id] = Object.values(teamVotes).filter(v => v === s.id).length; });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide anim-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <span className="tag tag-teal" style={{ marginBottom: 10, display: "inline-flex" }}>🗳 Team Vote</span>
            <h3 className="display" style={{ fontSize: 36, color: T.teal, marginTop: 6 }}>WHO'S THE KILLER?</h3>
            <p style={{ fontSize: 13, color: T.inkSec, marginTop: 4 }}>Each player casts their vote. Majority rules the accusation.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {players.map(p => (
          <div key={p.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
              {suspects.map(s => (
                <div key={s.id} style={{
                  padding: "10px 12px", borderRadius: 6, cursor: "pointer",
                  border: `2px solid ${teamVotes[p.id] === s.id ? T.teal : T.smoke}`,
                  background: teamVotes[p.id] === s.id ? `${T.teal}0A` : T.shadow,
                  transition: "all 0.15s",
                }} onClick={() => setTeamVotes(v => ({ ...v, [p.id]: s.id }))}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: teamVotes[p.id] === s.id ? T.teal : T.ink }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.inkSec }}>{s.role}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="card card-teal" style={{ padding: 14, marginTop: 10 }}>
          <SectionLabel style={{ marginBottom: 10 }}>Live Tally</SectionLabel>
          {suspects.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 110, fontSize: 12, color: T.inkSec }}>{s.name}</div>
              <div style={{ flex: 1 }} className="bar-track">
                <div className="bar-fill" style={{ width: `${players.length ? (tally[s.id] / players.length) * 100 : 0}%`, background: T.teal }} />
              </div>
              <span className="mono" style={{ fontSize: 12, color: T.teal, width: 18 }}>{tally[s.id]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REVERSE INTERROGATION MODAL
// ============================================================
export function ReverseModal({ caseData, player, state, setState, onSubmit, onClose, diff, settings }) {
  const ri = caseData.reverseInterrogation;
  const qList = ri?.questions?.slice(0, diff.reverseQ) || [];
  const curQ = qList[state.qIdx];
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [state.history]);

  const suspColor = state.suspicion < 30 ? T.green : state.suspicion < 60 ? T.amber : state.suspicion < 80 ? T.orange : T.red;

  const handleSubmit = async () => {
    const q = curQ;
    const ans = state.ans.trim();
    if (!ans) return;
    if (!settings.openaiKey) {
      setState(s => ({ ...s, error: "No OpenAI key — add it in Settings." }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: "" }));
    const sys = `You are a hard-boiled detective inspector grilling Detective ${player.name}.
Alibi: "${ri.alibi}". Vulnerability: "${ri.secret}". Be adversarial, skeptical, persistent.
Rate believability 1-10 and react. Return ONLY JSON: {"score":7,"response":"2-3 sentence reaction."}`;
    const raw = await callAI(`Question: "${q}"\nAnswer: "${ans}"`, sys, "reverse", settings);
    if (isAIErr(raw)) {
      setState(s => ({ ...s, loading: false, error: raw.replace("[AI_ERROR]", "").trim() }));
      return;
    }
    const parsed = safeJSON(raw, { score: 5, response: "...your answer has been noted." });
    if (parsed._error || parsed._parseError) {
      setState(s => ({ ...s, loading: false, error: `Could not parse response. Raw: ${parsed._raw?.slice(0, 60)}` }));
      return;
    }
    const score = Math.min(10, Math.max(1, Number(parsed.score) || 5));
    const aiResp = parsed.response || "...your answer has been noted.";
    const delta = score >= 7 ? -(Math.floor(Math.random() * 15) + 5) : score >= 4 ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 20) + 8;
    const newSusp = Math.min(100, Math.max(0, state.suspicion + delta));
    const isDone = state.qIdx >= qList.length - 1;
    setState(s => ({
      ...s, loading: false, error: "",
      history: [...s.history, { q, a: ans, aiResp, score, delta }],
      suspicion: newSusp, qIdx: s.qIdx + 1, ans: "", done: isDone,
    }));
    await speakText(aiResp, settings);
  };

  return (
    <div className="overlay">
      <div className="modal modal-wide anim-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <span className="tag tag-purple" style={{ marginBottom: 10, display: "inline-flex" }}>🎯 Reverse Interrogation</span>
            <h3 className="display" style={{ fontSize: 30, color: T.purple, marginTop: 6 }}>YOU'RE IN THE HOT SEAT</h3>
            <p style={{ fontSize: 12, color: T.inkSec, marginTop: 4 }}>{player.name} · {qList.length} questions · {diff.label}</p>
          </div>
          {state.done && <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <SuspicionMeter value={state.suspicion} label={`${player.name}'s Suspicion Level`} />
        </div>

        {state.error && (
          <div style={{ background: `${T.red}0E`, border: `1px solid ${T.red}33`, borderRadius: 6, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span>❌</span>
            <div style={{ fontSize: 12, color: T.red }}>{state.error}</div>
          </div>
        )}

        <div ref={ref} style={{ height: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {state.history.length === 0 && !state.loading && (
            <div className="bubble bubble-system" style={{ alignSelf: "center" }}>
              The interrogator enters. The pressure is immediate.
            </div>
          )}
          {state.history.map((e, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div className="bubble bubble-reverse">
                  <span style={{ fontSize: 10, color: T.purple, display: "block", marginBottom: 3 }}>Interrogator</span>
                  {e.q}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div className="bubble bubble-user">
                  <span style={{ fontSize: 10, color: T.teal, display: "block", marginBottom: 3 }}>{player.name}</span>
                  {e.a}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div className="bubble" style={{ background: e.delta > 5 ? `${T.red}10` : `${T.purple}10`, border: `1px solid ${e.delta > 5 ? T.red : T.purple}28` }}>
                  <span style={{ fontSize: 10, color: e.delta > 5 ? T.red : T.purple, display: "block", marginBottom: 3 }}>
                    Credibility: {e.score}/10 · {e.delta > 0 ? `▲ +${e.delta}% suspicion` : `▼ ${Math.abs(e.delta)}% suspicion`}
                  </span>
                  {e.aiResp}
                </div>
              </div>
            </div>
          ))}
          {state.loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px" }}>
              <span className="spinner" />
              <span style={{ fontSize: 11, color: T.inkMut }}>Interrogator considering…</span>
            </div>
          )}
        </div>

        {!state.done && curQ && !state.loading ? (
          <>
            <div className="card card-purple" style={{ padding: "12px 14px", marginBottom: 12 }}>
              <SectionLabel style={{ marginBottom: 6 }}>Interrogator asks:</SectionLabel>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: T.paper }}>{curQ}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="Your answer — be convincing…"
                value={state.ans} onChange={e => setState(s => ({ ...s, ans: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && state.ans.trim() && handleSubmit()}
                style={{ flex: 1 }} />
              <button className="btn btn-purple" disabled={!state.ans.trim() || state.loading} onClick={handleSubmit}>Answer</button>
            </div>
          </>
        ) : state.done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ padding: 20, background: `${suspColor}10`, border: `1px solid ${suspColor}33`, borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{state.suspicion < 30 ? "✅" : state.suspicion < 60 ? "😬" : "🚨"}</div>
              <div className="display" style={{ fontSize: 32, color: suspColor, marginBottom: 6 }}>
                FINAL SUSPICION: {state.suspicion}%
              </div>
              <p style={{ fontSize: 13, color: T.inkSec, lineHeight: 1.7 }}>
                {state.suspicion < 30 ? "You handled yourself well. The interrogator found nothing." :
                  state.suspicion < 60 ? "Shaky performance. They're keeping a close eye on you." :
                    state.suspicion < 80 ? "You're under serious scrutiny. Your answers raised more questions." :
                      "They nearly arrested you. Solve this case before the tables turn."}
              </p>
            </div>
            <button className="btn btn-teal btn-lg" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
              ← Return to Investigation
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// MOBILE COMPANION MODAL
// ============================================================
export function MobileModal({ foundClues, suspects, caseData, player, onClose }) {
  const [tab, setTab] = useState("clues");
  const [copied, setCopied] = useState(false);
  const summary = `CASEZERO — ${caseData.title}\nDetective: ${player.name}\n\nCLUES FOUND (${foundClues.length}):\n${foundClues.map(c => `• ${c.name}: ${c.desc}`).join("\n") || "None yet"}\n\nSUSPECTS:\n${suspects.map(s => `• ${s.name} (${s.role}) — ${s.alibi}`).join("\n")}`;
  const copy = () => { navigator.clipboard.writeText(summary).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {}); };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide anim-up" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <span className="tag tag-teal" style={{ marginBottom: 10, display: "inline-flex" }}>📱 Mobile Companion</span>
            <h3 className="display" style={{ fontSize: 30, color: T.teal, marginTop: 6 }}>YOUR CASE ON ANY SCREEN</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {[["clues", "🔎 Clues"], ["suspects", "👤 Suspects"], ["share", "📤 Share"]].map(([id, lbl]) => (
            <button key={id} className={`btn btn-sm ${tab === id ? "btn-teal" : "btn-ghost"}`} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        {tab === "clues" && (
          <div style={{ background: T.abyss, border: `2px solid ${T.smoke}`, borderRadius: 16, padding: 16, maxWidth: 300, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div className="mono" style={{ fontSize: 9, color: T.teal, letterSpacing: "0.2em" }}>CASEZERO · FIELD NOTES</div>
              <div className="display" style={{ fontSize: 18, marginTop: 4 }}>{caseData.title}</div>
              <div style={{ fontSize: 11, color: T.inkSec, marginTop: 2 }}>Det. {player.name}</div>
            </div>
            {foundClues.length === 0 && <div style={{ textAlign: "center", color: T.inkMut, fontSize: 13, padding: 20 }}>No clues yet.</div>}
            {foundClues.map(c => (
              <div key={c.id} style={{ background: T.void, border: `1px solid ${T.smoke}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span>{c.critical ? "🔑" : "🔎"}</span>
                  {c.critical && <span className="tag tag-gold" style={{ fontSize: 9 }}>KEY</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.inkSec, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "suspects" && (
          <div style={{ background: T.abyss, border: `2px solid ${T.smoke}`, borderRadius: 16, padding: 16, maxWidth: 300, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div className="mono" style={{ fontSize: 9, color: T.gold, letterSpacing: "0.2em" }}>SUSPECT PROFILES</div>
            </div>
            {suspects.map(s => (
              <div key={s.id} style={{ background: T.void, border: `1px solid ${T.smoke}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div className="display" style={{ fontSize: 16, marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.gold, marginBottom: 3 }}>{s.role}</div>
                <div style={{ fontSize: 11, color: T.inkSec }}>Alibi: {s.alibi}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "share" && (
          <div>
            <div className="card card-teal" style={{ padding: 16, marginBottom: 14 }}>
              <SectionLabel style={{ marginBottom: 8 }}>Copy Case Summary</SectionLabel>
              <div className="mono" style={{ fontSize: 10, color: T.inkSec, lineHeight: 1.7, background: T.abyss, padding: 12, borderRadius: 6, maxHeight: 180, overflowY: "auto", whiteSpace: "pre-wrap", marginBottom: 12 }}>
                {summary}
              </div>
              <button className={`btn ${copied ? "btn-green" : "btn-teal"}`} style={{ width: "100%", justifyContent: "center" }} onClick={copy}>
                {copied ? "✅ Copied!" : "📋 Copy to Clipboard"}
              </button>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <SectionLabel style={{ marginBottom: 8 }}>Tips for Mobile Play</SectionLabel>
              {[
                "Copy and paste into your phone's Notes app",
                "Screenshot the Clues tab for quick reference during play",
                "For hot-seat games: pass the device between turns",
                "Text the summary to other players as their private briefing",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: T.teal, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13, color: T.inkSec, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
