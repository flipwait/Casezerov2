// src/tokens.js

export const GLOBAL_CSS = `
body {
  margin: 0;
  font-family: system-ui, Arial, sans-serif;
  background: #0E0F14;
  color: #F0EDE6;
}

button {
  cursor: pointer;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #1a1d2a;
  background: #0E0F14;
}

.btn {
  background: #1ECFB0;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  color: #0E0F14;
  font-weight: 600;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #2a2f45;
  color: #F0EDE6;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.mono {
  font-family: monospace;
}
`;

export const DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard"
};
