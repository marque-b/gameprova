import { randomUUID } from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";

const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

export const sessions = new Map();

const defaultRules = {
  pointsCorrect: 100,
  pointsWrong: 0,
  perQuestionTimeSec: null,
  totalTimeSec: null,
  speedBonus: { enabled: false, maxBonus: 50 },
  streakBonus: { enabled: false, perConsecutive: 20, from: 2 },
  shuffle: true,
  totalQuestions: null,
  revealDelaySec: 3,
};

function debugLog(sessionId, msg, extra) {
  if (DEBUG_LOGS) {
    const ts = new Date().toISOString();
    console.log(`[DEBUG] [${ts}] [session:${sessionId}] ${msg}`, extra ?? "");
  }
}

export async function createSession({
  bankName,
  rules = {},
  profile = "custom",
}) {
  const id = randomUUID().slice(0, 8);
  debugLog(id, `Creating new session: bank=${bankName}, profile=${profile}`, {
    rules,
  });

  const bank = await loadBank(bankName);
  debugLog(id, `Bank loaded: ${bank.questions?.length || 0} questions`);

  const session = {
    id,
    status: "lobby",
    profile,
    rules: { ...defaultRules, ...rules },
    bank,
    players: [],
    answers: new Map(), // playerId -> Map(questionId -> answer)
    order: [], // for sync modes
    currentIndex: 0,
  };

  sessions.set(id, session);
  debugLog(
    id,
    `Session created successfully with ${bank.questions?.length || 0} questions`
  );
  debugLog(id, `Final session rules:`, session.rules);
  return session;
}

export function getSession(id) {
  const session = sessions.get(id);
  if (!session && DEBUG_LOGS) {
    debugLog(id, `Session not found`);
  }
  return session;
}

export function joinSession(sessionId, nickname) {
  debugLog(sessionId, `Player join attempt: nickname=${nickname}`);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Join failed: session not found`);
    return null;
  }

  const player = {
    id: randomUUID().slice(0, 8),
    nickname,
    score: 0,
    streak: 0,
  };

  session.players.push(player);
  debugLog(sessionId, `Player joined successfully: ${nickname} (${player.id})`);

  // If joining an ongoing EXAM session, initialize personal order
  if (session.status === "running" && session.profile === "exam") {
    debugLog(
      sessionId,
      `Late join to exam session: initializing player order for ${player.id}`
    );
    player.order = buildOrder(session);
    player.startedAt = Date.now();
    player.cursor = 0;
    debugLog(
      sessionId,
      `Player ${player.id} initialized with ${
        player.order?.length || 0
      } questions`
    );
  }

  return { session, player };
}

export function updateRules(sessionId, partial) {
  debugLog(sessionId, `Updating rules:`, partial);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Update rules failed: session not found`);
    return;
  }

  const oldRules = { ...session.rules };
  session.rules = { ...session.rules, ...partial };

  debugLog(sessionId, `Rules updated:`, {
    old: oldRules,
    new: session.rules,
    changes: partial,
  });
}

