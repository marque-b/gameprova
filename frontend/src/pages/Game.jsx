import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore.js";
import QuestionCard from "../components/QuestionCard.jsx";
import Ranking from "../components/Ranking.jsx";
import Timer from "../components/Timer.jsx";

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === "true";

function debugLog(msg, extra) {
  if (DEBUG_LOGS) {
    const ts = new Date().toISOString();
    console.log(`[DEBUG] [${ts}] [GAME] ${msg}`, extra ?? "");
  }
}

export default function Game() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { question, answer, leaderboard, rules, session, revealState } =
    useGameStore((s) => ({
      question: s.question,
      answer: s.answer,
      leaderboard: s.leaderboard,
      rules: s.rules,
      session: s.session,
      revealState: s.revealState,
    }));

  const [selected, setSelected] = useState(null);
  const [timerRunning, setTimerRunning] = useState(true);

  debugLog(`Game render:`, {
    sessionId,
    questionId: question?.id,
    selected,
    revealState,
    rules: rules,
    sessionStatus: session?.status,
  });

  // Check if session is finished and redirect to results
  useEffect(() => {
    debugLog(
      `Session status changed: ${session?.status}, currentIndex: ${session?.currentIndex}`
    );
    if (session?.status === "finished") {
      debugLog(`Session finished, redirecting to results`);
      navigate(`/results/${sessionId}`);
    }
  }, [session?.status, sessionId, navigate]);

  // Reset seleção quando nova pergunta chega
  useEffect(() => {
    debugLog(`Question changed, resetting selection: ${question?.id}`);
    setSelected(null);
    setTimerRunning(true);
  }, [question?.id]);

  // Handle reveal state changes
  useEffect(() => {
    if (revealState && revealState === question?.id) {
      debugLog(`Question revealed, pausing timer`);
      setTimerRunning(false);
    } else if (revealState !== question?.id) {
      // If reveal state doesn't match current question, timer should be running
      debugLog(`Question not revealed, starting timer`);
      setTimerRunning(true);
    }
  }, [revealState, question?.id]);

  const perQuestionTime = useMemo(() => {
    const time = rules?.perQuestionTimeSec ?? null;
    debugLog(`Calculated perQuestionTime: ${time}`);
    return time;
  }, [rules]);

  // Get correct answer for current question
  const correctAnswer = useMemo(() => {
    if (!question) return null;
    // This would need to be provided by the backend or stored in the question object
    // For now, we'll assume it's available in the question data
    return question.answer || null;
  }, [question]);

  // Determine if ranking should be shown
  const shouldShowRanking = useMemo(() => {
    // Always show ranking, but scores will only update after reveal
    return true;
  }, []);

  function onAnswer(choiceId) {
    if (!question) {
      debugLog(`Answer attempt failed: no question available`);
      return;
    }
    if (selected) {
      debugLog(`Answer attempt failed: already selected ${selected}`);
      return; // lock
    }
    if (revealState === question.id) {
      debugLog(`Answer attempt failed: question is revealed`);
      return;
    }

    debugLog(`Submitting answer: question=${question.id}, choice=${choiceId}`);
    setSelected(choiceId);
    answer(question.id, choiceId);
  }

  function onTimerElapsed() {
    debugLog(`Timer elapsed for question: ${question?.id}`);
    setSelected("timeout");
    setTimerRunning(false);
  }

  return (
    <div className="min-h-screen p-2 md:p-6 grid lg:grid-cols-4 gap-3 md:gap-8 max-w-7xl mx-auto">
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="nautical-card mb-3 md:mb-6">
          <div className="bg-gradient-to-r from-ocean-600 to-ocean-800 p-3 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-20">
              <img src="/ship.png" alt="Ship" className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h1 className="text-xl md:text-3xl font-nautical text-white flex items-center">
                <img
                  src="/compass.png"
                  alt="Compass"
                  className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-3"
                />
                Sessão {sessionId}
              </h1>
              <p className="text-ocean-100 font-maritime text-sm md:text-lg mt-1 md:mt-2">
                Navegando pelos mares do conhecimento...
              </p>
            </div>
          </div>
        </div>

        {question ? (
          <div className="space-y-3 md:space-y-6">
            {/* Progress Bar and Timer */}
            <div className="grid grid-cols-1 grid-cols-2 gap-3 md:gap-6 items-start">
              {/* Progress Bar */}
              {typeof rules?.totalQuestions === "number" && (
                <div className="nautical-card">
                  <div className="p-2 md:p-4 space-y-2 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-ocean-800 font-maritime font-semibold flex items-center text-xs md:text-base">
                        <img
                          src="/anchor.png"
                          alt="Anchor"
                          className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                        />
                        Perguntas
                      </span>
                      <span className="text-ocean-700 font-maritime text-sm md:text-2xl">
                        {Math.min(
                          (session?.currentIndex ?? 0) + 1,
                          rules.totalQuestions
                        )}
                        /{rules.totalQuestions}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-ocean-200 rounded-full h-2 md:h-4 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-nautical-gold to-yellow-400 h-2 md:h-4 rounded-full transition-all duration-500 shadow-lg"
                          style={{
                            width: `${
                              (Math.min(
                                (session?.currentIndex ?? 0) + 1,
                                rules.totalQuestions
                              ) /
                                rules.totalQuestions) *
                              100
                            }%`,
                          }}
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
                </div>
              )}

              {/* Timer */}
              {perQuestionTime ? (
                <div className="nautical-card">
                  <div className="p-2 md:p-4">
                    <Timer
                      seconds={perQuestionTime}
                      onElapsed={onTimerElapsed}
                      running={timerRunning}
                      questionId={question.id}
                    />
                  </div>
                </div>
              ) : (
                DEBUG_LOGS && (
                  <div className="text-xs md:text-sm text-ocean-500 font-maritime">
                    Timer disabled - perQuestionTimeSec not set
                  </div>
                )
              )}
            </div>

            {/* Question Card */}
            <QuestionCard
              question={question}
              onAnswer={onAnswer}
              selected={selected}
              revealState={revealState}
              correctAnswer={correctAnswer}
            />

            {DEBUG_LOGS && (
              <div className="text-xs text-ocean-400 bg-ocean-50 p-2 md:p-3 rounded-lg border border-ocean-200">
                <div className="font-semibold mb-1 md:mb-2">🧭 Debug Info:</div>
                <div>Question ID: {question.id}</div>
                <div>Selected: {selected}</div>
                <div>Reveal State: {revealState}</div>
                <div>Timer Running: {timerRunning ? "Yes" : "No"}</div>
                <div>Per Question Time: {perQuestionTime || "Not set"}</div>
                <div>Session Status: {session?.status}</div>
                <div>Show Ranking: {shouldShowRanking ? "Yes" : "No"}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="nautical-card">
            <div className="p-4 md:p-8 text-center">
              <img
                src="/compass.png"
                alt="Compass"
                className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 compass-rose"
              />
              <p className="text-ocean-700 font-maritime text-sm md:text-xl">
                Nenhuma pergunta no momento.
              </p>
            </div>
          </div>
        )}
      </div>
      <aside className="lg:col-span-1">
        <Ranking leaderboard={leaderboard} />
      </aside>
    </div>
  );
}
