// ============================================================
// CASEZERO V2 — Design Tokens & Global CSS
// Cinematic Noir Broadcast — TV-first
// ============================================================

export const T = {
  abyss:"#080A0E", void:"#0D0F14", shadow:"#12151C", dusk:"#1A1E28", smoke:"#232838",
  gold:"#C8A951", goldDim:"#8A6F2E", goldBright:"#E8C96A",
  red:"#E8341A", redDim:"#7A1C0D",
  teal:"#1ECFB0", tealDim:"#0D7A69",
  purple:"#7B5EA7", purpleDim:"#3D2E54",
  paper:"#F0EDE6", paperDim:"#B8B2A4",
  ink:"#F0EDE6", inkSec:"#8B8FA8", inkMut:"#4A4F62",
  green:"#2ECC71", amber:"#F39C12", orange:"#E67E22",
};

export const PLAYER_COLORS = [
  "#1ECFB0","#C8A951","#E8341A","#2ECC71",
  "#7B5EA7","#E67E22","#3498DB","#E91E63",
];

export const OPENAI_MODELS = [
  {id:"gpt-4o",       label:"GPT-4o",        desc:"Fast, smart — recommended", tier:"standard"},
  {id:"gpt-4o-mini",  label:"GPT-4o Mini",   desc:"Fastest & cheapest",        tier:"fast"},
  {id:"gpt-4-turbo",  label:"GPT-4 Turbo",   desc:"Longer context",            tier:"standard"},
  {id:"o1-mini",      label:"o1 Mini",        desc:"Strong reasoning",          tier:"advanced"},
  {id:"o1",           label:"o1",             desc:"Max intelligence",          tier:"advanced"},
];

export const DIFFICULTY = {
  easy:{
    id:"easy", label:"Rookie Detective", icon:"🟢",
    desc:"2 critical clues free. Unlimited hints. Suspects crack fast. 30 min timer.",
    freeClues:2, unlimitedHints:true, crackMult:0.6, timer:30, reverseQ:2, permadeath:false,
  },
  medium:{
    id:"medium", label:"Detective", icon:"🟡",
    desc:"Standard. 1 hint per round. Balanced difficulty. 20 min timer.",
    freeClues:0, unlimitedHints:false, crackMult:1.0, timer:20, reverseQ:3, permadeath:false,
  },
  hard:{
    id:"hard", label:"Chief Inspector", icon:"🔴",
    desc:"No hints. Hard cracking. Wrong accusation = game over. 15 min timer.",
    freeClues:0, unlimitedHints:false, crackMult:1.8, timer:15, reverseQ:4, permadeath:true,
  },
};

export const MOODS = {
  cooperative:{label:"Cooperative", icon:"😌", color:"#1ECFB0", desc:"Open, gives extra detail"},
  nervous:     {label:"Nervous",     icon:"😰", color:"#C8A951", desc:"Anxious, prone to slips"},
  defensive:   {label:"Defensive",  icon:"😤", color:"#E67E22", desc:"Guarded, short answers"},
  hostile:     {label:"Hostile",    icon:"😠", color:"#E8341A", desc:"Refuses to elaborate"},
};

export const getMood = (count, guilty) => {
  if (count === 0) return guilty ? "nervous" : "cooperative";
  if (count <= 2)  return guilty ? "defensive" : "nervous";
  if (count <= 4)  return guilty ? "hostile" : "defensive";
  return guilty ? "hostile" : "cooperative";
};

export const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#080A0E;color:#F0EDE6;font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden;}

/* Film grain */
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0.035;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:128px 128px;}
/* Scanlines */
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:0.012;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.1) 3px,rgba(255,255,255,0.1) 4px);}

