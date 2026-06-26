import React, { useState, useEffect, useCallback } from 'react';
import { GLOBAL_CSS, DIFFICULTY } from './tokens';
import { LogPanel } from './components/UI';
import { SplashScreen, LandingScreen } from './components/Splash';
import { SettingsScreen } from './components/Settings';
import { LobbyScreen } from './components/Lobby';
import { GameScreen } from './components/GameScreen';

const TUTORIAL_CASE = {
  id: "tutorial",
  title: "The Missing Trophy",
  setting: "Millbrook High School — After Hours",
  summary: "The school's championship trophy vanished overnight. Three people had access. Your guided first case.",
  victim: "Championship Trophy — priceless sentimental value",
  cause: "Taken out of spite after losing team captain position",
  killer: "Coach Harris",
  killerReason: "Coach Harris was passed over for the head coaching role and took the trophy in a fit of rage, blaming the star player for his demotion.",
  narratorIntro: "Some mysteries don't need a body. Sometimes all it takes is an empty pedestal and a school full of people with something to hide.",
  theme: "teal",
  isTutorial: true,
  suspects: [
    {
      id: "coach", name: "Coach Harris", role: "Head Coach", age: 52, avatar: "🧑‍🏫", guilty: true,
      alibi: "Claims he was home all evening",
      secret: "His keycard was swiped at 11pm — 5 hours after he claims he left",
      dossier: { background: "25yr veteran. Passed over for head coach promotion.", associates: "School board, rival coaches", record: "None", financials: "Salary cut last year." },
      timeline: [{ t: "5:00pm", a: "Practice ended" }, { t: "6:00pm", a: "Left school — claimed" }, { t: "11:00pm", a: "Keycard swipe at gym — unexplained" }],
    },
    {
      id: "captain", name: "Jamie Chen", role: "Team Captain", age: 17, avatar: "🧑‍🎓", guilty: false,
      alibi: "Was at team dinner until midnight — 8 witnesses",
      secret: "Had a public argument with Coach Harris about playing time",
      dossier: { background: "Star player. Public argument with coach last week.", associates: "Team members", record: "None", financials: "N/A" },
      timeline: [{ t: "4:00pm", a: "Practice" }, { t: "6:00pm", a: "Team dinner — 8 witnesses" }, { t: "12:00am", a: "Still at dinner" }],
    },
    {
      id: "janitor", name: "Mr. Reeves", role: "Night Janitor", age: 60, avatar: "🧹", guilty: false,
      alibi: "Cleaning east wing all night — sign-in log confirmed",
      secret: "Personal grudge with the previous janitor who got fired",
      dossier: { background: "6yr employee. Clean record.", associates: "School staff", record: "None", financials: "Standard salary." },
      timeline: [{ t: "8:00pm", a: "Started shift — east wing" }, { t: "11:00pm", a: "Break room" }, { t: "1:00am", a: "Finished shift" }],
    },
  ],
  clues: [
    { id: "c1", name: "Muddy Boot Print", desc: "Size 13 boot print near the trophy case. Only Coach Harris wears size 13 on staff.", critical: true, room: "Gym Storage", found: false },
    { id: "c2", name: "Keycard Log", desc: "Coach Harris' keycard swiped at 11:04pm — 5 hours after he claims he left.", critical: true, room: "Security Office", found: false },
    { id: "c3", name: "Coach's Pen", desc: "A red pen with Harris's initials found near the display case.", critical: false, room: "Gym Storage", found: false },
    { id: "c4", name: "Team Dinner Receipt", desc: "Jamie's credit card receipt — 6:15pm to 12:05am. Airtight alibi.", critical: false, room: "Cafeteria", found: false },
    { id: "c5", name: "Cleaning Log", desc: "Mr. Reeves signed into east wing at 8:02pm — never near the gym.", critical: false, room: "Janitor Closet", found: false },
  ],
  rooms: ["Gym Storage", "Security Office", "Cafeteria", "Janitor Closet"],
  witnesses: [
    {
      id: "w1", name: "Student Sara", role: "Late-night student", avatar: "🧑‍🎓",
      summary: "Stayed late printing a project. Saw someone in the hallway.",
      statements: [
        { trigger: "general", text: "I was printing my project around 11pm. I saw someone in a blue track jacket walking fast toward the gym. Minutes later I heard what sounded like a display case being opened." },
        { trigger: "coach", text: "The track jacket was the school's coach edition. Only staff coaches get those. I'd recognize it anywhere — my dad wore the same one when he coached here." },
      ],
    },
  ],
  interrogationQuestions: {
    coach: [{ q: "Your keycard shows you entered at 11pm. Explain that." }, { q: "Do you own a pair of size 13 boots?" }],
    captain: [{ q: "Can anyone confirm you were at dinner all night?" }, { q: "Tell me about your argument with Coach Harris." }],
  },
  reverseInterrogation: {
    alibi: "I was off-duty and called in by the school principal.",
    secret: "You used to play for this school's rival team.",
    questions: [
      "You played for this school's rival team. Doesn't that bias your investigation?",
      "You arrived 30 minutes before you were called. How is that possible?",
    ],
  },
  crossExam: {
    coach: { contradiction: "Coach Harris claims he left at 6pm but keycard shows entry at 11:04pm.", pressure: "the keycard timestamp", threshold: 1 },
  },
};

