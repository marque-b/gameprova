import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore.js";

export default function Results() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { leaderboard, session } = useGameStore((s) => ({
    leaderboard: s.leaderboard,
    session: s.session,
  }));

  // Redirect to home if no session data
  useEffect(() => {
    if (!session && leaderboard.length === 0) {
      navigate("/");
    }
  }, [session, leaderboard, navigate]);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
  const winner = sortedLeaderboard[0];
  const totalPlayers = sortedLeaderboard.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Resultados – Sessão {sessionId}
        </h1>
        <p className="text-gray-600">
          {session?.rules?.totalQuestions
            ? `Quiz com ${session.rules.totalQuestions} perguntas`
            : "Quiz concluído"}
        </p>
      </div>

      {/* Winner Section */}
      {winner && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-6 rounded-lg mb-8 text-center">
          <div className="text-2xl font-bold mb-2">🏆 Vencedor</div>
          <div className="text-xl">{winner.nickname}</div>
          <div className="text-lg">{winner.score} pontos</div>
          {winner.streak > 0 && (
            <div className="text-sm opacity-90">
              Sequência: {winner.streak} respostas corretas
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Classificação Final</h2>
          <p className="text-sm text-gray-600">
            {totalPlayers} participante{totalPlayers !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedLeaderboard.map((player, index) => (
            <div
              key={player.id}
              className={`px-6 py-4 flex items-center justify-between ${
                index === 0
                  ? "bg-yellow-50"
                  : index === 1
                  ? "bg-gray-50"
                  : index === 2
                  ? "bg-orange-50"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? "bg-yellow-500 text-white"
                      : index === 1
                      ? "bg-gray-500 text-white"
                      : index === 2
                      ? "bg-orange-500 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{player.nickname}</div>
                  {player.streak > 0 && (
                    <div className="text-sm text-gray-500">
                      Sequência: {player.streak}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{player.score} pts</div>
                {player.correctAnswers && (
                  <div className="text-sm text-gray-500">
                    {player.correctAnswers} acertos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Statistics */}
      {session && (
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Configurações do Jogo
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Pontos por acerto:</span>
                <span className="font-medium">
                  {session.rules?.pointsCorrect || 100}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pontos por erro:</span>
                <span className="font-medium">
                  {session.rules?.pointsWrong || 0}
                </span>
              </div>
              {session.rules?.perQuestionTimeSec && (
                <div className="flex justify-between">
                  <span>Tempo por pergunta:</span>
                  <span className="font-medium">
                    {session.rules.perQuestionTimeSec}s
                  </span>
                </div>
              )}
              {session.rules?.speedBonus?.enabled && (
                <div className="flex justify-between">
                  <span>Bônus de velocidade:</span>
                  <span className="font-medium">
                    Até {session.rules.speedBonus.maxBonus} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total de perguntas:</span>
                <span className="font-medium">
                  {session.rules?.totalQuestions || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Participantes:</span>
                <span className="font-medium">{totalPlayers}</span>
              </div>
              {winner && (
                <div className="flex justify-between">
                  <span>Pontuação máxima:</span>
                  <span className="font-medium">{winner.score} pts</span>
                </div>
              )}
              {sortedLeaderboard.length > 1 && (
                <div className="flex justify-between">
                  <span>Pontuação mínima:</span>
                  <span className="font-medium">
                    {sortedLeaderboard[sortedLeaderboard.length - 1].score} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {/* <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar ao Início
        </button>
        <button
          onClick={() => navigate(`/join/${sessionId}`)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Jogar Novamente
        </button>
      </div> */}
    </div>
  );
}