::-webkit-scrollbar{width:3px;height:3px;}
::-webkit-scrollbar-track{background:#0D0F14;}
::-webkit-scrollbar-thumb{background:#232838;border-radius:2px;}
::-webkit-scrollbar-thumb:hover{background:#C8A951;}

/* ANIMATIONS */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeLeft{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes pinDrop{0%{opacity:0;transform:translateY(-28px) scale(0.85) rotate(-2deg)}
  65%{transform:translateY(3px) scale(1.04) rotate(0.5deg)}100%{opacity:1;transform:none}}
@keyframes filmBurn{0%{opacity:0;filter:brightness(4) sepia(1)}
  40%{filter:brightness(1.8) sepia(0.4)}100%{opacity:1;filter:none}}
@keyframes beat{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes narratorIn{0%{opacity:0;letter-spacing:0.4em}100%{opacity:1;letter-spacing:0.06em}}
@keyframes pulseRed{0%,100%{box-shadow:0 0 0 0 #E8341A22}50%{box-shadow:0 0 28px 6px #E8341A44}}
@keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 #C8A95120}50%{box-shadow:0 0 20px 4px #C8A95133}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 24px currentColor,0 0 48px currentColor}}
@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:none}}
@keyframes typewriter{from{width:0}to{width:100%}}
@keyframes crackFlash{0%,100%{background:#080A0E}10%,30%,50%{background:#1a0505}20%,40%{background:#080A0E}}

.anim-up{animation:fadeUp 0.5s ease both;}
.anim-in{animation:fadeIn 0.35s ease both;}
.anim-left{animation:fadeLeft 0.4s ease both;}
.anim-pin{animation:pinDrop 0.55s cubic-bezier(0.34,1.56,0.64,1) both;}
.anim-burn{animation:filmBurn 0.9s ease both;}

/* TYPOGRAPHY */
.display{font-family:'Bebas Neue',sans-serif;letter-spacing:0.04em;line-height:0.92;}
.mono{font-family:'JetBrains Mono',monospace;}
.noir{font-family:'Playfair Display',serif;font-style:italic;}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;
  border-radius:4px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;
  transition:all 0.15s;border:1px solid transparent;letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;}
.btn:disabled{opacity:0.28;cursor:not-allowed;pointer-events:none;}
.btn-gold{background:#C8A95118;border-color:#C8A95155;color:#C8A951;}
.btn-gold:hover{background:#C8A95128;border-color:#C8A951;box-shadow:0 0 20px #C8A95130;}
.btn-red{background:#E8341A18;border-color:#E8341A55;color:#E8341A;}
.btn-red:hover{background:#E8341A28;border-color:#E8341A;box-shadow:0 0 20px #E8341A30;}
.btn-teal{background:#1ECFB018;border-color:#1ECFB055;color:#1ECFB0;}
.btn-teal:hover{background:#1ECFB028;border-color:#1ECFB0;box-shadow:0 0 20px #1ECFB030;}
.btn-purple{background:#7B5EA718;border-color:#7B5EA755;color:#7B5EA7;}
.btn-purple:hover{background:#7B5EA728;border-color:#7B5EA7;}
.btn-green{background:#2ECC7118;border-color:#2ECC7155;color:#2ECC71;}
.btn-green:hover{background:#2ECC7128;border-color:#2ECC71;}
.btn-ghost{background:transparent;border-color:#232838;color:#8B8FA8;}
.btn-ghost:hover{border-color:#8B8FA8;color:#F0EDE6;}
.btn-paper{background:#F0EDE6;border-color:#F0EDE6;color:#080A0E;font-weight:700;}
.btn-paper:hover{background:#D8D4CC;}
.btn-sm{padding:6px 13px;font-size:11px;}
.btn-lg{padding:14px 36px;font-size:14px;}
.btn-xl{padding:18px 48px;font-size:16px;}

/* CARDS */
.card{background:#0D0F14;border:1px solid #232838;border-radius:6px;transition:border-color 0.2s;}
.card-gold{border-color:#C8A95140;background:#0D0F14;}
.card-red{border-color:#E8341A40;}
.card-teal{border-color:#1ECFB040;}
.card-purple{border-color:#7B5EA740;}

/* TAGS */
.tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:2px;
  font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
.tag-gold{background:#C8A95114;color:#C8A951;border:1px solid #C8A95128;}
.tag-red{background:#E8341A14;color:#E8341A;border:1px solid #E8341A28;}
.tag-teal{background:#1ECFB014;color:#1ECFB0;border:1px solid #1ECFB028;}
.tag-purple{background:#7B5EA714;color:#7B5EA7;border:1px solid #7B5EA728;}
.tag-green{background:#2ECC7114;color:#2ECC71;border:1px solid #2ECC7128;}
.tag-muted{background:#23283815;color:#4A4F62;border:1px solid #23283830;}

/* INPUTS */
.input{background:#12151C;border:1px solid #232838;border-radius:4px;padding:10px 14px;
  color:#F0EDE6;font-family:'Inter',sans-serif;font-size:14px;width:100%;outline:none;
  transition:border-color 0.15s;}
.input:focus{border-color:#1ECFB0;box-shadow:0 0 0 3px #1ECFB012;}
.input::placeholder{color:#4A4F62;}
select.input{cursor:pointer;}
textarea.input{resize:vertical;min-height:80px;line-height:1.65;}

/* UTILITY */
.spinner{width:14px;height:14px;border:2px solid #232838;border-top-color:#1ECFB0;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;flex-shrink:0;}
.label{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#4A4F62;}
.divider{height:1px;background:#232838;width:100%;}
.bar-track{height:3px;background:#232838;border-radius:2px;overflow:hidden;}
.bar-fill{height:100%;border-radius:2px;transition:width 0.5s ease;}
.susp-track{height:6px;background:#232838;border-radius:3px;overflow:hidden;}
.susp-fill{height:100%;border-radius:3px;transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1);}

/* OVERLAYS & MODALS */
.overlay{position:fixed;inset:0;background:#080A0Edd;backdrop-filter:blur(12px);z-index:200;
  display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:#0D0F14;border:1px solid #232838;border-radius:8px;padding:28px;
  max-width:680px;width:100%;max-height:90vh;overflow-y:auto;animation:fadeUp 0.25s ease;}
.modal-wide{max-width:960px;}

/* NAV */
.top-nav{position:sticky;top:0;z-index:100;background:#080A0EF2;backdrop-filter:blur(24px);
  border-bottom:1px solid #232838;padding:0 24px;display:flex;align-items:center;
  justify-content:space-between;gap:12px;height:56px;}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:100;background:#080A0EF8;
  backdrop-filter:blur(20px);border-top:1px solid #232838;display:flex;
  align-items:center;justify-content:space-around;height:64px;padding:0 8px;}
.bnav-item{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;
  padding:8px 14px;border-radius:6px;transition:all 0.15s;min-width:54px;}
.bnav-item.active{background:#1ECFB010;}
.bnav-icon{font-size:20px;line-height:1;}
.bnav-label{font-size:9px;letter-spacing:0.1em;font-family:'JetBrains Mono',monospace;
  text-transform:uppercase;color:#4A4F62;transition:color 0.15s;}
.bnav-item.active .bnav-label{color:#1ECFB0;}
.player-chip{display:flex;align-items:center;gap:7px;padding:5px 12px;background:#12151C;
  border:1px solid #232838;border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.15s;}

/* TOGGLE */
.toggle{width:40px;height:22px;border-radius:11px;cursor:pointer;position:relative;transition:all 0.2s;flex-shrink:0;}
.toggle-knob{width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:3px;transition:left 0.2s;}

/* NARRATOR */
.narrator-bar{border-top:1px solid #7B5EA720;border-bottom:1px solid #7B5EA720;padding:10px 24px;
  text-align:center;font-family:'Playfair Display',serif;font-style:italic;font-size:14px;
  color:#7B5EA7;letter-spacing:0.06em;line-height:1.7;
  background:linear-gradient(90deg,transparent,#7B5EA706,transparent);animation:narratorIn 1.2s ease;}

/* TIMER */
.timer-wrap{display:flex;align-items:center;gap:10px;padding:6px 14px;border-radius:6px;transition:all 0.5s;}
.timer-display{font-family:'Bebas Neue',sans-serif;letter-spacing:0.08em;font-size:26px;line-height:1;}
.timer-ok{color:#1ECFB0;}.timer-warn{color:#F39C12;}.timer-crit{color:#E8341A;animation:beat 0.8s ease infinite;}

/* CORKBOARD */
.corkboard{border-radius:4px;position:relative;overflow:hidden;
  background:#3D2010;
  box-shadow:inset 0 2px 16px rgba(0,0,0,0.7),0 4px 32px rgba(0,0,0,0.8);
  border:4px solid #2A1508;}
.corkboard-inner{padding:20px;display:grid;gap:14px;}
.cork-pin{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:2px;
  background:radial-gradient(circle at 35% 30%,#F08080,#B03030);
  box-shadow:0 1px 4px rgba(0,0,0,0.6);}
.cork-note{background:#F8F3E0;border-radius:2px;padding:14px;position:relative;
  box-shadow:2px 3px 10px rgba(0,0,0,0.55),0 1px 3px rgba(0,0,0,0.3);
  transition:all 0.2s;cursor:pointer;border-top:2px solid transparent;}
.cork-note:hover{transform:translateY(-2px);box-shadow:3px 6px 16px rgba(0,0,0,0.65);}
.cork-note.critical{border-top-color:#C8A951;}
.cork-note.found .cork-note-title{color:#1A1208;}
.cork-note.unknown{background:#EDE8D5;opacity:0.65;}
.cork-note-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
  color:#2A2010;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em;}
.cork-note-body{font-size:11px;color:#3A3020;line-height:1.55;}
.cork-stamp{position:absolute;top:8px;right:8px;font-size:8px;font-weight:700;
  letter-spacing:0.15em;text-transform:uppercase;color:#C84030;
  border:1.5px solid #C84030;padding:1px 5px;border-radius:1px;opacity:0.75;font-family:'JetBrains Mono',monospace;}
.forensics-panel{background:#EDF5F3;border-left:3px solid #1ECFB0;border-radius:2px;
  padding:10px 12px;margin-top:10px;}
.forensics-panel *{color:#0D2520;font-size:11px;line-height:1.55;}
.forensics-panel .f-header{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;
  letter-spacing:0.15em;text-transform:uppercase;color:#0D7A69;margin-bottom:5px;}

/* PORTRAIT CARDS */
.portrait-card{background:#0D0F14;border:1px solid #232838;border-radius:6px;cursor:pointer;
  transition:all 0.2s;overflow:hidden;}
.portrait-card:hover{border-color:#C8A95166;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.5);}
.portrait-card.selected{border-color:#C8A951;box-shadow:0 0 0 1px #C8A951,0 8px 28px #C8A95128;}
.portrait-card.cracked{border-color:#E8341A;animation:glowPulse 2s ease infinite;color:#E8341A;}
.portrait-avatar{font-size:36px;line-height:1;display:flex;align-items:center;justify-content:center;
  height:70px;background:linear-gradient(180deg,#1A1E28,#12151C);}
.portrait-body{padding:12px;}
.portrait-name{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:0.04em;line-height:1;margin-bottom:3px;}
.portrait-role{font-size:10px;color:#8B8FA8;letter-spacing:0.06em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}

/* CHAT BUBBLES */
.bubble{padding:12px 15px;border-radius:6px;font-size:13px;line-height:1.65;animation:fadeIn 0.3s ease;max-width:86%;}
.bubble-user{background:#1ECFB012;border:1px solid #1ECFB028;margin-left:auto;}
.bubble-ai{background:#12151C;border:1px solid #232838;}
.bubble-error{background:#E8341A10;border:1px solid #E8341A33;color:#E8341A;font-size:12px;}
.bubble-witness{background:#1ECFB006;border:1px solid #1ECFB018;}
.bubble-reverse{background:#7B5EA710;border:1px solid #7B5EA728;margin-right:auto;}
.bubble-system{background:#C8A95108;border:1px solid #C8A95120;color:#8B8FA8;
  font-size:12px;text-align:center;max-width:100%;align-self:center;}
.bubble-pressure{background:#E8341A10;border:1px solid #E8341A28;}

/* ACCUSATION */
.accuse-card{border:2px solid transparent;border-radius:6px;padding:14px;cursor:pointer;
  background:#12151C;transition:all 0.2s;}
.accuse-card:hover{border-color:#E8341A55;}
.accuse-card.selected{border-color:#E8341A;background:#E8341A0C;box-shadow:0 0 20px #E8341A1A;}

/* CROSS-EXAM */
.tactic-card{border:2px solid transparent;border-radius:6px;padding:12px;cursor:pointer;
  background:#12151C;transition:all 0.2s;}
.tactic-card:hover{border-color:#E8341A44;}
.tactic-card.selected{border-color:#E8341A;background:#E8341A0C;}

/* WITNESS */
.witness-card-item{border:2px solid transparent;border-radius:6px;padding:12px;cursor:pointer;
  background:#12151C;transition:all 0.2s;}
.witness-card-item:hover{border-color:#1ECFB055;}
.witness-card-item.selected{border-color:#1ECFB0;background:#1ECFB00A;}

/* DIFF */
.diff-card{border:2px solid transparent;border-radius:6px;padding:16px;cursor:pointer;
  background:#12151C;transition:all 0.2s;}
.diff-card:hover{border-color:#C8A95144;}
.diff-card.selected{border-color:#C8A951;background:#C8A9510A;}

/* MODEL ROW */
.model-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:6px;cursor:pointer;border:1px solid #232838;background:#12151C;transition:all 0.15s;}
.model-row:hover{border-color:#1ECFB033;}
.model-row.active{border-color:#1ECFB0;background:#1ECFB008;}

/* API WARNING */
.api-warn{background:#E8341A0E;border:1px solid #E8341A38;border-radius:6px;
  padding:12px 16px;display:flex;align-items:flex-start;gap:10px;}

/* PULSE EFFECTS */
.pulse-red{animation:pulseRed 1.6s ease infinite;}
.pulse-gold{animation:pulseGold 1.6s ease infinite;}

/* TV MODE overrides */
@media(min-width:1400px){
  .tv-text-scale{font-size:1.15em;}
  .portrait-name{font-size:22px;}
  .timer-display{font-size:34px;}
  .narrator-bar{font-size:17px;padding:14px 40px;}
  .bubble{font-size:14px;}
  .btn{font-size:13px;padding:11px 22px;}
}

/* MOBILE overrides */
@media(max-width:768px){
  .top-nav{padding:0 14px;height:52px;}
  .hide-mobile{display:none!important;}
  .modal{padding:20px;}
  .bubble{font-size:12px;padding:10px 12px;}
}

/* LOG PANEL */
.log-panel{position:fixed;bottom:0;right:0;width:360px;max-height:240px;z-index:400;
  background:#080A0EF8;border:1px solid #232838;border-radius:8px 0 0 0;font-family:'JetBrains Mono',monospace;font-size:11px;}
.log-header{padding:7px 12px;background:#12151C;border-bottom:1px solid #232838;
  display:flex;justify-content:space-between;align-items:center;cursor:pointer;}
.log-scroll{overflow-y:auto;max-height:190px;padding:5px;}
.log-entry{padding:2px 6px;border-radius:2px;margin-bottom:2px;line-height:1.4;}
.log-DEBUG{color:#4A4F62;}.log-INFO{color:#1ECFB0;}.log-WARN{color:#C8A951;}
.log-ERROR{color:#E8341A;background:#E8341A0E;}

/* SPLASH SCREEN */
.splash{position:fixed;inset:0;background:#080A0E;z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
.splash-logo{font-family:'Bebas Neue',sans-serif;font-size:clamp(72px,12vw,140px);letter-spacing:0.06em;line-height:0.9;}
.splash-tagline{font-family:'Playfair Display',serif;font-style:italic;font-size:clamp(14px,2vw,20px);color:#8B8FA8;letter-spacing:0.1em;margin-top:16px;}

/* MOMENT OVERLAY */
.moment{position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;pointer-events:none;}
`;
