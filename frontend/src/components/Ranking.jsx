import React from "react";

export default function Ranking({ leaderboard }) {
  const getRankIcon = (idx) => {
    switch (idx) {
      case 0:
        return "🏆";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "⭐";
    }
  };

  const getRankStyle = (idx) => {
    switch (idx) {
      case 0:
        return "bg-gradient-to-r from-nautical-gold to-yellow-400 text-white captain-rank";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800";
      case 2:
        return "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white";
      default:
        return "bg-ocean-100 text-ocean-800";
    }
  };

  return (
    <div className="nautical-card sticky top-2 md:top-6">
      <div className="bg-gradient-to-r from-ocean-600 to-ocean-800 p-2 md:p-4 border-b">
        <h3 className="text-sm md:text-xl font-maritime font-bold text-white flex items-center">
          <img
            src="/star.png"
            alt="Star"
            className="w-4 h-4 md:w-6 md:h-6 mr-1 md:mr-2 treasure-glow"
          />
          Ranking
        </h3>
        <p className="text-ocean-100 font-maritime text-xs md:text-sm">
          Classificação por pontos
        </p>
      </div>

      <div className="p-2 md:p-4">
        <div className="space-y-2 md:space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-3 md:py-6">
              <img
                src="/ship.png"
                alt="Ship"
                className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 sailing-ship opacity-50"
              />
              <p className="text-ocean-600 font-maritime text-xs md:text-sm">
                Aguardando jogadores...
              </p>
            </div>
          ) : (
            leaderboard.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-ocean-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(
                      idx
                    )}`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="font-maritime font-semibold text-ocean-800">
                        {player.nickname}
                      </span>
                      {idx === 0 && <span className="ml-2 text-xs">👑</span>}
                    </div>
                    <div className="text-xs text-ocean-600 font-maritime flex items-center">
                      <img
                        src="/shell.png"
                        alt="Shell"
                        className="w-3 h-3 mr-1"
                      />
                      {player.score} pts
                      {player.streak > 0 && (
                        <span className="ml-2 flex items-center">
                          <img
                            src="/ropes.png"
                            alt="Ropes"
                            className="w-3 h-3 mr-1"
                          />
                          streak {player.streak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-lg">{getRankIcon(idx)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Decorative Footer */}
      <div className="border-t border-ocean-200 p-3 bg-gradient-to-r from-ocean-50 to-nautical-sail/30">
        <div className="flex items-center justify-center space-x-4 text-ocean-600">
          <div className="flex items-center">
            <img src="/anchor.png" alt="Anchor" className="w-3 h-3 mr-1" />
            <span className="text-xs font-maritime">Coragem</span>
          </div>
          <div className="flex items-center">
            <img src="/compass.png" alt="Compass" className="w-3 h-3 mr-1" />
            <span className="text-xs font-maritime">Navegação</span>
          </div>
        </div>
      </div>
    </div>
  );
}
