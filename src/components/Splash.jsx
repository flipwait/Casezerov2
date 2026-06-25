import React, { useState, useEffect } from 'react';
import { T, GLOBAL_CSS } from '../tokens';

// ── Splash Screen ────────────────────────────────────────────
export function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  // 0=black, 1=logo builds, 2=tagline, 3=enter button
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="splash" style={{ gap: 0 }}>
      {/* Rain particles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 100}%`,
            width: 1,
            height: `${40 + Math.random() * 60}px`,
            background: `linear-gradient(180deg, transparent, ${T.teal}22)`,
            animation: `fadeIn ${1 + Math.random() * 2}s ease ${Math.random() * 3}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* Logo */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "none" : "translateY(30px)",
        transition: "all 1s cubic-bezier(0.16,1,0.3,1)",
        marginBottom: 8,
      }}>
        <div className="splash-logo">
          <span style={{ color: T.paper }}>CASE</span>
          <span style={{ color: T.teal }}>ZERO</span>
        </div>
      </div>

      {/* Thin gold line */}
      <div style={{
        width: phase >= 2 ? 200 : 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
        transition: "width 0.8s ease",
        marginBottom: 20,
      }} />

      {/* Tagline */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "none" : "translateY(10px)",
        transition: "all 0.8s ease",
        marginBottom: 48,
      }}>
        <p className="noir" style={{ fontSize: "clamp(14px,2vw,18px)", color: T.inkSec, letterSpacing: "0.12em" }}>
          Someone in this room is lying.
        </p>
      </div>

      {/* Enter button */}
      <div style={{
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? "none" : "translateY(16px)",
        transition: "all 0.6s ease",
      }}>
        <button
          className="btn btn-paper btn-xl"
          onClick={onDone}
          style={{ letterSpacing: "0.2em", fontSize: 15 }}
        >
          ENTER
        </button>
      </div>

      {/* Version */}
      <div style={{
        position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center",
        opacity: phase >= 3 ? 0.4 : 0, transition: "opacity 0.6s ease 0.3s",
      }}>
        <span className="mono" style={{ fontSize: 10, color: T.inkMut, letterSpacing: "0.2em" }}>
          V2.0 · 2026 EDITION · POWERED BY OPENAI
        </span>
      </div>
    </div>
  );
}

// ── Landing Screen ───────────────────────────────────────────
export function LandingScreen({ onStart, hasKey }) {
  const features = [
    ["🔍", "Detective Mode", "Explore crime scenes"],
    ["💬", "AI Interrogation", "Suspects respond to anything"],
    ["🧬", "Mood System", "Suspects shift emotionally"],
    ["🔄", "Dynamic Alibis", "Stories change under pressure"],
    ["👁", "Witness System", "Call in what they saw"],
    ["⚔", "Cross-Examine", "Break their contradictions"],
    ["⏱", "Case Timer", "Race the clock"],
    ["🔬", "Forensics Lab", "Deep-analyze evidence"],
    ["🎙", "AI Narrator", "Cinematic atmosphere"],
    ["🎯", "Reverse Grill", "You become the suspect"],
    ["📱", "Mobile Companion", "Play on any screen"],
    ["🎓", "Tutorial Mode", "Learn as you play"],
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 24px 40px", textAlign: "center",
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${T.teal}08, transparent)`,
      }}>
        {!hasKey && (
          <div style={{ marginBottom: 20, maxWidth: 500, width: "100%" }}>
            <div className="api-warn anim-up">
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div style={{ fontSize: 12, color: T.inkSec }}>
                Add your <strong style={{ color: T.teal }}>OpenAI API key</strong> in Settings before playing.
              </div>
            </div>
          </div>
        )}

        <div className="anim-up" style={{ marginBottom: 8 }}>
          <span className="tag tag-teal" style={{ marginBottom: 16, display: "inline-flex" }}>V2.0 · 2026 EDITION</span>
        </div>

        <h1 className="display anim-up" style={{
          fontSize: "clamp(64px,10vw,120px)", color: T.paper, marginBottom: 8, animationDelay: "0.05s"
        }}>
          CASE<span style={{ color: T.teal }}>ZERO</span>
        </h1>

        <p className="noir anim-up" style={{
          fontSize: "clamp(15px,2vw,20px)", color: T.inkSec,
          marginBottom: 40, letterSpacing: "0.06em", animationDelay: "0.1s"
        }}>
          Multiplayer AI detective mystery
        </p>

        <div className="anim-up" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 56, animationDelay: "0.15s" }}>
          <button className="btn btn-teal btn-lg" style={{ fontSize: 15, letterSpacing: "0.12em" }} onClick={() => onStart("lobby")}>
            ▶ START GAME
          </button>
          <button className="btn btn-gold btn-lg" style={{ fontSize: 15 }} onClick={() => onStart("tutorial")}>
            🎓 TUTORIAL
          </button>
          <button className="btn btn-ghost btn-lg" style={{ fontSize: 14 }} onClick={() => onStart("settings")}>
            ⚙ SETTINGS
          </button>
        </div>

        {/* Feature grid */}
        <div className="anim-up" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
          gap: 10, maxWidth: 760, width: "100%", animationDelay: "0.2s"
        }}>
          {features.map(([icon, title, desc]) => (
            <div key={title} style={{
              background: T.void, border: `1px solid ${T.smoke}`,
              borderRadius: 6, padding: "14px 14px 12px", textAlign: "left",
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.teal + "44"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.smoke}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 10, color: T.inkMut, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 24px", borderTop: `1px solid ${T.smoke}` }}>
        <span className="mono" style={{ fontSize: 10, color: T.inkMut, letterSpacing: "0.15em" }}>
          CASEZERO V2 · OPENAI POWERED · FAMILY GAME NIGHT EDITION
        </span>
      </div>
    </div>
  );
}
