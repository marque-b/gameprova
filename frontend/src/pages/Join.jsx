import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameStore } from "../store/useGameStore.js";

export default function Join() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const connect = useGameStore((s) => s.connect);

  async function handleJoin(e) {
    e.preventDefault();
    await connect(sessionId, nickname);
    navigate(`/lobby/${sessionId}`);
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="nautical-card max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-ocean-600 to-ocean-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 opacity-20">
            <img src="/anchor.png" alt="Anchor" className="w-24 h-24" />
          </div>
          <div className="absolute top-0 right-0 opacity-20">
            <img src="/sail.png" alt="Sail" className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <img
              src="/compass.png"
              alt="Compass"
              className="w-16 h-16 mx-auto mb-4 compass-rose"
            />
            <h1 className="text-3xl font-nautical text-white mb-2">
              Entrar na sessão {sessionId}
            </h1>
            <p className="text-ocean-200 font-maritime mt-2">
              Junte-se à aventura do conhecimento!
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="text-ocean-800 font-maritime font-semibold mb-3 flex items-center">
                <img
                  src="/lifebuoy.png"
                  alt="Lifebuoy"
                  className="w-5 h-5 mr-2"
                />
                Seu apelido
              </label>
              <input
                className="border-2 border-ocean-300 rounded-lg p-4 w-full text-lg font-maritime
                          focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 
                          transition-all duration-300 bg-white/90"
                placeholder="Seu apelido"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <button
              className="btn-nautical w-full text-lg py-4 flex items-center justify-center space-x-3"
              type="submit"
              disabled={!nickname}
            >
              <img src="/ship.png" alt="Ship" className="w-6 h-6" />
              <span>Entrar</span>
              <img
                src="/star.png"
                alt="Star"
                className="w-6 h-6 treasure-glow"
              />
            </button>
          </form>

          {/* Decorative Elements */}
          <div className="mt-6 pt-6 border-t border-ocean-200 text-center">
            <div className="flex items-center justify-center space-x-6 text-ocean-600">
              <div className="flex flex-col items-center">
                <img src="/ropes.png" alt="Ropes" className="w-6 h-6 mb-1" />
                <span className="text-xs font-maritime">Aventura</span>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src="/anchor.png"
                  alt="Anchor"
                  className="w-6 h-6 mb-1 animate-float"
                />
                <span className="text-xs font-maritime">Conhecimento</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/shell.png" alt="Shell" className="w-6 h-6 mb-1" />
                <span className="text-xs font-maritime">Diversão</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