export function startSession(sessionId) {
  debugLog(sessionId, `Starting session`);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Start session failed: session not found`);
    return;
  }

  session.status = "running";
  debugLog(sessionId, `Session status changed to running`);

  // For exam profile: assign per-player order now
  if (session.profile === "exam") {
    debugLog(
      sessionId,
      `Exam profile: building individual question orders for ${session.players.length} players`
    );
    for (const p of session.players) {
      p.order = buildOrder(session);
      p.startedAt = Date.now();
      p.cursor = 0;
      debugLog(
        sessionId,
        `Player ${p.id} (${p.nickname}) initialized with ${
          p.order?.length || 0
        } questions`
      );
    }
  } else {
    // sync modes: single order for the whole session
    debugLog(sessionId, `Sync profile: building shared question order`);
    session.order = buildOrder(session);
    session.currentIndex = 0;
    debugLog(
      sessionId,
      `Shared order built with ${session.order?.length || 0} questions`
    );
  }
}

export function endSession(sessionId) {
  debugLog(sessionId, `Ending session`);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `End session failed: session not found`);
    return;
  }

  session.status = "finished";
  debugLog(sessionId, `Session status changed to finished`);
}

export function submitAnswer(
  sessionId,
  playerId,
  { questionId, choiceId, timeMs },
  applyScore = true
) {
  debugLog(
    sessionId,
    `Submitting answer: player=${playerId}, question=${questionId}, choice=${choiceId}, timeMs=${timeMs}, applyScore=${applyScore}`
  );

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Submit answer failed: session not found`);
    return;
  }

  const player = session.players.find((p) => p.id === playerId);
  if (!player) {
    debugLog(sessionId, `Submit answer failed: player ${playerId} not found`);
    return;
  }

  // Prevent duplicate answers per question
  if (!session.answers.has(playerId)) {
    session.answers.set(playerId, new Map());
    debugLog(sessionId, `Created answer map for player ${playerId}`);
  }

  const existing = session.answers.get(playerId).get(questionId);
  if (existing) {
    debugLog(
      sessionId,
      `Duplicate answer ignored: player=${playerId}, question=${questionId}`
    );
    return; // ignore duplicates
  }

  const question = session.bank.questions.find((q) => q.id === questionId);
  const correct = question?.answer === choiceId;

  debugLog(
    sessionId,
    `Answer processed: correct=${correct}, expected=${question?.answer}, given=${choiceId}`
  );

  // Store the answer
  const answerData = {
    questionId,
    choiceId,
    timeMs,
    isCorrect: !!correct,
    scoreApplied: false,
  };

  // Calculate potential score (but don't apply yet if applyScore is false)
  let delta = 0;
  if (applyScore) {
    delta = correct ? session.rules.pointsCorrect : session.rules.pointsWrong;
    debugLog(
      sessionId,
      `Base score: ${delta} (${correct ? "correct" : "incorrect"})`
    );

    if (
      correct &&
      session.rules.speedBonus?.enabled &&
      typeof session.rules.perQuestionTimeSec === "number"
    ) {
      const remaining = Math.max(
        0,
        session.rules.perQuestionTimeSec * 1000 - (timeMs || 0)
      );
      const ratio = Math.min(
        1,
        remaining / (session.rules.perQuestionTimeSec * 1000)
      );
      const speedBonus = Math.round(
        ratio * (session.rules.speedBonus.maxBonus || 0)
      );
      delta += speedBonus;
      debugLog(
        sessionId,
        `Speed bonus: ${speedBonus} (ratio=${ratio.toFixed(
          2
        )}, remaining=${remaining}ms)`
      );
    }

    if (correct && session.rules.streakBonus?.enabled) {
      const from = session.rules.streakBonus.from || 2;
      if (player.streak + 1 >= from) {
        const streakBonus = session.rules.streakBonus.perConsecutive || 0;
        delta += streakBonus;
        debugLog(
          sessionId,
          `Streak bonus: ${streakBonus} (streak=${
            player.streak + 1
          }, from=${from})`
        );
      }
      player.streak += 1;
    } else if (!correct) {
      debugLog(sessionId, `Streak reset: ${player.streak} -> 0`);
      player.streak = 0;
    }

    player.score += delta;
    answerData.scoreApplied = true;
    answerData.delta = delta;
    debugLog(
      sessionId,
      `Final score for player ${playerId}: ${player.score} (+${delta})`
    );
  } else {
    // Store potential score for later application
    delta = correct ? session.rules.pointsCorrect : session.rules.pointsWrong;
    answerData.delta = delta;
    debugLog(
      sessionId,
      `Score calculated but not applied: ${delta} (${
        correct ? "correct" : "incorrect"
      })`
    );
  }

  session.answers.get(playerId).set(questionId, answerData);

  debugLog(sessionId, `Answer stored successfully for player ${playerId}`);
}

