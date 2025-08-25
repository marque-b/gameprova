import React, { useEffect, useState } from "react";

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === "true";

function debugLog(msg, extra) {
  if (DEBUG_LOGS) {
    const ts = new Date().toISOString();
    console.log(`[DEBUG] [${ts}] [TIMER] ${msg}`, extra ?? "");
  }
}

export default function Timer({
  seconds,
  onElapsed,
  running = true,
  questionId,
}) {
  const [remaining, setRemaining] = useState(seconds);

  debugLog(
    `Timer initialized: seconds=${seconds}, running=${running}, questionId=${questionId}`
  );

  // Reset timer when question changes or seconds change
  useEffect(() => {
    debugLog(`Timer reset: seconds=${seconds}, questionId=${questionId}`);
    setRemaining(seconds);
  }, [seconds, questionId]);

  useEffect(() => {
    debugLog(
      `Timer running state changed: ${running}, remaining: ${remaining}, questionId: ${questionId}`
    );

    if (!running) {
      debugLog(`Timer paused for question: ${questionId}`);
      return;
    }

    if (remaining <= 0) {
      debugLog(`Timer elapsed for question: ${questionId}, calling onElapsed`);
      onElapsed?.();
      return;
    }

    debugLog(
      `Setting timer for ${remaining} seconds on question: ${questionId}`
    );
    const id = setTimeout(() => {
      debugLog(
        `Timer tick: ${remaining} -> ${
          remaining - 1
        } on question: ${questionId}`
      );
      setRemaining((r) => r - 1);
    }, 1000);

    return () => {
      debugLog(`Clearing timer: ${id} for question: ${questionId}`);
      clearTimeout(id);
    };
  }, [remaining, running, onElapsed, questionId]);

  const pct = Math.max(0, Math.min(100, (remaining / seconds) * 100));
  debugLog(
    `Timer render: remaining=${remaining}, percentage=${pct.toFixed(
      1
    )}%, questionId=${questionId}`
  );

  return (
    <div className="space-y-1">
      <div className="text-sm">Tempo: {remaining}s</div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div
          className={`h-2 rounded transition-all duration-1000 ${
            remaining <= 5
              ? "bg-red-600"
              : remaining <= 10
              ? "bg-yellow-600"
              : "bg-blue-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
