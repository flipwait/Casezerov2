import React, { useState, useEffect, useCallback } from 'react';
import { T, DIFFICULTY } from '../tokens';
import { SuspicionMeter, NarratorBar, CaseTimer, PlayerChip, APIWarn, SectionLabel, MoodBadge } from './UI';
import { CorkboardPanel } from './Corkboard';
import { InterrogationTab, CrossExamTab, WitnessTab } from './Interrogation';
import { DossierModal, TimelineModal, AccuseModal, TeamVoteModal, ReverseModal, MobileModal } from './Modals';
import { VerdictScreen } from './Verdict';
import { callAI, isAIErr } from '../hooks/useAI';

export function GameScreen({ gameState, settings, onEnd, isTutorial = false }) {
  const { players = [], caseData = {}, gameMode, difficulty, timerMinutes = 0 } = gameState;
  const diff = DIFFICULTY[difficulty] || DIFFICULTY.medium;

  const [phase, setPhase] = useState(gameMode === "interrogation" ? "interrogation" : "detective");
  const [curPlayer, setCurPlayer] = useState(0);
  const [clues, setClues] = useState(() => {
    let c = caseData.clues?.map(x => ({ ...x })) || [];
    if (diff.freeClues > 0) {
      let g = 0;
      c = c.map(x => {
        if (!x.found && x.critical && g < diff.freeClues) {
          g++;
          return { ...x, found: true };
        }
        return x;
      });
    }
    return c;
  });

  const [notes, setNotes] = useState({});
  const [activeRoom, setActiveRoom] = useState(caseData.rooms?.[0]);
  const [selSuspect, setSelSuspect] = useState(null);
  const [interrogHist, setInterrogHist] = useState({});
  const [questionCounts, setQuestionCounts] = useState({});
  const [dynamicAlibis, setDynamicAlibis] = useState({});
  const [lieScores, setLieScores] = useState({});
  const [crossState, setCrossState] = useState({});
  const [witnessState, setWitnessState] = useState({});
  const [subTab, setSubTab] = useState("interrogate");
  const [hint, setHint] = useState("");
  const [hintUsed, setHintUsed] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [narrator, setNarrator] = useState({ text: caseData.narratorIntro || "", loading: false });
  const [showAccuse, setShowAccuse] = useState(false);
  const [accusation, setAccusation] = useState(null);
  const [showReverse, setShowReverse] = useState(false);
  const [revState, setRevState] = useState({ suspicion: 15, history: [], qIdx: 0, ans: "", loading: false, done: false, error: "" });
  const [showDossier, setShowDossier] = useState(null);
  const [showTimeline, setShowTimeline] = useState(null);
  const [showMobile, setShowMobile] = useState(false);
  const [showVote, setShowVote] = useState(false);
  const [teamVotes, setTeamVotes] = useState({});
  const [verdict, setVerdict] = useState(null);
  const [isTV, setIsTV] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const player = players[curPlayer] || players[0] || {};
  const foundClues = clues.filter(c => c.found);
  const progress = clues.length > 0 ? Math.round((foundClues.length / clues.length) * 100) : 0;

  // Layout detection
  useEffect(() => {
    const check = () => {
      setIsTV(window.innerWidth >= 1400);
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Narrator
  const triggerNarrator = useCallback(async (ph) => {
    if (!settings?.narratorEnabled || !settings?.openaiKey) return;
    setNarrator(n => ({ ...n, loading: true }));
    const fc = foundClues.map(c => c.name).join(", ") || "nothing yet";
    const sys = "You are a hardboiled noir narrator. One atmospheric sentence, 15-25 words, present tense. No quotes. No em-dashes. Evocative and tense.";
    const txt = await callAI(`Case: ${caseData.title}. Phase: ${ph}. Clues found: ${fc}. One atmospheric line.`, sys, "narrator", settings);
    setNarrator({ text: isAIErr(txt) ? "The investigation continues…" : txt, loading: false });
  }, [settings, foundClues, caseData.title]);

  useEffect(() => {
    triggerNarrator(phase);
  }, [phase, triggerNarrator]);

  const discoverClue = useCallback((c) => {
    setClues(prev => prev.map(x => x.id === c?.id ? { ...x, found: true } : x));
  }, []);

  const getHint = useCallback(async () => {
    if (!diff.unlimitedHints && hintUsed) return;
    setHintLoading(true);
    const h = await callAI(
      `Detective found: ${foundClues.map(c => c.name).join(",") || "nothing"}. One cryptic noir hint ≤20 words toward the next critical clue.`,
      "You are the AI game master. Subtle, cryptic, noir-style hints only.", "hint", settings
    );
    setHint(isAIErr(h) ? "Look closer at what's already in front of you." : h);
    setHintUsed(true);
    setShowHint(true);
    setHintLoading(false);
  }, [diff, hintUsed, foundClues, settings]);

  const submitAccusation = useCallback(() => {
    if (!accusation) return;
    const s = caseData.suspects?.find(x => x.id === accusation);
    if (!s) return;

    const killer = caseData.suspects?.find(x => x.guilty);

    if (diff.permadeath && !s.guilty) {
      setVerdict({
        correct: false,
        permadeath: true,
        suspect: s,
        killer,
        reason: caseData.killerReason,
        foundClues,
        revSuspicion: revState.suspicion,
        players,
        teamVotes
      });
    } else {
      setVerdict({
        correct: s.guilty,
        suspect: s,
        killer,
        reason: caseData.killerReason,
        foundClues,
        revSuspicion: revState.suspicion,
        players,
        teamVotes
      });
    }
    setShowAccuse(false);
  }, [accusation, caseData, diff, revState.suspicion, foundClues, players, teamVotes]);

  const handleTimerExpire = useCallback(() => {
    const killer = caseData.suspects?.find(x => x.guilty);
    setVerdict({
      timerExpired: true,
      correct: false,
      suspect: null,
      killer,
      reason: caseData.killerReason,
      foundClues,
      revSuspicion: revState.suspicion,
      players,
      teamVotes
    });
  }, [caseData, foundClues, revState.suspicion, players, teamVotes]);

  if (verdict) {
    return <VerdictScreen verdict={verdict} caseData={caseData} player={player} onEnd={onEnd} isTutorial={isTutorial} />;
  }

  const sharedInterrogProps = {
    caseData,
    suspects: caseData.suspects || [],
    selSuspect,
    setSelSuspect,
    interrogHist,
    setInterrogHist,
    questionCounts,
    setQuestionCounts,
    dynamicAlibis,
    setDynamicAlibis,
    lieScores,
    setLieScores,
    crossState,
    setCrossState,
    witnessState,
    setWitnessState,
    player,
    settings,
    diff,
  };

  const sidebarProps = {
    caseData,
    foundClues,
    clues,
    progress,
    revSuspicion: revState.suspicion,
    hint,
    showHint,
    hintUsed,
    hintLoading,
    getHint,
    unlimitedHints: diff.unlimitedHints,
    aiHints: settings.aiHints,
    openaiKey: settings.openaiKey,
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: isMobile ? 80 : 0 }}>
      {/* TOP NAV */}
      <div className="top-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="display" style={{ fontSize: 24, color: T.paper }}>
            CASE<span style={{ color: T.teal }}>ZERO</span>
          </span>
          <span className="tag tag-gold" style={{ fontSize: 9 }}>{caseData.title}</span>
          {isTutorial && <span className="tag tag-green" style={{ fontSize: 9 }}>🎓 TUTORIAL</span>}
          <span className="mono" style={{ fontSize: 10, color: T.inkMut }}>{settings.openaiModel || "gpt-4o"}</span>
          {!settings.openaiKey && <span className="tag tag-red" style={{ fontSize: 9 }}>NO KEY</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {timerMinutes > 0 && <CaseTimer minutes={timerMinutes} onExpire={handleTimerExpire} paused={!!verdict} />}
          {players.length > 1 && players.map((p, i) => (
            <PlayerChip key={p.id} player={p} active={i === curPlayer} onClick={() => setCurPlayer(i)} />
          ))}
          {!isMobile && gameMode === "combined" && (
            <div style={{ display: "flex", gap: 4 }}>
              {[["detective","🔍"],["interrogation","💬"]].map(([id, icon]) => (
                <button key={id} className={`btn btn-sm ${phase === id ? "btn-teal" : "btn-ghost"}`}
                  onClick={() => setPhase(id)}>{icon}</button>
              ))}
            </div>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => setShowMobile(true)}>📱</button>
          <button className="btn btn-sm btn-purple" onClick={() => setShowReverse(true)}>🎯</button>
          {players.length > 1 && <button className="btn btn-sm btn-teal" onClick={() => setShowVote(true)}>🗳</button>}
          <button className="btn btn-sm btn-red" onClick={() => setShowAccuse(true)}>⚖ Accuse</button>
        </div>
      </div>

      {/* NARRATOR */}
      {settings.narratorEnabled && <NarratorBar text={narrator.text} loading={narrator.loading} />}

      {/* LAYOUTS */}
      {isTV ? (
        <TVLayout
          {...sharedInterrogProps} {...sidebarProps}
          phase={phase} setPhase={setPhase}
          clues={clues} activeRoom={activeRoom}
          setActiveRoom={setActiveRoom} discoverClue={discoverClue}
          notes={notes} setNotes={setNotes}
          subTab={subTab} setSubTab={setSubTab}
          gameMode={gameMode}
          setShowDossier={setShowDossier}
          setShowTimeline={setShowTimeline}
        />
      ) : (
        <StandardLayout
          {...sharedInterrogProps} {...sidebarProps}
          phase={phase} setPhase={setPhase}
          clues={clues} activeRoom={activeRoom}
          setActiveRoom={setActiveRoom} discoverClue={discoverClue}
          notes={notes} setNotes={setNotes}
          subTab={subTab} setSubTab={setSubTab}
          gameMode={gameMode} isMobile={isMobile}
          setShowDossier={setShowDossier}
          setShowTimeline={setShowTimeline}
        />
      )}

      {/* MOBILE BOTTOM NAV */}
      {isMobile && gameMode === "combined" && (
        <div className="bottom-nav">
          {[["detective","🔍","Explore"],["interrogation","💬","Interrogate"]].map(([id, icon, lbl]) => (
            <div key={id} className={`bnav-item ${phase === id ? "active" : ""}`} onClick={() => setPhase(id)}>
              <div className="bnav-icon">{icon}</div>
              <div className="bnav-label">{lbl}</div>
            </div>
          ))}
          <div className="bnav-item" onClick={() => setShowReverse(true)}>
            <div className="bnav-icon">🎯</div>
            <div className="bnav-label">Grill</div>
          </div>
          <div className="bnav-item" onClick={() => setShowAccuse(true)}>
            <div className="bnav-icon">⚖</div>
            <div className="bnav-label" style={{ color: T.red }}>Accuse</div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAccuse && <AccuseModal 
        suspects={caseData.suspects || []} 
        accusation={accusation} 
        setAccusation={setAccusation} 
        crossState={crossState} 
        onConfirm={submitAccusation} 
        onClose={() => setShowAccuse(false)} 
        player={player} 
      />}
      {showVote && <TeamVoteModal 
        players={players} 
        suspects={caseData.suspects || []} 
        teamVotes={teamVotes} 
        setTeamVotes={setTeamVotes} 
        onClose={() => setShowVote(false)} 
      />}
      {showReverse && <ReverseModal 
        caseData={caseData} 
        player={player} 
        state={revState} 
        setState={setRevState} 
        onClose={() => setShowReverse(false)} 
        diff={diff} 
        settings={settings} 
      />}
      {showDossier && <DossierModal 
        suspect={showDossier} 
        suspects={caseData.suspects || []} 
        dynamicAlibis={dynamicAlibis} 
        onClose={() => setShowDossier(null)} 
      />}
      {showTimeline && <TimelineModal 
        suspect={showTimeline} 
        suspects={caseData.suspects || []} 
        onClose={() => setShowTimeline(null)} 
      />}
      {showMobile && <MobileModal 
        foundClues={foundClues} 
        suspects={caseData.suspects || []} 
        caseData={caseData} 
        player={player} 
        onClose={() => setShowMobile(false)} 
      />}
    </div>
  );
}

// ── Shared Sidebar ───────────────────────────────────────────
function Sidebar({ caseData, foundClues, clues, progress, revSuspicion, hint, showHint, hintUsed, hintLoading, getHint, unlimitedHints, aiHints, openaiKey }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: 16 }}>
        <SectionLabel style={{ marginBottom: 8 }}>Case Brief</SectionLabel>
        <div style={{ fontSize: 13, color: T.inkSec, lineHeight: 1.65, marginBottom: 8 }}>{caseData.summary}</div>
        <div style={{ fontSize: 11, color: T.inkMut }}>Victim: <span style={{ color: T.gold }}>{caseData.victim}</span></div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionLabel>Evidence</SectionLabel>
          <span className="mono" style={{ fontSize: 10, color: T.teal }}>{foundClues.length}/{clues.length}</span>
        </div>
        <div className="bar-track" style={{ marginBottom: 12 }}>
          <div className="bar-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg,${T.teal},${T.gold})` }} />
        </div>
        {foundClues.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 8, paddingBottom: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.critical ? T.gold : T.teal, flexShrink: 0, marginTop: 4 }} />
              <div style={{ width: 1, flex: 1, background: T.smoke, marginTop: 3 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: T.inkSec, lineHeight: 1.5 }}>{c.desc}</div>
            </div>
          </div>
        ))}
        {foundClues.length === 0 && <p style={{ fontSize: 11, color: T.inkMut }}>No evidence found yet.</p>}
      </div>

      <div className="card card-purple" style={{ padding: 14 }}>
        <SectionLabel style={{ marginBottom: 7 }}>Your Suspicion</SectionLabel>
        <SuspicionMeter value={revSuspicion} />
      </div>

      {aiHints && (
        <div className="card" style={{ padding: 14 }}>
          <SectionLabel style={{ marginBottom: 8 }}>AI Game Master</SectionLabel>
          {showHint ? (
            <p className="noir" style={{ fontSize: 13, color: T.purple, lineHeight: 1.7 }}>"{hint}"</p>
          ) : (
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ width: "100%", justifyContent: "center" }}
              onClick={getHint} 
              disabled={(!unlimitedHints && hintUsed) || hintLoading || !openaiKey}
            >
              {hintLoading ? <><span className="spinner" /> Thinking…</> : (!unlimitedHints && hintUsed) ? "Hint used" : "💡 Request Hint"}
            </button>
          )}
          {unlimitedHints && <div style={{ fontSize: 10, color: T.green, marginTop: 6 }}>∞ unlimited (easy mode)</div>}
        </div>
      )}
    </div>
  );
}

