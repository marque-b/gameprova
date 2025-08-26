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
    <div className="space-y-2 md:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src="/lifebuoy.png"
            alt="Lifebuoy"
            className="w-3 h-3 md:w-5 md:h-5 mr-1 md:mr-2"
          />
          <span className="text-ocean-800 font-maritime font-semibold text-xs md:text-base">
            Tempo
          </span>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <img
            src="/compass.png"
            alt="Compass"
            className="w-3 h-3 md:w-4 md:h-4"
          />
          <span
            className={`text-sm md:text-2xl font-bold font-maritime ${
              remaining <= 5
                ? "text-red-600 animate-pulse"
                : remaining <= 10
                ? "text-yellow-600"
                : "text-ocean-700"
            }`}
          >
            {remaining}s
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-2 md:h-4 bg-ocean-200 rounded-full shadow-inner">
          <div
            className={`h-2 md:h-4 rounded-full transition-all duration-1000 shadow-lg ${
              remaining <= 5
                ? "bg-gradient-to-r from-red-500 to-red-600 animate-pulse"
                : remaining <= 10
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-ocean-500 to-ocean-600"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1">
          <img
            src="/star.png"
            alt="Star"
            className="w-2 h-2 md:w-3 md:h-3 treasure-glow"
          />
        </div>
        <div className="absolute -top-0.5 md:-top-1 -left-0.5 md:-left-1">
          <img
            src="/anchor.png"
            alt="Anchor"
            className="w-2 h-2 md:w-3 md:h-3"
          />
        </div>
      </div>
    </div>
  );
}
