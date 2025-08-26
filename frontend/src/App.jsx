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
        return "bg-nautical-gold/20 text-nautical-gold border border-nautical-gold/40";
      case "running":
        return "bg-ocean-100 text-ocean-800 border border-ocean-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  return (
    <div className="min-h-screen p-6 pt-14 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
          <img src="/ship.png" alt="Ship" className="w-20 h-20 sailing-ship" />
        </div>
        <div className="pt-16">
          <h1 className="text-5xl font-nautical mb-4 drop-shadow-2xl">
            GameProva
          </h1>
          <div className="flex items-center justify-center space-x-4">
            <img
              src="/anchor.png"
              alt="Anchor"
              className="w-6 h-6 anchor-icon"
            />
            <Link to="/host" className="btn-nautical inline-flex items-center">
              <img src="/compass.png" alt="Compass" className="w-6 h-6 mr-2" />
              CRUD
            </Link>
            <img
              src="/anchor.png"
              alt="Anchor"
              className="w-6 h-6 anchor-icon"
            />
          </div>
        </div>
      </div>

      {/* Active Sessions Section */}
      <div className="nautical-card">
        <div className="bg-gradient-to-r from-ocean-500 to-ocean-700 px-6 py-4 border-b relative">
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <img
              src="/lifebuoy.png"
              alt="Lifebuoy"
              className="w-8 h-8 animate-float"
            />
          </div>
          <img src="/sail.png" alt="Sail" className="absolute w-6 h-6 mr-3" />
          <h2 className="md:text-2xl font-maritime font-bold text-white w-full mx-auto text-center">
            Sessões Ativas
          </h2>
          <p className="text-ocean-100 font-maritime text-xs md:text-base mx-10 text-center">
            Junte-se a uma sessão existente ou crie uma nova
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <img
              src="/compass.png"
              alt="Compass"
              className="w-12 h-12 mx-auto compass-rose mb-4"
            />
            <p className="text-ocean-700 font-maritime text-lg">
              Carregando sessões...
            </p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <img
              src="/anchor.png"
              alt="Anchor"
              className="w-12 h-12 mx-auto mb-4 text-red-500"
            />
            <p className="text-red-600 font-maritime text-lg mb-4">
              Erro ao carregar sessões: {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-nautical"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && activeSessions.length === 0 && (
          <div className="p-8 text-center">
            <img
              src="/ship.png"
              alt="Ship"
              className="w-16 h-16 mx-auto mb-4 sailing-ship"
            />
            <p className="text-ocean-700 font-maritime text-lg">
              Nenhuma sessão ativa no momento.
            </p>
          </div>
        )}

        {!loading && !error && activeSessions.length > 0 && (
          <div className="divide-y divide-ocean-200">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 md:p-6 hover:bg-ocean-50/30 transition-all duration-300 relative group"
              >
                <div className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 opacity-30 group-hover:opacity-60 transition-opacity">
                  <img
                    src="/star.png"
                    alt="Star"
                    className="w-2 h-2 md:w-4 md:h-4 treasure-glow"
                  />
                </div>
                <div className="flex items-center justify-between ml-4 md:ml-8">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                      <h3 className="text-sm md:text-xl font-maritime font-semibold text-ocean-800 flex items-center">
                        <img
                          src="/ship.png"
                          alt="Ship"
                          className="w-3 h-3 md:w-5 md:h-5 mr-1 md:mr-2"
                        />
                        Sessão {session.id}
                      </h3>
                      <span
                        className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-ocean-700 space-y-1 font-maritime">
                      <p className="flex items-center">
                        <img
                          src="/ropes.png"
                          alt="Ropes"
                          className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                        />
                        Banco: {session.bank?.name || "N/A"}
                      </p>
                      <p className="flex items-center">
                        <img
                          src="/anchor.png"
                          alt="Anchor"
                          className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                        />
                        Jogadores: {session.playerCount}
                      </p>
                      <p className="flex items-center">
                        <img
                          src="/compass.png"
                          alt="Compass"
                          className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                        />
                        Perfil: {session.profile}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 md:space-x-3">
                    <Link
                      to={`/join/${session.id}`}
                      className="btn-nautical flex items-center text-xs md:text-base px-3 md:px-6 py-2 md:py-3"
                    >
                      <img
                        src="/sail.png"
                        alt="Sail"
                        className="w-3 h-3 md:w-5 md:h-5 mr-1 md:mr-2"
                      />
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
        return "bg-nautical-gold/20 text-nautical-gold border border-nautical-gold/40";
      case "running":
        return "bg-ocean-100 text-ocean-800 border border-ocean-300";
      case "finished":
        return "bg-green-100 text-green-800 border border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="nautical-card">
        <div className="bg-gradient-to-r from-ocean-600 to-ocean-800 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20">
            <img src="/ship.png" alt="Ship" className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-nautical text-white mb-2">
                  Painel do Host
                </h1>
                <p className="text-ocean-100 text-lg font-maritime">
                  Gerencie suas sessões de jogo
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-nautical flex items-center"
              >
                <img
                  src="/compass.png"
                  alt="Compass"
                  className="w-5 h-5 mr-2"
                />
                {showCreateForm ? "Cancelar" : "Criar Nova Sessão"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <div className="nautical-card">
          <div className="bg-gradient-to-r from-nautical-gold/10 to-nautical-rope/10 p-6 border-b border-nautical-gold/20">
            <h2 className="text-2xl font-maritime font-bold text-ocean-800 flex items-center flex-row">
              <img src="/anchor.png" alt="Anchor" className="w-6 h-6 mr-3" />
              Criar Nova Sessão
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleCreateSession} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <label>
                  <span className="text-ocean-800 font-maritime font-semibold mb-2 flex items-center">
                    <img
                      src="/ropes.png"
                      alt="Ropes"
                      className="w-4 h-4 mr-2"
                    />
                    Banco de Questões
                  </span>
                  <input
                    className="border-2 border-ocean-200 rounded-lg p-3 w-full focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors font-maritime"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                    placeholder="arrais_amador"
                  />
                </label>
                <label>
                  <span className="text-ocean-800 font-maritime font-semibold mb-2 flex items-center">
                    <img src="/sail.png" alt="Sail" className="w-4 h-4 mr-2" />
                    Perfil
                  </span>
                  <select
                    className="border-2 border-ocean-200 rounded-lg p-3 w-full focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-colors font-maritime"
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

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={creatingSession}
                  className="btn-nautical flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img src="/ship.png" alt="Ship" className="w-5 h-5 mr-2" />
                  {creatingSession ? "Criando..." : "Criar Sessão"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-ocean-200 text-ocean-800 rounded-lg hover:bg-ocean-300 transition-colors font-maritime font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="nautical-card">
        <div className="bg-gradient-to-r from-ocean-500 to-ocean-700 px-6 py-4 border-b relative">
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <img
              src="/lifebuoy.png"
              alt="Lifebuoy"
              className="w-8 h-8 animate-float"
            />
          </div>
          <h2 className="text-2xl font-maritime font-bold text-white flex items-center">
            <img src="/sail.png" alt="Sail" className="w-6 h-6 mr-3" />
            Suas Sessões
          </h2>
          <p className="text-ocean-100 font-maritime">
            Gerencie e monitore suas sessões ativas
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <img
              src="/compass.png"
              alt="Compass"
              className="w-12 h-12 mx-auto compass-rose mb-4"
            />
            <p className="text-ocean-700 font-maritime text-lg">
              Carregando sessões...
            </p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <img
              src="/anchor.png"
              alt="Anchor"
              className="w-12 h-12 mx-auto mb-4 text-red-500"
            />
            <p className="text-red-600 font-maritime text-lg mb-4">
              Erro ao carregar sessões: {error}
            </p>
            <button onClick={fetchSessions} className="btn-nautical">
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && activeSessions.length === 0 && (
          <div className="p-8 text-center">
            <img
              src="/ship.png"
              alt="Ship"
              className="w-16 h-16 mx-auto mb-4 sailing-ship"
            />
            <p className="text-ocean-700 font-maritime text-lg">
              Você ainda não criou nenhuma sessão.
            </p>
            <p className="text-ocean-600 font-maritime mt-2">
              Clique em "Criar Nova Sessão" para começar!
            </p>
          </div>
        )}

        {!loading && !error && activeSessions.length > 0 && (
          <div className="divide-y divide-ocean-200">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 md:p-6 hover:bg-ocean-50/30 transition-all duration-300 relative group"
              >
                <div className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 opacity-30 group-hover:opacity-60 transition-opacity">
                  <img
                    src="/star.png"
                    alt="Star"
                    className="w-2 h-2 md:w-4 md:h-4 treasure-glow"
                  />
                </div>
                <div className="ml-4 md:ml-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4">
                    <div className="flex-1 mb-3 md:mb-0">
                      <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                        <h3 className="text-sm md:text-xl font-maritime font-semibold text-ocean-800 flex items-center">
                          <img
                            src="/ship.png"
                            alt="Ship"
                            className="w-3 h-3 md:w-5 md:h-5 mr-1 md:mr-2"
                          />
                          Sessão {session.id}
                        </h3>
                        <span
                          className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {getStatusText(session.status)}
                        </span>
                      </div>
                      <div className="text-xs md:text-sm text-ocean-700 space-y-1 font-maritime">
                        <p className="flex items-center">
                          <img
                            src="/ropes.png"
                            alt="Ropes"
                            className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                          />
                          Banco: {session.bank?.name || "N/A"}
                        </p>
                        <p className="flex items-center">
                          <img
                            src="/anchor.png"
                            alt="Anchor"
                            className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                          />
                          Jogadores: {session.playerCount}
                        </p>
                        <p className="flex items-center">
                          <img
                            src="/compass.png"
                            alt="Compass"
                            className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                          />
                          Perfil: {session.profile}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                      {session.status === "lobby" && (
                        <button
                          onClick={() => handleStartSession(session.id)}
                          className="btn-nautical flex items-center text-xs md:text-sm px-3 md:px-4 py-2"
                        >
                          <img
                            src="/sail.png"
                            alt="Sail"
                            className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                          />
                          Iniciar
                        </button>
                      )}
                      {session.status === "running" && (
                        <Link
                          to={`/host/${session.id}`}
                          className="btn-nautical flex items-center text-xs md:text-sm px-3 md:px-4 py-2"
                        >
                          <img
                            src="/compass.png"
                            alt="Compass"
                            className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                          />
                          Gerenciar
                        </Link>
                      )}
                      {session.status === "finished" && (
                        <Link
                          to={`/results/${session.id}`}
                          className="btn-nautical flex items-center text-xs md:text-sm px-3 md:px-4 py-2"
                        >
                          <img
                            src="/star.png"
                            alt="Star"
                            className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                          />
                          Ver Resultados
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-2 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm font-medium"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>

                  {/* Session Code */}
                  <div className="bg-gradient-to-r from-nautical-gold/10 to-nautical-rope/10 rounded-lg p-2 md:p-4 border border-nautical-gold/20">
                    <p className="text-xs md:text-sm text-ocean-700 font-maritime font-semibold mb-2 flex items-center">
                      <img
                        src="/lifebuoy.png"
                        alt="Lifebuoy"
                        className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2"
                      />
                      Código da sessão para compartilhar:
                    </p>
                    <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
                      <code className="bg-white px-2 md:px-4 py-2 rounded-lg border-2 border-ocean-200 text-sm md:text-lg font-mono text-ocean-900 font-bold">
                        {session.id}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(session.id);
                          // Adicionar toast notification aqui
                        }}
                        className="btn-nautical flex items-center text-xs md:text-sm px-3 md:px-4 py-2"
                      >
                        📋 Copiar
                      </button>
                    </div>
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
