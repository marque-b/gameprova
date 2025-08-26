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
        ? "bg-ocean-100 border-ocean-500 text-ocean-800 shadow-lg transform scale-105"
        : "bg-white border-ocean-200 hover:bg-ocean-50 hover:border-ocean-300 hover:shadow-md";
    }

    // Revealed state - show correct/incorrect
    const isCorrect = choiceId === correctAnswer;
    const wasSelected = selected === choiceId;

    if (isCorrect) {
      return "bg-green-100 border-green-500 text-green-800 shadow-lg";
    } else if (wasSelected && !isCorrect) {
      return "bg-red-100 border-red-500 text-red-800 shadow-lg";
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
    <div className="question-scroll nautical-card">
      {/* Question Header */}
      <div className="bg-gradient-to-r from-nautical-rope/20 to-nautical-wood/20 p-3 md:p-6 border-b border-nautical-rope/30">
        <div className="flex items-start">
          <img
            src="/ropes.png"
            alt="Ropes"
            className="w-4 h-4 md:w-6 md:h-6 mr-2 md:mr-3 mt-1"
          />
          <div className="flex-1">
            <h3 className="text-sm md:text-xl font-maritime font-bold text-ocean-800 mb-1 md:mb-2">
              {question.prompt}
            </h3>
          </div>
          <img
            src="/compass.png"
            alt="Compass"
            className="w-4 h-4 md:w-6 md:h-6 ml-2 md:ml-3 mt-1"
          />
        </div>
      </div>

      {/* Reveal State */}
      {/* <div
        className={`transition-all duration-500 ${
          isRevealed
            ? "bg-gradient-to-r from-nautical-gold/20 to-yellow-400/20 border-l-4 border-nautical-gold p-4 text-ocean-800"
            : "h-0 overflow-hidden"
        }`}
        aria-live="polite"
      >
        {isRevealed && (
          <div className="flex items-center">
            <img
              src="/star.png"
              alt="Star"
              className="w-6 h-6 mr-3 treasure-glow"
            />
            <div>
              <div className="font-maritime font-bold text-lg">
                Resposta revelada!
              </div>
              <div className="font-maritime">
                {selected === correctAnswer
                  ? "Parabéns! Você acertou!"
                  : `Resposta correta: ${correctAnswer}`}
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* Choices */}
      <div className="p-3 md:p-6">
        <div className="grid gap-2 md:gap-3">
          {question.choices.map((c) => (
            <button
              key={c.id}
              className={`border-2 px-2 md:px-4 py-2 md:py-3 rounded-lg text-left flex items-center justify-between 
                         transition-all duration-300 font-maritime
                         ${getChoiceStyle(c.id)}`}
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
              <span className="flex items-center">
                <span className="bg-ocean-100 text-ocean-800 rounded-full w-5 h-5 md:w-8 md:h-8 flex items-center justify-center font-bold mr-2 md:mr-3 text-xs md:text-base">
                  {c.id}
                </span>
                <span className="text-sm md:text-lg">{c.text}</span>
              </span>
              {getChoiceIcon(c.id) && (
                <span className="text-lg md:text-2xl ml-2 md:ml-3">
                  {getChoiceIcon(c.id)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Decorative Footer */}
      <div className="border-t border-nautical-rope/30 p-2 md:p-4 bg-gradient-to-r from-ocean-50 to-nautical-sail/50">
        <div className="flex items-center justify-center space-x-3 md:space-x-6 text-ocean-600">
          <div className="flex items-center">
            <img
              src="/anchor.png"
              alt="Anchor"
              className="w-3 h-3 md:w-4 md:h-4 mr-1"
            />
            <span className="text-xs font-maritime">Coragem</span>
          </div>
          <div className="flex items-center">
            <img
              src="/compass.png"
              alt="Compass"
              className="w-3 h-3 md:w-4 md:h-4 mr-1"
            />
            <span className="text-xs font-maritime">Sabedoria</span>
          </div>
          <div className="flex items-center">
            <img
              src="/star.png"
              alt="Star"
              className="w-3 h-3 md:w-4 md:h-4 mr-1 treasure-glow"
            />
            <span className="text-xs font-maritime">Glória</span>
          </div>
        </div>
      </div>
    </div>
  );
}