// ── Interrogation Panel Wrapper ──────────────────────────────
function InterrogPanel({ subTab, setSubTab, setShowDossier, setShowTimeline, suspects = [], ...props }) {
  return (
    <div className="anim-in">
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["interrogate","💬","Interrogate","btn-gold"],["cross","⚔","Cross-Exam","btn-red"],["witnesses","👁","Witnesses","btn-teal"]].map(([id, icon, lbl, btn]) => (
          <button 
            key={id} 
            className={`btn btn-sm ${subTab === id ? btn : "btn-ghost"}`}
            onClick={() => setSubTab(id)}
          >
            {icon} {lbl}
          </button>
        ))}
        <button 
          className="btn btn-sm btn-ghost" 
          style={{ marginLeft: "auto" }}
          onClick={() => setShowDossier(props.selSuspect || suspects[0])}
        >
          📋
        </button>
        <button 
          className="btn btn-sm btn-ghost"
          onClick={() => setShowTimeline(props.selSuspect || suspects[0])}
        >
          ⏱
        </button>
      </div>

      {subTab === "interrogate" && <InterrogationTab suspects={suspects} {...props} />}
      {subTab === "cross" && <CrossExamTab suspects={suspects} {...props} />}
      {subTab === "witnesses" && (
        <WitnessTab 
          witnesses={props.caseData?.witnesses || []} 
          witnessState={props.witnessState} 
          setWitnessState={props.setWitnessState} 
          player={props.player} 
          settings={props.settings} 
        />
      )}
    </div>
  );
}

