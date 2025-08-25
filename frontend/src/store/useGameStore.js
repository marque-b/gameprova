import { create } from "zustand";
import { io } from "socket.io-client";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === "true";

function debugLog(msg, extra) {
  if (DEBUG_LOGS) {
    const ts = new Date().toISOString();
    console.log(`[DEBUG] [${ts}] [FRONTEND] ${msg}`, extra ?? "");
  }
}

export const useGameStore = create((set, get) => ({
  socket: null,
  session: null,
  players: [],
  leaderboard: [],
  question: null,
  revealState: null, // Track reveal state for current question
  rules: {
    pointsCorrect: 100,
    pointsWrong: 0,
    perQuestionTimeSec: null,
    totalTimeSec: null,
    speedBonus: { enabled: false, maxBonus: 50 },
    streakBonus: { enabled: false, perConsecutive: 20, from: 2 },
    shuffle: true,
  },

  ensureSocket() {
    let socket = get().socket;
    if (!socket) {
      debugLog(`Creating new socket connection to ${API_BASE}`);
      socket = io(API_BASE, { transports: ["websocket"] });

      socket.on("connect", () => {
        debugLog(`Socket connected: ${socket.id}`);
      });

      socket.on("disconnect", () => {
        debugLog(`Socket disconnected`);
      });

      socket.on("session:update", (payload) => {
        debugLog(`Session update received:`, payload);
        set({
          session: payload,
          players: payload.playersPublic,
          rules: payload.rules,
        });
      });

      socket.on("ranking:update", (payload) => {
        debugLog(`Ranking update received:`, payload);
        set({ leaderboard: payload.leaderboard });
      });

      socket.on("question:serve", (payload) => {
        debugLog(`Question serve received:`, payload);
        // reset selection on new question and update session currentIndex via session:update
        set({
          question: payload,
          revealState: null, // Reset reveal state for new question
        });
      });

      socket.on("question:reveal", ({ questionId }) => {
        debugLog(`Question reveal received for question: ${questionId}`);
        const currentQuestion = get().question;
        if (currentQuestion && currentQuestion.id === questionId) {
          debugLog(`Setting reveal state for current question: ${questionId}`);
          set({ revealState: questionId });
        } else {
          debugLog(
            `Reveal received for question ${questionId} but current question is ${currentQuestion?.id}`
          );
        }
      });

      socket.on("session:finished", (payload) => {
        debugLog(`Session finished received:`, payload);
        set({
          leaderboard: payload.leaderboard,
          session: { ...get().session, status: "finished" },
        });
      });

      socket.on("error:event", (payload) => {
        debugLog(`Socket error received:`, payload);
      });

      set({ socket });
    }
    return socket;
  },

  async createSession(bankName, profile) {
    debugLog(`Creating session: bank=${bankName}, profile=${profile}`);
    const currentRules = get().rules;
    debugLog(`Creating session with rules:`, currentRules);

    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank: bankName,
        profile,
        rules: currentRules,
      }),
    });
    const data = await res.json();
    debugLog(`Session created:`, data);
    set({ session: { id: data.sessionId } });
    return data;
  },

  async connect(sessionId, nickname) {
    debugLog(`Connecting to session: ${sessionId} with nickname: ${nickname}`);
    const socket = get().ensureSocket();
    socket.emit("session:join", { sessionId, nickname });
  },

  start() {
    const socket = get().ensureSocket();
    const sid = get().session?.id;
    debugLog(`Starting session: ${sid}`);
    socket.emit("host:start", { sessionId: sid });
  },

  updateRules(partial) {
    debugLog(`Updating rules:`, partial);
    set((state) => ({ rules: { ...state.rules, ...partial } }));
    const socket = get().ensureSocket();
    const sid = get().session?.id;
    const currentRules = get().rules;
    debugLog(`Emitting host:updateRules with rules:`, currentRules);
    socket.emit("host:updateRules", { sessionId: sid, rules: currentRules });
  },

  answer(questionId, choiceId) {
    const socket = get().ensureSocket();
    const timeMs = Date.now(); // Track answer time for potential speed bonus
    debugLog(
      `Submitting answer: question=${questionId}, choice=${choiceId}, timeMs=${timeMs}`
    );
    socket.emit("player:answer", { questionId, choiceId, timeMs });
  },

  next() {
    const socket = get().ensureSocket();
    const sid = get().session?.id;
    debugLog(`Host requesting next question for session: ${sid}`);
    socket.emit("host:next", { sessionId: sid });
  },

  disconnect() {
    const socket = get().socket;
    const session = get().session;
    if (socket && session) {
      debugLog(`Emitting player:leave for session: ${session.id}`);
      socket.emit("player:leave", { sessionId: session.id });
    }
    if (socket) {
      debugLog(`Disconnecting socket: ${socket.id}`);
      socket.disconnect();
      set({
        socket: null,
        session: null,
        players: [],
        leaderboard: [],
        question: null,
        revealState: null,
      });
    }
  },
}));
