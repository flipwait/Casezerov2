import React, { useState } from 'react';
import { T, DIFFICULTY, PLAYER_COLORS } from '../tokens';
import { APIWarn, SectionLabel, Divider } from './UI';
import { callAI, isAIErr, safeJSON } from '../hooks/useAI';
import { CASES } from '../data/cases';

const TIMER_OPTS = [
  { v: 0, l: "Off" }, { v: 15, l: "15 min" }, { v: 20, l: "20 min" },
  { v: 30, l: "30 min" }, { v: 45, l: "45 min" },
];

export function LobbyScreen({ settings, onStart, onBack }) {
  const [players, setPlayers] = useState([{ id: 1, name: "Detective 1", color: PLAYER_COLORS[0] }]);
  const [newName, setNewName] = useState("");
  const [mode, setMode] = useState("combined");
  const [diff, setDiff] = useState("medium");
  const [timerOverride, setTimerOverride] = useState(-1);
  const [selCase, setSelCase] = useState(CASES[0]);
  const [gen, setGen] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const d = DIFFICULTY[diff];
  const timerMins = timerOverride >= 0 ? timerOverride : d.timer;

  const addPlayer = () => {
    if (players.length >= 8) return;
    const name = newName.trim() || `Detective ${players.length + 1}`;
    setPlayers(p => [...p, { id: Date.now(), name, color: PLAYER_COLORS[p.length % 8] }]);
    setNewName("");
  };

  const generateCase = async () => {
    setGen(true); setGenErr("");
    const prompt = `Create a detective mystery. Return ONLY valid compact JSON — no markdown, no explanation:
{"id":"c${Date.now()}","title":"Title","setting":"Setting","summary":"One hook sentence","victim":"Name, age, role","cause":"Crime method","killer":"Must match suspect name exactly","killerReason":"2-sentence motive","narratorIntro":"1-2 sentence noir atmosphere","theme":"gold","suspects":[{"id":"s1","name":"Name","role":"Role","age":35,"avatar":"👤","guilty":false,"alibi":"Alibi","secret":"Secret","dossier":{"background":"","associates":"","record":"","financials":""},"timeline":[{"t":"9pm","a":"Action"}]},{"id":"s2","name":"Name","role":"Role","age":40,"avatar":"👤","guilty":true,"alibi":"Alibi","secret":"Secret","dossier":{"background":"","associates":"","record":"","financials":""},"timeline":[]},{"id":"s3","name":"Name","role":"Role","age":45,"avatar":"👤","guilty":false,"alibi":"Alibi","secret":"Secret","dossier":{"background":"","associates":"","record":"","financials":""},"timeline":[]},{"id":"s4","name":"Name","role":"Role","age":50,"avatar":"👤","guilty":false,"alibi":"Alibi","secret":"Secret","dossier":{"background":"","associates":"","record":"","financials":""},"timeline":[]}],"clues":[{"id":"c1","name":"Clue","desc":"Detail","critical":true,"room":"Room A","found":false},{"id":"c2","name":"Clue","desc":"Detail","critical":true,"room":"Room B","found":false},{"id":"c3","name":"Clue","desc":"Detail","critical":false,"room":"Room A","found":false},{"id":"c4","name":"Clue","desc":"Detail","critical":false,"room":"Room C","found":false},{"id":"c5","name":"Clue","desc":"Detail","critical":false,"room":"Room B","found":false}],"rooms":["Room A","Room B","Room C"],"witnesses":[{"id":"w1","name":"Name","role":"Role","avatar":"👤","summary":"One line","statements":[{"trigger":"general","text":"Opening statement"},{"trigger":"suspicious","text":"Something odd they noticed"}]}],"interrogationQuestions":{"s1":[{"q":"Question?"}],"s2":[{"q":"Question?"}]},"reverseInterrogation":{"alibi":"Detective claim","secret":"Vulnerability","questions":["Q1?","Q2?","Q3?"]},"crossExam":{"s2":{"contradiction":"The contradiction","pressure":"Key pressure point","threshold":2}}}
Theme: ${customPrompt || "Dramatic murder at a private members club"}. Be original and surprising.`;

    const raw = await callAI(prompt, "Return ONLY valid compact JSON. No markdown. No extra text.", "case-gen", settings);
    if (isAIErr(raw)) { setGenErr(raw.replace("[AI_ERROR]", "").trim()); setGen(false); return; }
    const parsed = safeJSON(raw);
    if (parsed._error || parsed._parseError) {
      setGenErr(parsed._error || `JSON parse failed. Try again.`);
      setGen(false); return;
    }
    // Patch missing fields
    parsed.suspects?.forEach(s => {
      s.dossier = s.dossier || { background: "", associates: "", record: "None", financials: "" };
      s.timeline = s.timeline || [];
    });
    parsed.witnesses = parsed.witnesses || [];
    parsed.reverseInterrogation = parsed.reverseInterrogation || { alibi: "", secret: "", questions: ["Where were you?", "Who do you know here?", "Why this case?"] };
    parsed.crossExam = parsed.crossExam || {};
    setSelCase(parsed);
    setShowCustom(false);
    setGen(false);
  };

  const MODES = [
    { id: "detective",     icon: "🔍", l: "Detective Mode",    d: "Explore rooms and find evidence" },
    { id: "interrogation", icon: "💬", l: "Interrogation Mode", d: "AI suspects, witnesses, cross-exam" },
    { id: "combined",      icon: "🗂", l: "Full Investigation ★", d: "Everything — detect, interrogate, forensics, grill" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 28 }} onClick={onBack}>← Back</button>
      <h2 className="display" style={{ fontSize: 42, color: T.paper, marginBottom: 4 }}>MISSION BRIEFING</h2>
      <p style={{ color: T.inkSec, marginBottom: 28, fontSize: 14 }}>Configure your team, difficulty, and case.</p>

      {!settings.openaiKey && <div style={{ marginBottom: 20 }}><APIWarn /></div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* PLAYERS */}
        <div className="card" style={{ padding: 20 }}>
          <SectionLabel style={{ marginBottom: 12 }}>Detectives ({players.length}/8)</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {players.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
                {players.length > 1 && (
                  <button className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", fontSize: 11 }}
                    onClick={() => setPlayers(pl => pl.filter(x => x.id !== p.id))}>✕</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" placeholder="Player name" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addPlayer()}
              style={{ flex: 1 }} />
            <button className="btn btn-teal" onClick={addPlayer} disabled={players.length >= 8}>+</button>
          </div>
        </div>

        {/* MODE */}
        <div className="card" style={{ padding: 20 }}>
          <SectionLabel style={{ marginBottom: 12 }}>Game Mode</SectionLabel>
          {MODES.map(m => (
            <div key={m.id} onClick={() => setMode(m.id)} style={{
              padding: "10px 14px", borderRadius: 6, cursor: "pointer", marginBottom: 8,
              border: `1px solid ${mode === m.id ? T.teal : T.smoke}`,
              background: mode === m.id ? `${T.teal}0A` : T.shadow,
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: mode === m.id ? T.teal : T.ink }}>{m.l}</div>
                  <div style={{ fontSize: 11, color: T.inkSec }}>{m.d}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DIFFICULTY */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <SectionLabel style={{ marginBottom: 12 }}>Difficulty</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {Object.values(DIFFICULTY).map(dv => (
            <div key={dv.id} className={`diff-card ${diff === dv.id ? "selected" : ""}`} onClick={() => setDiff(dv.id)}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{dv.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: diff === dv.id ? T.gold : T.ink, marginBottom: 5 }}>{dv.label}</div>
              <div style={{ fontSize: 11, color: T.inkSec, lineHeight: 1.5 }}>{dv.desc}</div>
              {dv.permadeath && <span className="tag tag-red" style={{ marginTop: 8, fontSize: 9 }}>PERMADEATH</span>}
            </div>
          ))}
        </div>
        <SectionLabel style={{ marginBottom: 8 }}>Case Timer</SectionLabel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TIMER_OPTS.map(t => (
            <button key={t.v} className={`btn btn-sm ${timerOverride === t.v ? "btn-teal" : "btn-ghost"}`}
              onClick={() => setTimerOverride(t.v)}>
              {t.l}{t.v > 0 && t.v === d.timer ? " ★" : ""}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.inkMut, marginTop: 8 }}>
          Timer: {timerMins === 0 ? "Off" : `${timerMins} minutes`} — killer escapes when time runs out
        </div>
      </div>

      {/* CASE SELECT */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <SectionLabel style={{ marginBottom: 12 }}>Select Case</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 14 }}>
          {CASES.map(c => (
            <div key={c.id} onClick={() => setSelCase(c)} style={{
              padding: "14px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${selCase?.id === c.id ? T.gold : T.smoke}`,
              background: selCase?.id === c.id ? `${T.gold}0A` : T.shadow,
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: selCase?.id === c.id ? T.gold : T.ink, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: T.inkSec, marginBottom: 8 }}>{c.setting}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span className="tag tag-muted" style={{ fontSize: 9 }}>{c.suspects?.length} suspects</span>
                <span className="tag tag-muted" style={{ fontSize: 9 }}>{c.clues?.length} clues</span>
              </div>
            </div>
          ))}
          <div onClick={() => setShowCustom(true)} style={{
            padding: "14px", borderRadius: 6, cursor: "pointer",
            border: `1px dashed ${T.smoke}`, background: T.shadow,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 6, minHeight: 90,
          }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <span style={{ fontSize: 12, color: T.inkMut }}>AI Generate</span>
          </div>
        </div>

        {selCase && (
          <div style={{ padding: "14px 16px", background: T.shadow, borderRadius: 6, border: `1px solid ${T.smoke}` }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: T.paper, marginBottom: 3 }}>{selCase.title}</div>
            <div style={{ fontSize: 13, color: T.inkSec, marginBottom: 10, lineHeight: 1.6 }}>{selCase.summary}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="tag tag-muted">{selCase.suspects?.length} suspects</span>
              <span className="tag tag-muted">{selCase.clues?.length} clues</span>
              <span className="tag tag-teal">{selCase.witnesses?.length || 0} witnesses</span>
              <span className="tag tag-muted">{selCase.rooms?.length} locations</span>
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-gold btn-lg" style={{ width: "100%", fontSize: 15, letterSpacing: "0.12em" }}
        disabled={!selCase}
        onClick={() => onStart({ players, caseData: selCase, gameMode: mode, difficulty: diff, timerMinutes: timerMins })}>
        ▶ BEGIN INVESTIGATION
      </button>

      {/* Custom case modal */}
      {showCustom && (
        <div className="overlay" onClick={() => setShowCustom(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="display" style={{ fontSize: 28, marginBottom: 8 }}>AI CASE GENERATOR</h3>
            <p style={{ color: T.inkSec, fontSize: 13, marginBottom: 16 }}>Describe the theme. GPT builds the full mystery with suspects, clues, and witnesses.</p>
            <textarea className="input" placeholder="e.g. 'Spy thriller on a 1940s Orient Express' or 'Cozy Christmas village mystery' or 'Sci-fi space station murder'"
              value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} style={{ marginBottom: 14 }} />
            {genErr && <div style={{ color: T.red, fontSize: 12, marginBottom: 12, padding: "10px 12px", background: `${T.red}0A`, borderRadius: 6 }}>❌ {genErr}</div>}
            {!settings.openaiKey && <div style={{ marginBottom: 12 }}><APIWarn /></div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-gold" onClick={generateCase} disabled={gen || !settings.openaiKey} style={{ flex: 1 }}>
                {gen ? <><span className="spinner" /> Generating…</> : "✨ Generate Case"}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowCustom(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