// ── Standard Layout ──────────────────────────────────────────
function StandardLayout({ phase, setPhase, clues, activeRoom, setActiveRoom, discoverClue, notes, setNotes, settings, subTab, setSubTab, gameMode, isMobile, setShowDossier, setShowTimeline, ...props }) {
  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: "0 auto", 
      padding: "18px 16px", 
      display: isMobile ? "flex" : "grid", 
      flexDirection: isMobile ? "column" : undefined, 
      gridTemplateColumns: isMobile ? undefined : "240px 1fr", 
      gap: 16 
    }}>
      {!isMobile && <Sidebar {...props} />}
      <div>
        {!settings?.openaiKey && <div style={{ marginBottom: 14 }}><APIWarn /></div>}
        {phase === "detective" && (
          <CorkboardPanel 
            caseData={props.caseData} 
            clues={clues} 
            activeRoom={activeRoom} 
            setActiveRoom={setActiveRoom} 
            discoverClue={discoverClue} 
            notes={notes} 
            setNotes={setNotes} 
            settings={settings} 
          />
        )}
        {phase === "interrogation" && (
          <InterrogPanel 
            subTab={subTab} 
            setSubTab={setSubTab} 
            setShowDossier={setShowDossier} 
            setShowTimeline={setShowTimeline} 
            settings={settings} 
            {...props} 
          />
        )}
      </div>
    </div>
  );
}

