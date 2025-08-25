import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore.js";

export default function Lobby() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { players, session, question, disconnect } = useGameStore((s) => ({
    players: s.players,
    session: s.session,
    question: s.question,
    disconnect: s.disconnect,
  }));

  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (question) {
      navigate(`/game/${sessionId}`);
    }
  }, [question, navigate, sessionId]);

  const handleLeaveLobby = () => {
    if (isLeaving) return;

    setIsLeaving(true);

    // Disconnect from session
    disconnect();

    // Navigate back to home
    navigate("/");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Lobby – Sessão {sessionId}
              </h1>
              <p className="text-blue-100 mt-1">
                {session?.bank?.meta?.name || "Banco de questões"}
              </p>
            </div>
            <button
              onClick={handleLeaveLobby}
              disabled={isLeaving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLeaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saindo...
                </>
              ) : (
                <>
                  <span className="mr-2">🚪</span>
                  Sair
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Session Info */}
      {session && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Informações da Sessão</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="font-medium">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === "lobby"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {session.status === "lobby"
                    ? "Aguardando jogadores"
                    : "Em andamento"}
                </span>
              </p>
              <p>
                <span className="font-medium">Perfil:</span> {session.profile}
              </p>
              <p>
                <span className="font-medium">Pontos por acerto:</span>{" "}
                {session.rules?.pointsCorrect || 100}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Total de perguntas:</span>{" "}
                {session.rules?.totalQuestions || "Todas"}
              </p>
              <p>
                <span className="font-medium">Tempo por pergunta:</span>{" "}
                {session.rules?.perQuestionTimeSec
                  ? `${session.rules.perQuestionTimeSec}s`
                  : "Sem limite"}
              </p>
              <p>
                <span className="font-medium">Bônus de velocidade:</span>{" "}
                {session.rules?.speedBonus?.enabled ? "Ativado" : "Desativado"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            Jogadores ({players.length})
          </h2>
          <p className="text-sm text-gray-600">
            Aguardando o host iniciar o jogo...
          </p>
        </div>

        {players.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">Nenhum jogador conectado ainda.</p>
            <p className="text-sm text-gray-500 mt-1">
              Compartilhe o código da sessão para outros jogadores entrarem!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{player.nickname}</div>
                    <div className="text-sm text-gray-500">
                      {player.score} pontos
                      {player.streak > 0 && ` • Sequência: ${player.streak}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Conectado</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Code */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800 mb-2">
          Código da sessão para compartilhar:
        </p>
        <div className="flex items-center justify-center space-x-2">
          <code className="bg-white px-3 py-2 rounded border text-lg font-mono text-blue-900">
            {sessionId}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sessionId);
              // You could add a toast notification here
            }}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            📋 Copiar
          </button>
        </div>
      </div>
    </div>
  );
}
