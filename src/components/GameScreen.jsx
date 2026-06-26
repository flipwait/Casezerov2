import React, { useState, useEffect, useCallback } from 'react';
import { T, DIFFICULTY, MOODS } from '../tokens';
import { SuspicionMeter, NarratorBar, CaseTimer, PlayerChip, APIWarn, SectionLabel, MoodBadge } from './UI';
import { CorkboardPanel } from './Corkboard';
import { InterrogationTab, CrossExamTab, WitnessTab } from './Interrogation';
import { DossierModal, TimelineModal, AccuseModal, TeamVoteModal, ReverseModal, MobileModal } from './Modals';
import { VerdictScreen } from './Verdict';
import { callAI, isAIErr } from '../hooks/useAI';

export function GameScreen({ gameState, settings, onEnd, isTutorial = false }) {
  const { players, caseData, gameMode, difficulty, timerMinutes } = gameState;
  const diff = DIFFICULTY[difficulty] || DIFFICULTY.medium;

  const [phase, setPhase] = useState(gameMode === "interrogation" ? "interrogation" : "detective");
  const [curPlayer, setCurPlayer] = useState(0);
  const [clues, setClues] = useState(() => {
    let c = caseData.clues.map(x => ({ ...x }));
    if (diff.freeClues > 0) {
      let g = 0;
      c = c.map(x => {
        if (!x.found && x.critical && g < diff.freeClues) { g++; return { ...x, found: true }; }
        return x;
      });
    }
    return c;
  });
  const [notes, setNotes] = useState({});
  const [activeRoom, setActiveRoom] = useState(caseData.rooms[0]);
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

  const player = players[curPlayer];
  const foundClues = clues.filter(c => c.found);
  const progress = Math.round((foundClues.length / clues.length) * 100);

  useEffect(() => {
    const check = () => {
      setIsTV(window.innerWidth >= 1400);
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!settings.narratorEnabled || !settings.openaiKey) return;
    triggerNarrator(phase);
  }, [phase]);

  const triggerNarrator = async (ph) => {
    if (!settings.narratorEnabled || !settings.openaiKey) return;
    setNarrator(n => ({ ...n, loading: true }));
    const fc = foundClues.map(c => c.name).join(", ") || "nothing yet";
    const sys = "You are a hardboiled noir narrator. One atmospheric sentence, 15-25 words, present tense. No quotes. No em-dashes. Evocative and tense.";
    const txt = await callAI(`Case:
