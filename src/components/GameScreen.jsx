import React, { useState, useEffect, useCallback } from 'react';
import { T, DIFFICULTY } from '../tokens';
import { SuspicionMeter, NarratorBar, CaseTimer, PlayerChip, APIWarn, SectionLabel, MoodBadge } from './UI';
import { CorkboardPanel } from './Corkboard';
import { InterrogationTab, CrossExamTab, WitnessTab } from './Interrogation';
import { DossierModal, TimelineModal, AccuseModal, TeamVoteModal, ReverseModal, MobileModal } from './Modals';
import { VerdictScreen } from './Verdict';
import { callAI, isAIErr } from '../hooks/useAI';

export function GameScreen({ gameState, settings, onEnd, isTutorial = false }) {
  const { players = [], caseData = {}, gameMode = "detective", difficulty = "medium", timerMinutes = 0 } = gameState || {};
  const diff = DIFFICULTY[difficulty] || DIFFICULTY.medium;

  const [phase, setPhase] = useState(gameMode === "interrogation" ? "interrogation" : "detective");
  const [curPlayer, setCurPlayer] = useState(0);
  const [clues, setClues] = useState(() => caseData.clues?.map(x => ({ ...x })) || []);
  const [notes, setNotes] = useState({});
  const [activeRoom, setActiveRoom] = useState(caseData.rooms?.[0] || null);
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
  const [narrator, setNarrator] = useState({ text: caseData.narratorIntro || "The game begins...", loading: false });
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

  const player = players[curPlayer] || players[0] || { name: "Player" };
  const foundClues = clues.filter(c => c?.found);
  const progress = clues.length > 0 ? Math.round((foundClues.length / clues.length) * 100) : 0;

  useEffect(() => {
    const check = () => {
      setIsTV(window.innerWidth >= 1400);
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const triggerNarrator = useCallback(async (ph) => {
    if (!settings?.narratorEnabled || !settings?.openaiKey) return;
    setNarrator(n => ({ ...n, loading: true }));
    try {
      const fc = foundClues.map(c => c.name).join(", ") || "nothing yet";
      const txt = await callAI(`Case: ${caseData.title || 'Unknown'}. Phase: ${ph}. Clues found: ${fc}. One atmospheric line.`, 
        "You are a hardboiled noir narrator. One atmospheric sentence, 15-25 words, present tense.", "narrator", settings);
      setNarrator({ text: isAIErr(txt) ? "The investigation continues…" : txt, loading: false });
    } catch (e) {
      setNarrator({ text: "The investigation continues…", loading: false });
    }
  }, [settings, foundClues, caseData.title]);

  useEffect(() => {
    triggerNarrator(phase);
  }, [phase, triggerNarrator]);

  const discoverClue = useCallback((c) => {
    if (!c?.id) return;
    setClues(prev => prev.map(x => x.id === c.id ? { ...x, found: true } : x));
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
      setVerdict({ correct: false, permadeath: true, suspect: s, killer, reason: caseData.killerReason, foundClues, revSuspicion: revState.suspicion, players, teamVotes });
    } else {
      setVerdict({ correct: s.guilty, suspect: s, killer, reason: caseData.killerReason, foundClues, revSuspicion: revState.suspicion, players, teamVotes });
    }
    setShowAccuse(false);
  }, [accusation, caseData, diff, revState.suspicion, foundClues, players, teamVotes]);

  const handleTimerExpire = useCallback(() => {
    const killer = caseData.suspects?.find(x => x.guilty);
    setVerdict({ timerExpired: true, correct: false, suspect: null, killer, reason: caseData.killerReason, foundClues, revSuspicion: revState.suspicion, players, teamVotes });
  }, [caseData, foundClues, revState.suspicion, players, teamVotes]);

  if (verdict) return <VerdictScreen verdict={verdict} caseData={caseData} player={player} onEnd={onEnd} isTutorial={isTutorial} />;

  const sharedInterrogProps = {
    caseData, suspects: caseData.suspects || [], selSuspect, setSelSuspect,
    interrogHist, setInterrogHist, questionCounts, setQuestionCounts,
    dynamicAlibis, setDynamicAlibis, lieScores, setLieScores,
    crossState, setCrossState, witnessState, setWitnessState,
    player, settings, diff,
  };

  const sidebarProps = {
    caseData, foundClues, clues, progress, revSuspicion: revState.suspicion,
    hint, showHint, hintUsed, hintLoading, getHint,
    unlimitedHints: diff.unlimitedHints, aiHints: settings.aiHints,
    openaiKey: settings.openaiKey,
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: isMobile ? 80 : 0 }}>
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
                <button key={id} className={`btn btn-sm ${phase === id ? "btn-teal" : "btn-ghost"}`} onClick={() => setPhase(id)}>{icon}</button>
              ))}
            </div>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => setShowMobile(true)}>📱</button>
          <button className="btn btn-sm btn-purple" onClick={() => setShowReverse(true)}>🎯</button>
          {players.length > 1 && <button className="btn btn-sm btn-teal" onClick={() => setShowVote(true)}>🗳</button>}
          <button className="btn btn-sm btn-red" onClick={() => setShowAccuse(true)}>⚖ Accuse</button>
        </div>
      </div>

      {settings.narratorEnabled && <NarratorBar text={narrator.text} loading={narrator.loading} />}

      {isTV ? (
        <TVLayout {...sharedInterrogProps} {...sidebarProps} phase={phase} setPhase={setPhase} clues={clues} activeRoom={activeRoom} setActiveRoom={setActiveRoom} discoverClue={discoverClue} notes={notes} setNotes={setNotes} subTab={subTab} setSubTab={setSubTab} gameMode={gameMode} setShowDossier={setShowDossier} setShowTimeline={setShowTimeline} />
      ) : (
        <StandardLayout {...sharedInterrogProps} {...sidebarProps} phase={phase} setPhase={setPhase} clues={clues} activeRoom={activeRoom} setActiveRoom={setActiveRoom} discoverClue={discoverClue} notes={notes} setNotes={setNotes} subTab={subTab} setSubTab={setSubTab} gameMode={gameMode} isMobile={isMobile} setShowDossier={setShowDossier} setShowTimeline={setShowTimeline} />
      )}

      {isMobile && gameMode === "combined" && (
        <div className="bottom-nav">
          {[["detective","🔍","Explore"],["interrogation","💬","Interrogate"]].map(([id, icon, lbl]) => (
            <div key={id} className={`bnav-item ${phase === id ? "active" : ""}`} onClick={() => setPhase(id)}>
              <div className="bnav-icon">{icon}</div>
              <div className="bnav-label">{lbl}</div>
            </div>
          ))}
          <div className="bnav-item" onClick={() => setShowReverse(true)}>
            <div className="bnav-icon">🎯</div><div className="bnav-label">Grill</div>
          </div>
          <div className="bnav-item" onClick={() => setShowAccuse(true)}>
            <div className="bnav-icon">⚖</div><div className="bnav-label" style={{ color: T.red }}>Accuse</div>
          </div>
        </div>
      )}

      {showAccuse && <AccuseModal suspects={caseData.suspects || []} accusation={accusation} setAccusation={setAccusation} crossState={crossState} onConfirm={submitAccusation} onClose={() => setShowAccuse(false)} player={player} />}
      {showVote && <TeamVoteModal players={players} suspects={caseData.suspects || []} teamVotes={teamVotes} setTeamVotes={setTeamVotes} onClose={() => setShowVote(false)} />}
      {showReverse && <ReverseModal caseData={caseData} player={player} state={revState} setState={setRevState} onClose={() => setShowReverse(false)} diff={diff} settings={settings} />}
      {showDossier && <DossierModal suspect={showDossier} suspects={caseData.suspects || []} dynamicAlibis={dynamicAlibis} onClose={() => setShowDossier(null)} />}
      {showTimeline && <TimelineModal suspect={showTimeline} suspects={caseData.suspects || []} onClose={() => setShowTimeline(null)} />}
      {showMobile && <MobileModal foundClues={foundClues} suspects={caseData.suspects || []} caseData={caseData} player={player} onClose={() => setShowMobile(false)} />}
    </div>
  );
}

// Keep your original Sidebar, InterrogPanel, StandardLayout, and TVLayout functions below this line unchanged.