// ── TV Layout ────────────────────────────────────────────────
function TVLayout({ phase, setPhase, clues, activeRoom, setActiveRoom, discoverClue, notes, setNotes, settings, subTab, setSubTab, gameMode, setShowDossier, setShowTimeline, suspects = [], questionCounts = {}, dynamicAlibis = {}, lieScores = {}, crossState = {}, ...props }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 280px", gap: 20, padding: "20px 28px" }}>
      {/* LEFT - Sidebar */}
      <div style={{ overflowY: "auto" }}>
        <Sidebar {...props} clues={clues} />
      </div>

      {/* CENTER */}
      <div style={{ overflowY: "auto" }}>
        {gameMode === "combined" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["detective","🔍","Detect"],["interrogation","💬","Interrogate"]].map(([id, icon, lbl]) => (
              <button 
                key={id} 
                className={`btn ${phase === id ? "btn-teal" : "btn-ghost"}`} 
                style={{ fontSize: 14 }}
                onClick={() => setPhase(id)}
              >
                {icon} {lbl}
              </button>
            ))}
          </div>
        )}
        {!settings?.openaiKey && <div style={{ marginBottom: 14 }}><APIWarn /></div>}
        
        {phase === "detective" && (
          <CorkboardPanel 
            caseData={props.caseData} 
            clues={clues} 
            activeRoom={activeRoom} 
            setActiveRoom={setActiveRoom} 
            discoverClue={discoverClue} 
            notes={notes} 
            setNotes={setNotes} 
            settings={settings} 
          />
        )}
        {phase === "interrogation" && (
          <InterrogPanel 
            subTab={subTab} 
            setSubTab={setSubTab} 
            setShowDossier={setShowDossier} 
            setShowTimeline={setShowTimeline} 
            settings={settings} 
            suspects={suspects} 
            questionCounts={questionCounts} 
            dynamicAlibis={dynamicAlibis} 
            lieScores={lieScores} 
            crossState={crossState} 
            {...props} 
          />
        )}
      </div>

      {/* RIGHT — Suspect roster */}
      <div style={{ overflowY: "auto" }}>
        <SectionLabel style={{ marginBottom: 12 }}>Suspects</SectionLabel>
        {suspects.map(s => {
          const cs = crossState[s.id] || {};
          const qc = questionCounts[s.id] || 0;
          return (
            <div 
              key={s.id} 
              className={`portrait-card ${props.selSuspect?.id === s.id ? "selected" : ""} ${cs.cracked ? "cracked" : ""}`}
              style={{ marginBottom: 12, cursor: "pointer" }}
              onClick={() => {
                props.setSelSuspect(s);
                if (phase !== "interrogation") setPhase("interrogation");
              }}
            >
              <div className="portrait-avatar" style={{ height: 72, fontSize: 36 }}>{s.avatar || "👤"}</div>
              <div className="portrait-body" style={{ padding: "12px 14px" }}>
                <div className="portrait-name" style={{ fontSize: 18 }}>{s.name}</div>
                <div className="portrait-role" style={{ marginBottom: 8 }}>{s.role}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {qc > 0 && <MoodBadge count={qc} guilty={s.guilty} />}
                  {cs.cracked && <span className="tag tag-red" style={{ fontSize: 9 }}>CRACKED</span>}
                  {dynamicAlibis[s.id] && <span className="tag tag-gold" style={{ fontSize: 9 }}>⚡ ALIBI</span>}
                  {lieScores[s.id] != null && <span className="tag tag-muted" style={{ fontSize: 9 }}>{lieScores[s.id]}% lie</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
