import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import Join from "./pages/Join.jsx";
import Lobby from "./pages/Lobby.jsx";
import Game from "./pages/Game.jsx";
import Results from "./pages/Results.jsx";
import HostPanel from "./pages/HostPanel.jsx";
import { useGameStore } from "./store/useGameStore.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:sessionId" element={<Join />} />
        <Route path="/lobby/:sessionId" element={<Lobby />} />
        <Route path="/game/:sessionId" element={<Game />} />
        <Route path="/results/:sessionId" element={<Results />} />
        <Route path="/host/:sessionId" element={<HostPanel />} />
        <Route path="/host" element={<HostHome />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  const [activeSessions, setActiveSessions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_BASE || "";

        const response = await fetch(`${API_BASE}/api/sessions`);

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }
        const data = await response.json();
        setActiveSessions(data.sessions || []);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    // Refresh sessions every 10 seconds
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = (status) => {
    switch (status) {
      case "lobby":
        return "Aguardando jogadores";
      case "running":
        return "Em andamento";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "lobby":
        return "bg-yellow-100 text-yellow-800";
      case "running":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">GameProva</h1>
        <p className="text-gray-600 mb-6">
          Estudo colaborativo de múltipla escolha em rede local.
        </p>
        <Link
          to="/host"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span className="mr-2">🎮</span>
          Criar Nova Sessão
        </Link>
      </div>

      {/* Active Sessions Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Sessões Ativas</h2>
          <p className="text-sm text-gray-600">
            Junte-se a uma sessão existente ou crie uma nova
          </p>
        </div>

        {loading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando sessões...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <p className="text-red-600">Erro ao carregar sessões: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && activeSessions.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-600">Nenhuma sessão ativa no momento.</p>
            <p className="text-sm text-gray-500 mt-1">
              Seja o primeiro a criar uma sessão!
            </p>
          </div>
        )}

        {!loading && !error && activeSessions.length > 0 && (
          <div className="divide-y divide-gray-200">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium">
                        Sessão {session.id}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Banco: {session.bank?.name || "N/A"}</p>
                      <p>Jogadores: {session.playerCount}</p>
                      <p>Perfil: {session.profile}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/join/${session.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Entrar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HostHome() {
  const [activeSessions, setActiveSessions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [creatingSession, setCreatingSession] = React.useState(false);

  const { createSession, rules, updateRules, start, next } = useGameStore(
    (s) => ({
      createSession: s.createSession,
      rules: s.rules,
      updateRules: s.updateRules,
      start: s.start,
      next: s.next,
    })
  );

  const [formData, setFormData] = React.useState({
    bankName: "arrais_amador",
    profile: "custom",
  });

  React.useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE || "";
      const response = await fetch(`${API_BASE}/api/sessions`);
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      setActiveSessions(data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreatingSession(true);
    try {
      const data = await createSession(formData.bankName, formData.profile);
      if (data?.sessionId) {
        setShowCreateForm(false);
        setFormData({ bankName: "arrais_amador", profile: "custom" });
        fetchSessions();
      }
    } catch (err) {
      console.error("Error creating session:", err);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleStartSession = (sessionId) => {
    // Navegar para o controle da sessão
    window.location.href = `/host/${sessionId}`;
  };

  const handleDeleteSession = async (sessionId) => {
    if (confirm("Tem certeza que deseja deletar esta sessão?")) {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || "";
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchSessions();
        }
      } catch (err) {
        console.error("Error deleting session:", err);
      }
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "lobby":
        return "Aguardando jogadores";
      case "running":
        return "Em andamento";
      case "finished":
        return "Finalizada";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "lobby":
        return "bg-yellow-100 text-yellow-800";
      case "running":
        return "bg-green-100 text-green-800";
      case "finished":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel do Host</h1>
          <p className="text-gray-600 mt-1">Gerencie suas sessões de jogo</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {showCreateForm ? "Cancelar" : "Criar Nova Sessão"}
        </button>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Criar Nova Sessão</h2>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">
                  Banco de Questões
                </span>
                <input
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="arrais_amador"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Perfil</span>
                <select
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.profile}
                  onChange={(e) =>
                    setFormData({ ...formData, profile: e.target.value })
                  }
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
                disabled={creatingSession}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingSession ? "Criando..." : "Criar Sessão"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Suas Sessões</h2>
          <p className="text-sm text-gray-600">
            Gerencie e monitore suas sessões ativas
          </p>
        </div>

        {loading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando sessões...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <p className="text-red-600">Erro ao carregar sessões: {error}</p>
            <button
              onClick={fetchSessions}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && activeSessions.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-600">
              Você ainda não criou nenhuma sessão.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Clique em "Criar Nova Sessão" para começar!
            </p>
          </div>
        )}

        {!loading && !error && activeSessions.length > 0 && (
          <div className="divide-y divide-gray-200">
            {activeSessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium">
                        Sessão {session.id}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Banco: {session.bank?.name || "N/A"}</p>
                      <p>Jogadores: {session.playerCount}</p>
                      <p>Perfil: {session.profile}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {session.status === "lobby" && (
                      <button
                        onClick={() => handleStartSession(session.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Iniciar
                      </button>
                    )}
                    {session.status === "running" && (
                      <Link
                        to={`/host/${session.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Gerenciar
                      </Link>
                    )}
                    {session.status === "finished" && (
                      <Link
                        to={`/results/${session.id}`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Ver Resultados
                      </Link>
                    )}
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Deletar
                    </button>
                  </div>
                </div>

                {/* Session Code */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Código da sessão para compartilhar:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-3 py-2 rounded border text-lg font-mono text-gray-900">
                      {session.id}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(session.id);
                        // Adicionar toast notification aqui
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      📋 Copiar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
