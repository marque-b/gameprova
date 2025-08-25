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
    <div className="p-6 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <div className="md:col-span-2">
        <h1 className="text-xl font-bold mb-4">Sessão {sessionId}</h1>
        {question ? (
          <div className="space-y-4">
            {perQuestionTime ? (
              <Timer
                seconds={perQuestionTime}
                onElapsed={onTimerElapsed}
                running={timerRunning}
                questionId={question.id}
              />
            ) : (
              <div className="text-sm text-gray-500">
                {DEBUG_LOGS && "Timer disabled - perQuestionTimeSec not set"}
              </div>
            )}
            <QuestionCard
              question={question}
              onAnswer={onAnswer}
              selected={selected}
              revealState={revealState}
              correctAnswer={correctAnswer}
            />
            {typeof rules?.totalQuestions === "number" && (
              <div className="text-sm text-gray-600">
                Perguntas:{" "}
                {Math.min(
                  (session?.currentIndex ?? 0) + 1,
                  rules.totalQuestions
                )}
                /{rules.totalQuestions}
              </div>
            )}
            {DEBUG_LOGS && (
              <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
                <div>Debug Info:</div>
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
          <div>Nenhuma pergunta no momento.</div>
        )}
      </div>
      <aside>
        <Ranking leaderboard={leaderboard} />
      </aside>
    </div>
  );
}
