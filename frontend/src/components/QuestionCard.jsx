import React from "react";

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === "true";

function debugLog(msg, extra) {
  if (DEBUG_LOGS) {
    const ts = new Date().toISOString();
    console.log(`[DEBUG] [${ts}] [QUESTION_CARD] ${msg}`, extra ?? "");
  }
}

export default function QuestionCard({
  question,
  onAnswer,
  selected,
  revealState,
  correctAnswer,
}) {
  debugLog(`QuestionCard render:`, {
    questionId: question?.id,
    selected,
    revealState,
    correctAnswer,
    isRevealed: revealState === question?.id,
  });

  const isRevealed = revealState === question?.id;
  const hasAnswered = selected !== null;

  const getChoiceStyle = (choiceId) => {
    if (!isRevealed) {
      // Normal state - not revealed
      return selected === choiceId
        ? "bg-blue-50 border-blue-400"
        : "hover:bg-gray-50";
    }

    // Revealed state - show correct/incorrect
    const isCorrect = choiceId === correctAnswer;
    const wasSelected = selected === choiceId;

    if (isCorrect) {
      return "bg-green-100 border-green-500 text-green-800";
    } else if (wasSelected && !isCorrect) {
      return "bg-red-100 border-red-500 text-red-800";
    } else {
      return "bg-gray-50 border-gray-300 text-gray-500";
    }
  };

  const getChoiceIcon = (choiceId) => {
    if (!isRevealed) return null;

    const isCorrect = choiceId === correctAnswer;
    const wasSelected = selected === choiceId;

    if (isCorrect) {
      return "✓";
    } else if (wasSelected && !isCorrect) {
      return "✗";
    }
    return null;
  };

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="text-lg font-semibold">{question.prompt}</div>

      <div
        className={`transition-all h-16 ${
          isRevealed
            ? "bg-blue-50 border border-blue-200 rounded p-3 text-blue-800"
            : "invisible" // keep height, hide visually
        }`}
        aria-live="polite"
      >
        {isRevealed && (
          <>
            <div className="font-medium">Resposta revelada!</div>
            <div className="text-sm">
              {selected === correctAnswer
                ? "Parabéns! Você acertou!"
                : `Resposta correta: ${correctAnswer}`}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-2">
        {question.choices.map((c) => (
          <button
            key={c.id}
            className={`border px-3 py-2 rounded text-left flex items-center justify-between ${getChoiceStyle(
              c.id
            )}`}
            onClick={() => {
              debugLog(
                `Choice clicked: ${c.id}, selected: ${selected}, revealed: ${isRevealed}`
              );
              if (!hasAnswered && !isRevealed) {
                onAnswer(c.id);
              }
            }}
            disabled={hasAnswered || isRevealed}
          >
            <span>
              <span className="font-mono mr-2">{c.id}.</span> {c.text}
            </span>
            {getChoiceIcon(c.id) && (
              <span className="font-bold text-lg">{getChoiceIcon(c.id)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
