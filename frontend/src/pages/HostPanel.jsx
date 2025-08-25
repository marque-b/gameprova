import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore.js";

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === "true";

function debugLog(msg, extra) {
  if (DEBUG_LOGS) {
    const ts = new Date().toISOString();
    console.log(`[DEBUG] [${ts}] [HOST_PANEL] ${msg}`, extra ?? "");
  }
}

export default function HostPanel() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const {
    createSession,
    rules,
    updateRules,
    start,
    next,
    session,
    players,
    question,
  } = useGameStore((s) => ({
    createSession: s.createSession,
    rules: s.rules,
    updateRules: s.updateRules,
    start: s.start,
    next: s.next,
    session: s.session,
    players: s.players,
    question: s.question,
  }));

  const [showRulesForm, setShowRulesForm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  debugLog(`HostPanel render:`, {
    sessionId,
    session,
    players: players.length,
    question: question?.id,
  });

  useEffect(() => {
    if (!sessionId || sessionId === "new") return;

    // Conectar à sessão existente
    debugLog(`Connecting to existing session: ${sessionId}`);

    // Conectar como host à sessão (sem se juntar como jogador)
    const socket = useGameStore.getState().ensureSocket();
    debugLog(`Socket connected: ${socket.id}`);
    
    // Emitir evento especial para host (não como jogador)
    socket.emit("host:join", { sessionId });
    debugLog(`Emitted host:join for session: ${sessionId}`);
  }, [sessionId]);

  useEffect(() => {
    if (question) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [question]);

  const [bankName, setBankName] = useState("arrais_amador");
  const [profile, setProfile] = useState("custom");

  async function handleCreateSession(e) {
    e.preventDefault();
    debugLog(`Creating session: bank=${bankName}, profile=${profile}`);
    const data = await createSession(bankName, profile);
    if (data?.sessionId) {
      debugLog(`Session created successfully: ${data.sessionId}`);
      navigate(`/host/${data.sessionId}`);
    } else {
      debugLog(`Session creation failed:`, data);
    }
  }

  function handleUpdateRules(partial) {
    debugLog(`Updating rules:`, partial);
    updateRules(partial);
  }

  function handleStart() {
    debugLog(`Starting game`);
    start();
  }

  function handleNext() {
    debugLog(`Requesting next question`);
    next();
  }

  function handleEndSession() {
    if (confirm("Tem certeza que deseja finalizar esta sessão?")) {
      // Implementar lógica para finalizar sessão
      debugLog(`Ending session`);
    }
  }

  // Se for uma nova sessão, mostrar formulário de criação
  if (sessionId === "new") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Criar Nova Sessão</h1>
            <p className="text-gray-600 mt-1">
              Configure e inicie uma nova sessão de jogo
            </p>
          </div>
          <button
            onClick={() => navigate("/host")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Voltar ao Painel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configuração da Sessão</h2>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">
                  Banco de Questões
                </span>
                <input
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="arrais_amador"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Perfil</span>
                <select
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                >
                  <option value="custom">Custom (síncrono)</option>
                  <option value="exam">Prova</option>
                  <option value="streak">Streak (síncrono)</option>
                </select>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Criar Sessão
              </button>
              <button
                type="button"
                onClick={() => navigate("/host")}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Painel de controle da sessão ativa
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle da Sessão</h1>
          <p className="text-gray-600 mt-1">
            Sessão {sessionId} •{" "}
            {session?.bank?.meta?.name || "Banco de questões"}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/host")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Voltar ao Painel
          </button>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Finalizar Sessão
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Session Info & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Status da Sessão</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session?.status === "lobby"
                    ? "bg-yellow-100 text-yellow-800"
                    : session?.status === "running"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {session?.status === "lobby"
                  ? "Aguardando jogadores"
                  : session?.status === "running"
                  ? "Em andamento"
                  : "Finalizada"}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Jogadores:</span> {players.length}
              </div>
              <div>
                <span className="font-medium">Questão atual:</span>{" "}
                {currentQuestionIndex}
              </div>
              <div>
                <span className="font-medium">Perfil:</span> {session?.profile}
              </div>
            </div>

            {/* Session Code */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Código da sessão:</p>
              <div className="flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border text-lg font-mono text-gray-900">
                  {sessionId}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sessionId);
                    // Adicionar toast notification aqui
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  📋 Copiar
                </button>
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Controles do Jogo</h2>

            <div className="flex space-x-3 mb-4">
              {session?.status === "lobby" && (
                <button
                  onClick={handleStart}
                  disabled={players.length === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {players.length === 0
                    ? "Aguardando jogadores..."
                    : "Iniciar Jogo"}
                </button>
              )}

              {session?.status === "running" && (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Próxima Questão
                </button>
              )}
            </div>

            {/* Rules Configuration */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Configurações</h3>
                <button
                  onClick={() => setShowRulesForm(!showRulesForm)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {showRulesForm ? "Ocultar" : "Editar"}
                </button>
              </div>

              {/* Current Rules Summary */}
              {!showRulesForm && (
                <div className="grid md:grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                  <div>
                    <span className="font-medium">Pontos:</span>{" "}
                    {rules.pointsCorrect} acerto / {rules.pointsWrong} erro
                  </div>
                  <div>
                    <span className="font-medium">Tempo:</span>{" "}
                    {rules.perQuestionTimeSec
                      ? `${rules.perQuestionTimeSec}s`
                      : "Sem limite"}
                  </div>
                  <div>
                    <span className="font-medium">Questões:</span>{" "}
                    {rules.totalQuestions || "Todas"}
                  </div>
                  <div>
                    <span className="font-medium">Bônus velocidade:</span>{" "}
                    {rules.speedBonus?.enabled ? "Ativado" : "Desativado"}
                  </div>
                  <div>
                    <span className="font-medium">Bônus sequência:</span>{" "}
                    {rules.streakBonus?.enabled ? "Ativado" : "Desativado"}
                  </div>
                  <div>
                    <span className="font-medium">Revelação:</span>{" "}
                    {rules.revealDelaySec || 3}s
                  </div>
                </div>
              )}

              {showRulesForm && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {/* Basic Rules */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <NumberField
                      label="Pontos por acerto"
                      value={rules.pointsCorrect}
                      onChange={(v) => handleUpdateRules({ pointsCorrect: v })}
                    />
                    <NumberField
                      label="Pontos por erro"
                      value={rules.pointsWrong}
                      onChange={(v) => handleUpdateRules({ pointsWrong: v })}
                    />
                    <NumberField
                      label="Tempo por questão (s)"
                      value={rules.perQuestionTimeSec ?? ""}
                      onChange={(v) =>
                        handleUpdateRules({ perQuestionTimeSec: v })
                      }
                      placeholder="30"
                      helpText="Set to enable timer"
                    />
                  </div>

                  {/* Game Settings */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <NumberField
                      label="Total de questões"
                      value={rules.totalQuestions ?? ""}
                      onChange={(v) => handleUpdateRules({ totalQuestions: v })}
                    />
                    <NumberField
                      label="Tempo total (s)"
                      value={rules.totalTimeSec ?? ""}
                      onChange={(v) => handleUpdateRules({ totalTimeSec: v })}
                    />
                    <NumberField
                      label="Delay de revelação (s)"
                      value={rules.revealDelaySec ?? 3}
                      onChange={(v) => handleUpdateRules({ revealDelaySec: v })}
                      helpText="Seconds to show answer"
                    />
                  </div>

                  {/* Speed Bonus Settings */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Bônus de Velocidade</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <ToggleField
                        label="Ativar bônus de velocidade"
                        checked={!!rules.speedBonus?.enabled}
                        onChange={(v) =>
                          handleUpdateRules({
                            speedBonus: { ...rules.speedBonus, enabled: v },
                          })
                        }
                      />
                      <NumberField
                        label="Bônus máximo"
                        value={rules.speedBonus?.maxBonus ?? 0}
                        onChange={(v) =>
                          handleUpdateRules({
                            speedBonus: { ...rules.speedBonus, maxBonus: v },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Streak Bonus Settings */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Bônus de Sequência</h4>
                    <div className="grid md:grid-cols-3 gap-3">
                      <ToggleField
                        label="Ativar bônus de sequência"
                        checked={!!rules.streakBonus?.enabled}
                        onChange={(v) =>
                          handleUpdateRules({
                            streakBonus: { ...rules.streakBonus, enabled: v },
                          })
                        }
                      />
                      <NumberField
                        label="Pontos por sequência"
                        value={rules.streakBonus?.perConsecutive ?? 0}
                        onChange={(v) =>
                          handleUpdateRules({
                            streakBonus: {
                              ...rules.streakBonus,
                              perConsecutive: v,
                            },
                          })
                        }
                      />
                      <NumberField
                        label="A partir de"
                        value={rules.streakBonus?.from ?? 2}
                        onChange={(v) =>
                          handleUpdateRules({
                            streakBonus: { ...rules.streakBonus, from: v },
                          })
                        }
                        helpText="Sequências de quantas respostas"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">
              Jogadores ({players.length})
            </h2>
          </div>

          {players.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Nenhum jogador conectado.</p>
              <p className="text-sm text-gray-500 mt-1">
                Compartilhe o código da sessão!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {players.map((player, index) => (
                <div key={player.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{player.nickname}</div>
                        <div className="text-sm text-gray-500">
                          {player.score} pontos
                          {player.streak > 0 &&
                            ` • Sequência: ${player.streak}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">
                        Conectado
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {DEBUG_LOGS && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-800">
          <div className="font-medium">Debug Mode Active</div>
          <div className="text-sm">Check browser console for detailed logs</div>
        </div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder, helpText }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <input
        className="border border-gray-300 rounded p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {helpText && <span className="text-xs text-gray-500">{helpText}</span>}
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center space-x-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
