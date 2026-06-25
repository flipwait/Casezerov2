import React, { useState, useRef } from 'react';
import { T, getMood, MOODS } from '../tokens';
import { MoodBadge, LieMeter, SectionLabel, APIWarn } from './UI';
import { callAI, isAIErr, safeJSON, speakText } from '../hooks/useAI';

// ============================================================
// INTERROGATION TAB
// ============================================================
export function InterrogationTab({ caseData, suspects, selSuspect, setSelSuspect, interrogHist, setInterrogHist, questionCounts, setQuestionCounts, dynamicAlibis, lieScores, setLieScores, player, settings, diff }) {
  const [customQ, setCustomQ] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const hist = selSuspect ? (interrogHist[selSuspect.id] || []) : [];
  const qCount = selSuspect ? (questionCounts[selSuspect.id] || 0) : 0;
  const currentAlibi = selSuspect ? (dynamicAlibis[selSuspect.id] || selSuspect.alibi) : "";
  const alibiChanged = selSuspect && dynamicAlibis[selSuspect.id] && dynamicAlibis[selSuspect.id] !== selSuspect.alibi;
  const lieScore = selSuspect ? lieScores[selSuspect.id] : null;

  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [hist, selSuspect]);

  const askSuspect = async (suspect, question) => {
    if (!question.trim() || !settings.openaiKey) return;
    setLoading(true);
    const newCount = (questionCounts[suspect.id] || 0) + 1;
    setQuestionCounts(p => ({ ...p, [suspect.id]: newCount }));
    const mood = getMood(newCount - 1, suspect.guilty);
    const moodInfo = MOODS[mood];

    const sys = `You are ${suspect.name}, ${suspect.role}, age ${suspect.age}. Case: "${caseData.title}".
Victim: ${caseData.victim}. Current alibi: "${dynamicAlibis[suspect.id] || suspect.alibi}". Hidden secret: "${suspect.secret}".
Guilty: ${suspect.guilty ? "YES — deny convincingly, show subtle cracks under pressure." : "NO — innocent but nervous, hide your secret."}.
Current mood: ${mood} — ${moodInfo.desc}.
Mood behavior: ${mood === "cooperative" ? "Be open, give extra detail, maybe too much." : mood === "nervous" ? "Be shaky, contradict slightly, fidget." : mood === "defensive" ? "Keep answers short, deflect, turn questions back." : "Be curt, hostile, threaten to end the interview."}
Reply in 2-3 sentences. Human, realistic, emotionally consistent.`;

    const resp = await callAI(`Detective asks: "${question}"`, sys, `interrogate-${suspect.id}`, settings);

    let lieScore = null;
    if (!isAIErr(resp) && (settings.lieDetector || diff.lieDetectorForce)) {
      const lsys = "You are a deception analyst. Return ONLY JSON: {\"score\":45} where score 0-100 = deception likelihood. 100=definitely lying. Base on evasiveness, inconsistency, deflection.";
      const lraw = await callAI(`Suspect: ${suspect.name}. Guilty: ${suspect.guilty}. Mood: ${mood}. Q: "${question}". A: "${resp}"`, lsys, "lie-detect", settings);
      if (!isAIErr(lraw)) {
        const lp = safeJSON(lraw, { score: 50 });
        if (!lp._error && !lp._parseError) {
          lieScore = Math.min(100, Math.max(0, Number(lp.score) || 50));
          setLieScores(p => ({ ...p, [suspect.id]: lieScore }));
        }
      }
    }

    const entry = { q: question, a: resp, player: player.name, lieScore, mood, isErr: isAIErr(resp) };
    setInterrogHist(p => ({ ...p, [suspect.id]: [...(p[suspect.id] || []), entry] }));
    setCustomQ("");
    if (!isAIErr(resp)) await speakText(resp, settings);
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, height: "100%" }}>
      {/* Suspect list */}
      <div>
        <SectionLabel style={{ marginBottom: 10 }}>Suspects</SectionLabel>
        {suspects.map(s => (
          <div key={s.id} className={`portrait-card ${selSuspect?.id === s.id ? "selected" : ""} ${(interrogHist[s.id]?.length || 0) > 3 && s.guilty ? "" : ""}`}
            style={{ marginBottom: 10 }} onClick={() => setSelSuspect(s)}>
            <div className="portrait-avatar" style={{ height: 56, fontSize: 28 }}>{s.avatar || "👤"}</div>
            <div className="portrait-body" style={{ padding: "10px 12px" }}>
              <div className="portrait-name" style={{ fontSize: 15 }}>{s.name}</div>
              <div className="portrait-role" style={{ marginBottom: 6 }}>{s.role}</div>
              {(questionCounts[s.id] || 0) > 0 && (
                <MoodBadge count={questionCounts[s.id] || 0} guilty={s.guilty} />
              )}
              {(interrogHist[s.id]?.length || 0) > 0 && (
                <div style={{ marginTop: 5 }}>
                  <span className="tag tag-muted" style={{ fontSize: 9 }}>{interrogHist[s.id].length} Q&A</span>
                  {lieScores[s.id] != null && (
                    <span className="tag tag-gold" style={{ fontSize: 9, marginLeft: 4 }}>{lieScores[s.id]}% lie</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat panel */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {!selSuspect ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMut, fontSize: 14 }}>
            Select a suspect to begin interrogation →
          </div>
        ) : (
          <>
            {/* Suspect header */}
            <div className="card card-gold" style={{ padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="display" style={{ fontSize: 22, color: T.gold }}>{selSuspect.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSec, marginTop: 2 }}>{selSuspect.role} · Age {selSuspect.age}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: alibiChanged ? T.amber : T.inkMut, display: "flex", alignItems: "center", gap: 5 }}>
                    {alibiChanged && <span style={{ color: T.amber, fontWeight: 700 }}>⚡</span>}
                    {currentAlibi}
                  </div>
                </div>
                {qCount > 0 && <MoodBadge count={qCount} guilty={selSuspect.guilty} />}
              </div>
              {(settings.lieDetector || diff.lieDetectorForce) && lieScore != null && (
                <div style={{ marginTop: 12 }}><LieMeter value={lieScore} /></div>
              )}
            </div>

            {/* Chat history */}
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, minHeight: 200, maxHeight: 320 }}>
              {hist.length === 0 && (
                <div style={{ textAlign: "center", color: T.inkMut, fontSize: 13, paddingTop: 40 }}>
                  No questions yet. Start interrogating {selSuspect.name}.
                </div>
              )}
              {hist.map((e, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div className="bubble bubble-user">
                      <span style={{ fontSize: 10, color: T.teal, display: "block", marginBottom: 3 }}>{e.player}</span>
                      {e.q}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div className={`bubble ${e.isErr ? "bubble-error" : "bubble-ai"}`}>
                        {!e.isErr && (
                          <span style={{ fontSize: 10, display: "block", marginBottom: 3, color: MOODS[e.mood]?.color || T.gold }}>
                            {selSuspect.name} {e.mood && `· ${MOODS[e.mood]?.icon} ${e.mood}`}
                          </span>
                        )}
                        {e.a}
                      </div>
                    </div>
                    {e.lieScore != null && (settings.lieDetector || diff.lieDetectorForce) && (
                      <span style={{ fontSize: 10, color: e.lieScore > 60 ? T.amber : T.inkMut, paddingLeft: 4 }}>
                        🧠 {e.lieScore}% — {e.lieScore < 25 ? "truthful" : e.lieScore < 50 ? "uncertain" : e.lieScore < 75 ? "evasive" : "likely lying"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px" }}>
                  <span className="spinner" />
                  <span style={{ fontSize: 11, color: T.inkMut }}>{selSuspect.name} responding…</span>
                </div>
              )}
            </div>

            {/* Suggested questions */}
            {caseData.interrogationQuestions?.[selSuspect.id]?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <SectionLabel style={{ marginBottom: 6 }}>Suggested</SectionLabel>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {caseData.interrogationQuestions[selSuspect.id].map((item, i) => (
                    <button key={i} className="btn btn-ghost btn-sm" onClick={() => askSuspect(selSuspect, item.q)} disabled={loading || !settings.openaiKey}>
                      {item.q.slice(0, 36)}…
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!settings.openaiKey && <div style={{ marginBottom: 10 }}><APIWarn /></div>}

            {/* Input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder={settings.openaiKey ? `Ask ${selSuspect.name.split(" ")[0]} anything…` : "Add OpenAI key in Settings to interrogate"}
                value={customQ} onChange={e => setCustomQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && customQ.trim() && !loading && settings.openaiKey && askSuspect(selSuspect, customQ)}
                disabled={!settings.openaiKey} style={{ flex: 1 }} />
              <button className="btn btn-gold" disabled={!customQ.trim() || loading || !settings.openaiKey}
                onClick={() => askSuspect(selSuspect, customQ)}>
                {loading ? <span className="spinner" /> : "Ask"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CROSS-EXAM TAB
// ============================================================
export function CrossExamTab({ caseData, suspects, selSuspect, setSelSuspect, crossState, setCrossState, dynamicAlibis, setDynamicAlibis, player, settings, diff }) {
  const [tactic, setTactic] = useState(null);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const state = selSuspect ? (crossState[selSuspect.id] || { round: 0, cracked: false, history: [] }) : null;
  const examData = selSuspect ? caseData.crossExam?.[selSuspect.id] : null;
  const pct = state && examData ? Math.min(100, Math.round((state.round / (examData.threshold || 3)) * 100)) : 0;
  const alibiChanged = selSuspect && dynamicAlibis[selSuspect.id] && dynamicAlibis[selSuspect.id] !== selSuspect.alibi;

  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [crossState, selSuspect]);

  const TACTICS = [
    { id: "evidence",      icon: "🔎", l: "Present Evidence" },
    { id: "contradiction", icon: "⚔",  l: "Point Contradiction" },
    { id: "bluff",         icon: "🎭", l: "Bluff Pressure" },
    { id: "witness",       icon: "👁",  l: "Cite Witness" },
  ];

  const doCrossExam = async (suspect, tactic) => {
    if (!settings.openaiKey) return;
    setLoading(true);
    const curState = crossState[suspect.id] || { round: 0, cracked: false, history: [] };
    const newRound = curState.round + 1;
    const threshold = Math.max(1, Math.round((examData?.threshold || 2) * diff.crackMult));
    const willCrack = newRound >= threshold && suspect.guilty;
    const currentAlibi = dynamicAlibis[suspect.id] || suspect.alibi;

    const sys = `You are ${suspect.name} under cross-examination.
Current alibi (may have shifted): "${currentAlibi}".
The contradiction being pressed: "${examData?.contradiction || "Your alibi doesn't add up."}".
Pressure point: "${examData?.pressure || "key evidence"}".
Guilty: ${suspect.guilty ? "YES" : "NO"}. Round ${newRound}/${threshold}.
${willCrack ? "BREAKING POINT — show a dramatic crack, near-confession, emotional breakdown, or devastating slip. Very tense. Very human." : "Hold firm but fracture subtly. Consider slightly adjusting your alibi to cover a gap — shift your story just enough to seem like a forgotten detail."}
2-3 sentences. Very human, very tense.`;

    const resp = await callAI(`Tactic "${tactic}" pressed on: "${examData?.contradiction}"`, sys, `cross-${suspect.id}`, settings);

    // Dynamic alibi update
    if (!willCrack && newRound > 1 && !isAIErr(resp)) {
      const asys = "Extract the suspect's NEW claimed alibi from their latest response in one sentence. If unchanged return the original. Return ONLY the alibi sentence.";
      const newAlibiRaw = await callAI(`Original: "${currentAlibi}". Latest: "${resp}"`, asys, "dynamic-alibi", settings);
      if (!isAIErr(newAlibiRaw) && newAlibiRaw.length > 10 && newAlibiRaw.length < 200) {
        setDynamicAlibis(p => ({ ...p, [suspect.id]: newAlibiRaw }));
      }
    }

    const newH = [...curState.history, { tactic, response: resp, round: newRound, cracked: willCrack, isErr: isAIErr(resp) }];
    setCrossState(p => ({ ...p, [suspect.id]: { round: newRound, cracked: willCrack || curState.cracked, history: newH } }));
    await speakText(resp, settings);
    setTactic(null);
    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
      {/* Suspect list */}
      <div>
        <SectionLabel style={{ marginBottom: 10 }}>Suspects</SectionLabel>
        {suspects.map(s => {
          const cs = crossState[s.id] || {};
          return (
            <div key={s.id} className={`portrait-card ${selSuspect?.id === s.id ? "selected" : ""} ${cs.cracked ? "cracked" : ""}`}
              style={{ marginBottom: 10 }} onClick={() => setSelSuspect(s)}>
              <div className="portrait-avatar" style={{ height: 56, fontSize: 28 }}>{s.avatar || "👤"}</div>
              <div className="portrait-body" style={{ padding: "10px 12px" }}>
                <div className="portrait-name" style={{ fontSize: 15 }}>{s.name}</div>
                <div className="portrait-role">{s.role}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {cs.cracked && <span className="tag tag-red" style={{ fontSize: 9 }}>CRACKED</span>}
                  {cs.round > 0 && !cs.cracked && <span className="tag tag-gold" style={{ fontSize: 9 }}>Rd {cs.round}</span>}
                  {dynamicAlibis[s.id] && <span className="tag tag-gold" style={{ fontSize: 9 }}>⚡ ALIBI</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-exam panel */}
      <div>
        {!selSuspect ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, color: T.inkMut, fontSize: 14 }}>
            Select a suspect to cross-examine →
          </div>
        ) : (
          <>
            <div className="card card-red" style={{ padding: "14px 16px", marginBottom: 12 }}>
              <div className="display" style={{ fontSize: 22, color: T.red, marginBottom: 3 }}>{selSuspect.name} — Cross-Exam</div>
              <div style={{ fontSize: 12, color: T.inkSec, marginBottom: alibiChanged ? 8 : 12 }}>
                Round {state.round} · {state.cracked ? "CRACKED" : "Holding firm"}
              </div>

              {alibiChanged && (
                <div style={{ padding: "8px 10px", background: `${T.amber}10`, border: `1px solid ${T.amber}30`, borderRadius: 4, marginBottom: 10, fontSize: 11 }}>
                  <span style={{ color: T.amber, fontWeight: 700 }}>⚡ ALIBI SHIFTED: </span>
                  <span style={{ color: T.inkSec }}>{dynamicAlibis[selSuspect.id]}</span>
                </div>
              )}

              {examData && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1 }} className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${T.amber}88,${T.red})` }} />
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: T.red }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.inkMut }}>
                    Contradiction: <span style={{ color: T.inkSec }}>{examData.contradiction}</span>
                  </div>
                </>
              )}
            </div>

            {/* Chat */}
            <div ref={chatRef} style={{ height: 190, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {state.history.length === 0 && (
                <div style={{ textAlign: "center", color: T.inkMut, fontSize: 12, paddingTop: 30 }}>
                  Choose a tactic to press {selSuspect.name}.
                </div>
              )}
              {state.history.map((e, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div className="bubble bubble-user" style={{ background: `${T.red}12`, borderColor: `${T.red}28` }}>
                      <span style={{ fontSize: 10, color: T.red, display: "block", marginBottom: 2 }}>Tactic: {e.tactic}</span>
                      Pressing the contradiction…
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div className={`bubble ${e.isErr ? "bubble-error" : e.cracked ? "bubble-pressure" : "bubble-ai"}`}>
                      <span style={{ fontSize: 10, color: e.cracked ? T.red : T.inkMut, display: "block", marginBottom: 2 }}>
                        {e.cracked ? "⚠ CRACKING — " : ""}{selSuspect.name} Rd {e.round}
                      </span>
                      {e.response}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="spinner" /><span style={{ fontSize: 11, color: T.inkMut }}>Applying pressure…</span>
                </div>
              )}
            </div>

            {!state.cracked ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {TACTICS.map(t => (
                    <div key={t.id} className={`tactic-card ${tactic === t.id ? "selected" : ""}`}
                      onClick={() => setTactic(t.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{t.icon}</span>
                      <div style={{ fontSize: 12, fontWeight: 600, color: tactic === t.id ? T.red : T.ink }}>{t.l}</div>
                    </div>
                  ))}
                </div>
                {!settings.openaiKey && <div style={{ marginBottom: 10 }}><APIWarn /></div>}
                <button className="btn btn-red" style={{ width: "100%", justifyContent: "center" }}
                  disabled={!tactic || loading || !settings.openaiKey}
                  onClick={() => doCrossExam(selSuspect, tactic)}>
                  {loading ? <><span className="spinner" /> Pressing…</> : "⚔ Press the Contradiction"}
                </button>
              </>
            ) : (
              <div className="card card-red pulse-red" style={{ padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💥</div>
                <div className="display" style={{ fontSize: 24, color: T.red, marginBottom: 6 }}>SUSPECT CRACKED</div>
                <p style={{ fontSize: 13, color: T.inkSec }}>
                  The pressure broke {selSuspect.name}. Their last response may contain the truth.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// WITNESS TAB
// ============================================================
export function WitnessTab({ witnesses, witnessState, setWitnessState, player, settings }) {
  const [selWitness, setSelWitness] = useState(null);
  const [customQ, setCustomQ] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const wState = selWitness ? witnessState[selWitness.id] : null;
  const hist = wState?.chatHistory || [];

  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [witnessState, selWitness]);

  const TRIGGERS = [
    { id: "general",    label: "Opening Statement", icon: "💬" },
    { id: "suspicious", label: "Suspicious Behavior", icon: "🔍" },
    { id: "diana",      label: "About Diana",        icon: "👤" },
    { id: "noah",       label: "About Noah",         icon: "👤" },
    { id: "marcus",     label: "About Marcus",       icon: "👤" },
    { id: "camera",     label: "About Evidence",     icon: "📷" },
    { id: "victim",     label: "About Victim",       icon: "🎯" },
  ];

  const callWitness = async (witness, trigger) => {
    setLoading(true);
    const preset = witness.statements?.find(s => s.trigger === trigger) || witness.statements?.[0];
    const existing = witnessState[witness.id] || { chatHistory: [] };
    let response;

    if (preset && existing.chatHistory.length < 2) {
      response = preset.text;
    } else {
      const sys = `You are ${witness.name}, ${witness.role}. ${witness.summary}.
Known info: ${witness.statements?.map(s => s.text).join(" ") || "none"}.
Prior answers: ${existing.chatHistory.map(h => h.response).join(" | ") || "none"}.
Give a natural 2-3 sentence follow-up about: ${trigger}. Stay consistent.`;
      response = await callAI(`Witness asked about: "${trigger}"`, sys, `witness-${witness.id}`, settings);
    }

    const entry = { trigger, response: isAIErr(response) ? `[Witness unavailable: ${response.replace("[AI_ERROR]", "")}]` : response, player: player.name };
    setWitnessState(p => ({ ...p, [witness.id]: { unlocked: true, chatHistory: [...(p[witness.id]?.chatHistory || []), entry] } }));
    if (!isAIErr(response)) await speakText(response, settings);
    setLoading(false);
  };

  const askCustom = async (witness, q) => {
    if (!q.trim()) return;
    setLoading(true);
    const existing = witnessState[witness.id] || { chatHistory: [] };
    const sys = `You are ${witness.name}, ${witness.role}. ${witness.summary}.
Known: ${witness.statements?.map(s => s.text).join(" ") || "none"}.
Prior: ${existing.chatHistory.map(h => h.response).join(" | ") || "none"}.
Reply honestly in 2-3 sentences. Stay consistent.`;
    const resp = await callAI(`Detective asks: "${q}"`, sys, `witness-custom-${witness.id}`, settings);
    const entry = { trigger: "custom", question: q, response: isAIErr(resp) ? `[${resp.replace("[AI_ERROR]", "")}]` : resp, player: player.name };
    setWitnessState(p => ({ ...p, [witness.id]: { ...(p[witness.id] || { unlocked: true }), chatHistory: [...(p[witness.id]?.chatHistory || []), entry] } }));
    if (!isAIErr(resp)) await speakText(resp, settings);
    setCustomQ("");
    setLoading(false);
  };

  if (!witnesses || witnesses.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 10, color: T.inkMut }}>
        <span style={{ fontSize: 40 }}>👤</span>
        <div style={{ fontSize: 14 }}>No witnesses available in this case.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
      <div>
        <SectionLabel style={{ marginBottom: 10 }}>Witnesses</SectionLabel>
        {witnesses.map(w => (
          <div key={w.id} className={`witness-card-item ${selWitness?.id === w.id ? "selected" : ""}`}
            style={{ marginBottom: 10 }} onClick={() => setSelWitness(w)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>{w.avatar || "👤"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: T.inkSec }}>{w.role}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.inkMut, lineHeight: 1.4 }}>{w.summary}</div>
            {witnessState[w.id]?.unlocked && <span className="tag tag-teal" style={{ fontSize: 9, marginTop: 6 }}>SPOKE TO DETECTIVE</span>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {!selWitness ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMut, fontSize: 14 }}>
            Select a witness →
          </div>
        ) : (
          <>
            <div className="card card-teal" style={{ padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 32 }}>{selWitness.avatar || "👤"}</span>
                <div>
                  <div className="display" style={{ fontSize: 22, color: T.teal }}>{selWitness.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSec, marginTop: 2 }}>{selWitness.role}</div>
                  <div style={{ fontSize: 11, color: T.inkMut, marginTop: 3 }}>{selWitness.summary}</div>
                </div>
              </div>
            </div>

            {/* Trigger buttons */}
            <div style={{ marginBottom: 10 }}>
              <SectionLabel style={{ marginBottom: 7 }}>Ask about…</SectionLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TRIGGERS.filter(t => selWitness.statements?.some(s => s.trigger === t.id)).map(t => (
                  <button key={t.id} className="btn btn-teal btn-sm" onClick={() => callWitness(selWitness, t.id)} disabled={loading}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat history */}
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, minHeight: 160, maxHeight: 260 }}>
              {hist.length === 0 && (
                <div style={{ textAlign: "center", color: T.inkMut, fontSize: 12, paddingTop: 28 }}>
                  Select a topic or ask a custom question.
                </div>
              )}
              {hist.map((e, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {e.question && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div className="bubble bubble-user">
                        <span style={{ fontSize: 10, color: T.teal, display: "block", marginBottom: 2 }}>{e.player}</span>
                        {e.question}
                      </div>
                    </div>
                  )}
                  {!e.question && (
                    <div className="bubble bubble-system" style={{ alignSelf: "center", fontSize: 11 }}>
                      Asked about: {e.trigger}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div className={`bubble ${e.response?.startsWith("[") ? "bubble-error" : "bubble-witness"}`}>
                      <span style={{ fontSize: 10, color: T.teal, display: "block", marginBottom: 2 }}>{selWitness.name}</span>
                      {e.response}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <span className="spinner" /><span style={{ fontSize: 11, color: T.inkMut }}>{selWitness.name} thinking…</span>
                </div>
              )}
            </div>

            {/* Custom question */}
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder={`Ask ${selWitness.name.split(" ")[0]} anything…`}
                value={customQ} onChange={e => setCustomQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && customQ.trim() && !loading && (askCustom(selWitness, customQ), setCustomQ(""))}
                style={{ flex: 1 }} />
              <button className="btn btn-teal" disabled={!customQ.trim() || loading}
                onClick={() => { askCustom(selWitness, customQ); setCustomQ(""); }}>
                {loading ? <span className="spinner" /> : "Ask"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