async function loadBank(name) {
  debugLog("system", `Loading question bank: ${name}`);

  const file = path.resolve(process.cwd(), "data", `${name}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    const bank = JSON.parse(raw);
    debugLog(
      "system",
      `Bank loaded successfully: ${bank.questions?.length || 0} questions`
    );
    return bank;
  } catch (error) {
    debugLog("system", `Failed to load bank ${name}:`, error);
    throw error;
  }
}

function buildOrder(session) {
  debugLog(
    session.id,
    `Building question order: shuffle=${session.rules.shuffle}, totalQuestions=${session.rules.totalQuestions}`
  );

  const ids = session.bank.questions.map((q) => q.id);
  debugLog(session.id, `Available questions: ${ids.length}`);

  let order = ids;
  if (session.rules.shuffle) {
    order = shuffle(ids);
    debugLog(session.id, `Questions shuffled`);
  }

  const limit =
    typeof session.rules.totalQuestions === "number" &&
    session.rules.totalQuestions > 0
      ? Math.min(session.rules.totalQuestions, order.length)
      : order.length;

  const finalOrder = order.slice(0, limit);
  debugLog(session.id, `Final order: ${finalOrder.length} questions`, {
    order: finalOrder,
  });

  return finalOrder;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getQuestionById(sessionId, qid) {
  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Get question failed: session not found`);
    return null;
  }

  const question = session.bank.questions.find((q) => q.id === qid) || null;
  debugLog(
    sessionId,
    `Get question ${qid}: ${question ? "found" : "not found"}`
  );
  return question;
}

export function getCurrentQuestionForPlayer(sessionId, playerId) {
  debugLog(sessionId, `Getting current question for player ${playerId}`);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Get current question failed: session not found`);
    return null;
  }

  const player = session.players.find((p) => p.id === playerId);
  if (!player || !player.order) {
    debugLog(
      sessionId,
      `Get current question failed: player not found or no order`
    );
    return null;
  }

  const qid = player.order[player.cursor || 0];
  if (!qid) {
    debugLog(
      sessionId,
      `Player ${playerId} has no more questions (cursor=${player.cursor})`
    );
    return null;
  }

  debugLog(
    sessionId,
    `Player ${playerId} current question: ${qid} (cursor=${player.cursor})`
  );
  return getQuestionById(sessionId, qid);
}

export function advancePlayerCursor(sessionId, playerId) {
  debugLog(sessionId, `Advancing player cursor for player ${playerId}`);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Advance cursor failed: session not found`);
    return null;
  }

  const player = session.players.find((p) => p.id === playerId);
  if (!player || !player.order) {
    debugLog(sessionId, `Advance cursor failed: player not found or no order`);
    return null;
  }

  const oldCursor = player.cursor || 0;
  player.cursor = oldCursor + 1;
  const qid = player.order[player.cursor || 0];

  debugLog(
    sessionId,
    `Player ${playerId} cursor: ${oldCursor} -> ${
      player.cursor
    }, next question: ${qid || "none"}`
  );

  if (!qid) {
    debugLog(sessionId, `Player ${playerId} completed all questions`);
    return null;
  }

  return getQuestionById(sessionId, qid);
}

export function getCurrentQuestionForSession(sessionId) {
  debugLog(sessionId, `Getting current question for session`);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Get current question failed: session not found`);
    return null;
  }

  const qid = session.order[session.currentIndex || 0];
  if (!qid) {
    debugLog(
      sessionId,
      `Session has no more questions (currentIndex=${session.currentIndex})`
    );
    return null;
  }

  debugLog(
    sessionId,
    `Session current question: ${qid} (currentIndex=${session.currentIndex})`
  );
  return getQuestionById(sessionId, qid);
}

export function advanceSessionIndex(sessionId) {
  debugLog(sessionId, `Advancing session index`);

  const session = sessions.get(sessionId);
  if (!session) {
    debugLog(sessionId, `Advance session index failed: session not found`);
    return null;
  }

  const oldIndex = session.currentIndex || 0;
  session.currentIndex = oldIndex + 1;
  const qid = session.order[session.currentIndex || 0];

  debugLog(
    sessionId,
    `Session index: ${oldIndex} -> ${session.currentIndex}, next question: ${
      qid || "none"
    }`
  );

  if (!qid) {
    debugLog(sessionId, `Session completed all questions, ending session`);
    endSession(sessionId);
    return null;
  }

  return getQuestionById(sessionId, qid);
}
