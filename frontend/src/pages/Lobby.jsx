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
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="nautical-card mb-8">
        <div className="bg-gradient-to-r from-ocean-600 to-ocean-800 px-8 py-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 opacity-20">
            <img src="/anchor.png" alt="Anchor" className="w-32 h-32" />
          </div>
          <div className="absolute top-0 right-0 opacity-20">
            <img src="/lifebuoy.png" alt="Lifebuoy" className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-nautical text-white mb-2 flex items-center">
                  <img
                    src="/ship.png"
                    alt="Ship"
                    className="w-10 h-10 mr-4 sailing-ship"
                  />
                  Lobby – Sessão {sessionId}
                </h1>
                <p className="text-ocean-100 text-lg font-maritime flex items-center">
                  <img src="/ropes.png" alt="Ropes" className="w-5 h-5 mr-2" />
                  {session?.bank?.meta?.name || "Banco de questões"}
                </p>
              </div>
              <button
                onClick={handleLeaveLobby}
                disabled={isLeaving}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 
                          transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
                          flex items-center font-maritime font-semibold"
              >
                {isLeaving ? (
                  <>
                    <img
                      src="/compass.png"
                      alt="Compass"
                      className="w-5 h-5 mr-2 compass-rose"
                    />
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
      </div>

      {/* Session Info */}
      {session && (
        <div className="nautical-card mb-8">
          <div className="bg-gradient-to-r from-nautical-gold/10 to-nautical-rope/10 p-6 border-b border-nautical-gold/20">
            <h2 className="text-2xl font-maritime font-bold text-ocean-800 flex items-center">
              <img src="/compass.png" alt="Compass" className="w-6 h-6 mr-3" />
              Informações da Sessão
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 font-maritime">
              <div className="space-y-4">
                <div className="flex items-center">
                  <img
                    src="/anchor.png"
                    alt="Anchor"
                    className="w-5 h-5 mr-3"
                  />
                  <span className="font-semibold text-ocean-800">Status:</span>
                  <span
                    className={`ml-3 px-3 py-1 rounded-full text-sm font-bold ${
                      session.status === "lobby"
                        ? "bg-nautical-gold/20 text-nautical-gold border border-nautical-gold/40"
                        : "bg-ocean-100 text-ocean-800 border border-ocean-300"
                    }`}
                  >
                    {session.status === "lobby"
                      ? "Aguardando jogadores"
                      : "Em andamento"}
                  </span>
                </div>
                <div className="flex items-center">
                  <img src="/sail.png" alt="Sail" className="w-5 h-5 mr-3" />
                  <span className="font-semibold text-ocean-800">Perfil:</span>
                  <span className="ml-3 text-ocean-700">{session.profile}</span>
                </div>
                <div className="flex items-center">
                  <img
                    src="/star.png"
                    alt="Star"
                    className="w-5 h-5 mr-3 treasure-glow"
                  />
                  <span className="font-semibold text-ocean-800">
                    Pontos por acerto:
                  </span>
                  <span className="ml-3 text-ocean-700 font-bold">
                    {session.rules?.pointsCorrect || 100}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <img src="/ropes.png" alt="Ropes" className="w-5 h-5 mr-3" />
                  <span className="font-semibold text-ocean-800">
                    Total de perguntas:
                  </span>
                  <span className="ml-3 text-ocean-700">
                    {session.rules?.totalQuestions || "Todas"}
                  </span>
                </div>
                <div className="flex items-center">
                  <img
                    src="/lifebuoy.png"
                    alt="Lifebuoy"
                    className="w-5 h-5 mr-3"
                  />
                  <span className="font-semibold text-ocean-800">
                    Tempo por pergunta:
                  </span>
                  <span className="ml-3 text-ocean-700">
                    {session.rules?.perQuestionTimeSec
                      ? `${session.rules.perQuestionTimeSec}s`
                      : "Sem limite"}
                  </span>
                </div>
                <div className="flex items-center">
                  <img src="/shell.png" alt="Shell" className="w-5 h-5 mr-3" />
                  <span className="font-semibold text-ocean-800">
                    Bônus de velocidade:
                  </span>
                  <span
                    className={`ml-3 font-bold ${
                      session.rules?.speedBonus?.enabled
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {session.rules?.speedBonus?.enabled
                      ? "Ativado"
                      : "Desativado"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="nautical-card mb-8">
        <div className="bg-gradient-to-r from-ocean-500 to-ocean-700 px-6 py-4 border-b relative">
          <div className="absolute right-4 top-1/2 md:transform md:-translate-y-1/2">
            <img
              src="/lifebuoy.png"
              alt="Lifebuoy"
              className="w-8 h-8 animate-float"
            />
          </div>
          <h2 className="text-2xl font-maritime font-bold text-white flex items-center">
            <img src="/anchor.png" alt="Anchor" className="w-6 h-6 mr-3" />
            Jogadores ({players.length})
          </h2>
          <p className="text-ocean-100 font-maritime">
            Aguardando o host iniciar o jogo...
          </p>
        </div>

        {players.length === 0 ? (
          <div className="p-8 text-center">
            <img
              src="/ship.png"
              alt="Ship"
              className="w-16 h-16 mx-auto mb-4 sailing-ship opacity-50"
            />
            <p className="text-ocean-700 font-maritime text-lg">
              Nenhum jogador conectado ainda.
            </p>
            <p className="text-ocean-600 font-maritime mt-2">
              Compartilhe o código da sessão para outros jogadores entrarem!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ocean-200">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-ocean-50/30 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-nautical-gold to-nautical-rope rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {index + 1}
                    </div>
                    <img
                      src="/star.png"
                      alt="Star"
                      className="w-4 h-4 absolute -top-1 -right-1 treasure-glow"
                    />
                  </div>
                  <div>
                    <div className="font-maritime font-bold text-ocean-800 text-lg flex items-center">
                      <img
                        src="/sail.png"
                        alt="Sail"
                        className="w-4 h-4 mr-2"
                      />
                      {player.nickname}
                      {index === 0 && (
                        <span className="ml-2 captain-rank text-xs">LÍDER</span>
                      )}
                    </div>
                    <div className="text-sm text-ocean-600 font-maritime flex items-center">
                      <img
                        src="/shell.png"
                        alt="Shell"
                        className="w-4 h-4 mr-1"
                      />
                      {player.score} pontos
                      {player.streak > 0 && (
                        <span className="ml-2 flex items-center">
                          <img
                            src="/ropes.png"
                            alt="Ropes"
                            className="w-3 h-3 mr-1"
                          />
                          Sequência: {player.streak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600 font-maritime font-semibold">
                    <img
                      src="/lifebuoy.png"
                      alt="Lifebuoy"
                      className="w-4 h-4 mr-1"
                    />
                    Conectado
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Code */}
      <div className="nautical-card rope-border">
        <div className="bg-gradient-to-r from-nautical-gold/10 to-nautical-rope/10 p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/compass.png" alt="Compass" className="w-8 h-8 mr-3" />
            <h3 className="text-xl font-maritime font-bold text-ocean-800">
              Código da sessão para compartilhar
            </h3>
            <img src="/compass.png" alt="Compass" className="w-8 h-8 ml-3" />
          </div>
          <p className="text-ocean-700 font-maritime mb-6">
            Compartilhe este código para outros jogadores entrarem:
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="bg-white rounded-lg border-4 border-nautical-gold/30 p-4 shadow-lg">
              <code className="text-3xl font-mono font-bold text-ocean-900 tracking-wider">
                {sessionId}
              </code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
                // You could add a toast notification here
              }}
              className="btn-nautical flex items-center"
            >
              <img
                src="/lifebuoy.png"
                alt="Lifebuoy"
                className="w-5 h-5 mr-2"
              />
              📋 Copiar
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center space-x-8 text-ocean-600">
            <div className="flex flex-col items-center">
              <img
                src="/anchor.png"
                alt="Anchor"
                className="w-6 h-6 mb-1 animate-float"
              />
              <span className="text-xs font-maritime">Aventura</span>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="/star.png"
                alt="Star"
                className="w-6 h-6 mb-1 treasure-glow"
              />
              <span className="text-xs font-maritime">Conhecimento</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/sail.png" alt="Sail" className="w-6 h-6 mb-1" />
              <span className="text-xs font-maritime">Diversão</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
