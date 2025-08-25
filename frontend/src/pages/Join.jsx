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
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Entrar na sessão {sessionId}</h1>
      <form onSubmit={handleJoin} className="space-y-3">
        <input
          className="border p-2 w-full"
          placeholder="Seu apelido"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          type="submit"
          disabled={!nickname}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