// ── Logger ───────────────────────────────────────────────────
class Logger {
  constructor() { this.logs = []; this.listeners = []; }
  _emit(lv, cat, msg, data = {}) {
    const e = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      ts: new Date().toISOString(), level: lv, cat, msg,
      data: JSON.stringify(data),
    };
    this.logs.push(e);
    if (this.logs.length > 400) this.logs.shift();
    this.listeners.forEach(fn => fn(e));
    const s = { DEBUG: "color:#4A4F62", INFO: "color:#1ECFB0", WARN: "color:#C8A951", ERROR: "color:#E8341A;font-weight:bold" };
    console.log(`%c[CZ2][${lv}][${cat}] ${msg}`, s[lv] || "", data);
  }
  debug(c, m, d) { this._emit("DEBUG", c, m, d); }
  info(c, m, d)  { this._emit("INFO",  c, m, d); }
  warn(c, m, d)  { this._emit("WARN",  c, m, d); }
  error(c, m, d) { this._emit("ERROR", c, m, d); }
  onLog(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l !== fn); }; }
  getLogs() { return [...this.logs]; }
  export() { return JSON.stringify(this.logs, null, 2); }
  clear() { this.logs = []; this.listeners.forEach(fn => fn({ type: "clear" })); }
}
const logger = new Logger();

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState("home");
  const [gameState, setGameState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    openaiKey: process.env.REACT_APP_OPENAI_KEY || "",
    openaiModel: process.env.REACT_APP_OPENAI_MODEL || "gpt-4o",
    elevenLabsKey: process.env.REACT_APP_ELEVENLABS_KEY || "",
    elevenLabsVoiceId: process.env.REACT_APP_ELEVENLABS_VOICE || "",
    aiHints: true,
    lieDetector: true,
    narratorEnabled: true,
    voiceEnabled: false,
    showDevLog: true,
  });

  useEffect(() => {
    logger.info("APP", "CaseZero V2 initialized", { model: settings.openaiModel });
    return logger.onLog(e => {
      if (e.type === "clear") { setLogs([]); return; }
      setLogs(prev => [...prev.slice(-199), e]);
    });
  }, []);

  const handleEnd = useCallback((dest) => {
    logger.info("APP", `Navigate → ${dest}`);
    setGameState(null);
    setScreen(dest || "home");
  }, []);

  const startGame = (gs) => {
    logger.info("APP", "Game start", { case: gs.caseData.id, diff: gs.difficulty });
    setGameState(gs);
    setScreen("game");
  };

  const startTutorial = () => {
    logger.info("APP", "Tutorial start");
    setGameState({
      players: [{ id: 1, name: "Trainee Detective", color: "#1ECFB0" }],
      caseData: TUTORIAL_CASE,
      gameMode: "combined",
      difficulty: "easy",
      timerMinutes: 0,
    });
    setScreen("tutorial");
  };

  const exportLogs = () => {
    const b = new Blob([logger.export()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `casezero-v2-${Date.now()}.json`;
    a.click();
  };

  if (showSplash) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <SplashScreen onDone={() => setShowSplash(false)} />
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {screen !== "game" && screen !== "tutorial" && (
        <div className="top-nav">
          <span className="display" style={{ fontSize: 22, color: "#F0EDE6", cursor: "pointer" }}
            onClick={() => setScreen("home")}>
            CASE<span style={{ color: "#1ECFB0" }}>ZERO</span>
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!settings.openaiKey && screen !== "settings" && (
              <span style={{ fontSize: 11, color: "#C8A951" }}>⚠ No API key</span>
            )}
            <span className="mono" style={{ fontSize: 10, color: "#4A4F62" }}>V2.0</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setScreen("settings")}>⚙</button>
          </div>
        </div>
      )}

      {screen === "home" && (
        <LandingScreen
          onStart={s => s === "tutorial" ? startTutorial() : setScreen(s)}
          hasKey={!!settings.openaiKey}
        />
      )}
      {screen === "settings" && (
        <SettingsScreen settings={settings} onChange={setSettings} onBack={() => setScreen("home")} />
      )}
      {screen === "lobby" && (
        <LobbyScreen settings={settings} onStart={startGame} onBack={() => setScreen("home")} />
      )}
      {screen === "game" && gameState && (
        <GameScreen gameState={gameState} settings={settings} onEnd={handleEnd} />
      )}
      {screen === "tutorial" && gameState && (
        <GameScreen gameState={gameState} settings={settings} onEnd={handleEnd} isTutorial={true} />
      )}

      {settings.showDevLog && (
        <LogPanel logs={logs} onClear={() => logger.clear()} onExport={exportLogs} />
      )}
    </>
  );
}
