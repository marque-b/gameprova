import React from "react";

export default function Ranking({ leaderboard }) {
  return (
    <div className="border rounded p-4">
      <div className="font-semibold mb-2">Ranking</div>
      <div className="space-y-1">
        {leaderboard.map((p, idx) => (
          <div key={p.id}>
            {idx + 1}. {p.nickname} – {p.score} pts (streak {p.streak})
          </div>
        ))}
      </div>
    </div>
  );
}
