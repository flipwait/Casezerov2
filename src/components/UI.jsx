import React from "react";

export function LogPanel({ logs = [], onClear }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      right: 0,
      width: 320,
      height: 220,
      background: "#080A0E",
      color: "#F0EDE6",
      borderTopLeftRadius: 8,
      border: "1px solid #2a2f45",
      fontSize: 12,
      overflow: "auto",
      zIndex: 9999
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 8,
        borderBottom: "1px solid #2a2f45"
      }}>
        <strong>Dev Log</strong>
        <button onClick={onClear}>Clear</button>
      </div>

      <div style={{ padding: 8 }}>
        {logs.length === 0 && <div style={{ opacity: 0.6 }}>No logs</div>}

        {logs.map((l, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            [{l.level}] {l.cat}: {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
