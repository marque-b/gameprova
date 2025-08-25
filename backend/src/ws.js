import { Server } from "socket.io";
import {
  getSession,
  joinSession,
  submitAnswer,
  startSession,
  updateRules,
  endSession,
  getCurrentQuestionForPlayer,
  advancePlayerCursor,
  getCurrentQuestionForSession,
  advanceSessionIndex,
} from "./sessions/sessionStore.js";

const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

export default function initWs(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  if (DEBUG_LOGS) {
    console.log(`[DEBUG] WebSocket server initialized`);
  }

  // Timers por sessão para modos síncronos
  const syncTimers = new Map();

  function log(sessionId, msg, extra) {
    const ts = new Date().toISOString();
    try {
      // leve e útil para depuração
      console.log(`[${ts}] [session:${sessionId}] ${msg}`, extra ?? "");
    } catch (_) {}
  }

  function debugLog(sessionId, msg, extra) {
    if (DEBUG_LOGS) {
      const ts = new Date().toISOString();
      console.log(`[DEBUG] [${ts}] [session:${sessionId}] ${msg}`, extra ?? "");
    }
  }

  function clearSyncTimer(sessionId) {
    const t = syncTimers.get(sessionId);
    if (t) {
      clearTimeout(t);
      syncTimers.delete(sessionId);
      debugLog(sessionId, `Cleared sync timer`);
    }
  }

  function scheduleSyncAdvance(session) {
    clearSyncTimer(session.id);
    const secs = session?.rules?.perQuestionTimeSec;
    debugLog(
      session.id,
      `Scheduling sync advance with perQuestionTimeSec=${secs}`
    );

    if (typeof secs !== "number" || secs <= 0) {
      debugLog(
        session.id,
        `No timer scheduled - perQuestionTimeSec is not a positive number`
      );
      return;
    }

    const current = getCurrentQuestionForSession(session.id);
    if (!current) {
      debugLog(session.id, `No current question found for timer scheduling`);
      return;
    }

    log(session.id, `Start per-question timer (${secs}s) for q=${current.id}`);
    debugLog(
      session.id,
      `Timer scheduled for question ${current.id} with ${secs} seconds`
    );

    const handle = setTimeout(() => {
      const fresh = getSession(session.id);
      if (!fresh || fresh.profile === "exam") {
        debugLog(
          session.id,
          `Timer elapsed but session not found or is exam profile`
        );
        return;
      }

      const still = getCurrentQuestionForSession(fresh.id);
      if (!still || still.id !== current.id) {
        debugLog(
          session.id,
          `Timer elapsed but question changed or not found. Expected: ${current.id}, Current: ${still?.id}`
        );
        return; // já avançou por respostas
      }

      const delay = fresh.rules?.revealDelaySec || 0;
      log(fresh.id, `Timer elapsed for q=${still.id}, reveal for ${delay}s`);
      debugLog(
        fresh.id,
        `Timer elapsed, starting reveal phase with delay=${delay}s`
      );

      if (delay > 0) {
        debugLog(
          fresh.id,
          `Emitting question:reveal event for question ${still.id}`
        );
        io.to(fresh.id).emit("question:reveal", { questionId: still.id });

        setTimeout(() => {
          // Update ranking after reveal delay
          debugLog(fresh.id, `Updating ranking after timer reveal delay`);
          io.to(fresh.id).emit("ranking:update", publicRanking(fresh));

          const nq = advanceSessionIndex(fresh.id);
          log(fresh.id, `Auto-advance after reveal, next=${nq?.id}`);
          debugLog(
            fresh.id,
            `Reveal delay completed, advancing to next question: ${nq?.id}`
          );

          if (nq) {
            debugLog(fresh.id, `Serving next question: ${nq.id}`);
            io.to(fresh.id).emit("question:serve", publicQuestion(nq));
          } else {
            // Session finished, emit session:finished event
            debugLog(
              fresh.id,
              `Session finished after timer, emitting session:finished`
            );
            io.to(fresh.id).emit("session:finished", {
              ...publicRanking(fresh),
            });

            // Also emit session update with finished status
            const updatedSession = getSession(fresh.id);
            if (updatedSession) {
              debugLog(
                fresh.id,
                `Emitting session:update with finished status`
              );
              io.to(fresh.id).emit(
                "session:update",
                publicSession(updatedSession)
              );
            }
          }

          clearSyncTimer(fresh.id);
          if (nq) scheduleSyncAdvance(fresh);

          // Update session with new currentIndex (only if not finished)
          if (nq) {
            const updatedSession = getSession(fresh.id);
            if (updatedSession) {
              io.to(fresh.id).emit(
                "session:update",
                publicSession(updatedSession)
              );
            }
          }
        }, delay * 1000);
      } else {
        // No reveal delay, update ranking immediately and advance
        debugLog(
          fresh.id,
          `No reveal delay, updating ranking immediately after timer`
        );
        io.to(fresh.id).emit("ranking:update", publicRanking(fresh));

        const nq = advanceSessionIndex(fresh.id);
        log(fresh.id, `Auto-advance (no reveal), next=${nq?.id}`);
        debugLog(
          fresh.id,
          `No reveal delay, advancing immediately to next question: ${nq?.id}`
        );

        if (nq) {
          debugLog(fresh.id, `Serving next question: ${nq.id}`);
          io.to(fresh.id).emit("question:serve", publicQuestion(nq));
        } else {
          // Session finished, emit session:finished event
          debugLog(
            fresh.id,
            `Session finished after timer, emitting session:finished`
          );
          io.to(fresh.id).emit("session:finished", { ...publicRanking(fresh) });

          // Also emit session update with finished status
          const updatedSession = getSession(fresh.id);
          if (updatedSession) {
            debugLog(fresh.id, `Emitting session:update with finished status`);
            io.to(fresh.id).emit(
              "session:update",
              publicSession(updatedSession)
            );
          }
        }

        clearSyncTimer(fresh.id);
        if (nq) scheduleSyncAdvance(fresh);

        // Update session with new currentIndex (only if not finished)
        if (nq) {
          const updatedSession = getSession(fresh.id);
          if (updatedSession) {
            io.to(fresh.id).emit(
              "session:update",
              publicSession(updatedSession)
            );
          }
        }
      }
    }, secs * 1000);

    syncTimers.set(session.id, handle);
    debugLog(session.id, `Timer handle stored: ${handle}`);
  }

  io.on("connection", (socket) => {
    debugLog("system", `New socket connection: ${socket.id}`);

    socket.on("host:join", ({ sessionId }) => {
      debugLog(sessionId, `Host join request: socketId=${socket.id}`);

      const session = getSession(sessionId);
      if (!session) {
        debugLog(sessionId, `Host join failed: session not found`);
        return socket.emit("error:event", { error: "session_not_found" });
      }

      socket.join(session.id);
      socket.data.sessionId = session.id;
      socket.data.isHost = true;

      debugLog(sessionId, `Host successfully joined session: ${session.id}`);
      io.to(session.id).emit("session:update", publicSession(session));
    });

    socket.on("session:join", ({ sessionId, nickname }) => {
      debugLog(
        sessionId,
        `Session join attempt: nickname=${nickname}, socketId=${socket.id}`
      );

      const result = joinSession(sessionId, nickname);
      if (!result) {
        debugLog(sessionId, `Join failed for nickname=${nickname}`);
        return socket.emit("error:event", { error: "join_failed" });
      }

      const { session, player } = result;
      socket.join(session.id);
      socket.join(`player:${player.id}`);
      socket.data.playerId = player.id;
      socket.data.sessionId = session.id;

      log(session.id, `Player joined: ${player.nickname} (${player.id})`);
      debugLog(
        session.id,
        `Player successfully joined: ${player.nickname} (${player.id})`
      );

      io.to(session.id).emit("session:update", publicSession(session));

      // Se sessão já estiver em EXECUÇÃO no perfil exam, envia pergunta individual
      if (session.status === "running" && session.profile === "exam") {
        const q = getCurrentQuestionForPlayer(session.id, player.id);
        if (q) {
          debugLog(
            session.id,
            `Serving exam question to late-joiner: player=${player.id}, question=${q.id}`
          );
          io.to(`player:${player.id}`).emit(
            "question:serve",
            publicQuestion(q)
          );
        }
        log(
          session.id,
          `Serve question to late-joiner p=${player.id} q=${q?.id}`
        );
      }
    });

    socket.on("host:start", ({ sessionId }) => {
      debugLog(sessionId, `Host start request received`);

      const session = getSession(sessionId);
      if (!session) {
        debugLog(sessionId, `Host start failed: session not found`);
        return;
      }

      log(session.id, `Host start. profile=${session.profile}`);
      debugLog(session.id, `Starting session with profile: ${session.profile}`);
      debugLog(session.id, `Session rules before start:`, session.rules);

      startSession(sessionId);

      // Get fresh session after start to ensure we have the latest rules
      const freshSession = getSession(sessionId);
      debugLog(session.id, `Session rules after start:`, freshSession.rules);

      // Serve initial question depending on profile
      if (freshSession.profile === "exam") {
        debugLog(
          freshSession.id,
          `Exam profile: serving individual questions to each player`
        );
        for (const p of freshSession.players) {
          const q = getCurrentQuestionForPlayer(freshSession.id, p.id);
          if (q) {
            debugLog(
              freshSession.id,
              `Serving exam question to player ${p.id}: question ${q.id}`
            );
            io.to(`player:${p.id}`).emit("question:serve", publicQuestion(q));
          }
          log(freshSession.id, `Serve exam question p=${p.id} q=${q?.id}`);
        }
      } else {
        debugLog(
          freshSession.id,
          `Sync profile: serving shared question to all players`
        );
        const q = getCurrentQuestionForSession(freshSession.id);
        if (q) {
          debugLog(freshSession.id, `Serving sync question: ${q.id}`);
          io.to(freshSession.id).emit("question:serve", publicQuestion(q));
          log(freshSession.id, `Serve sync question q=${q.id}`);
        }
        scheduleSyncAdvance(freshSession);
      }

      io.to(freshSession.id).emit(
        "session:update",
        publicSession(freshSession)
      );
      debugLog(freshSession.id, `Session started successfully`);
    });

    socket.on("player:answer", ({ questionId, choiceId, timeMs }) => {
      const { sessionId, playerId } = socket.data || {};
      debugLog(
        sessionId,
        `Player answer received: player=${playerId}, question=${questionId}, choice=${choiceId}, timeMs=${timeMs}`
      );

      const session = getSession(sessionId);
      if (!session) {
        debugLog(sessionId, `Answer failed: session not found`);
        return;
      }

      log(
        session.id,
        `Answer p=${playerId} q=${questionId} choice=${choiceId}`
      );

      // Store answer but don't apply score yet
      submitAnswer(
        sessionId,
        playerId,
        { questionId, choiceId, timeMs },
        false
      );

      // Don't immediately update ranking - wait for reveal stage
      debugLog(
        session.id,
        `Answer submitted successfully, not updating ranking yet`
      );

      // For exam profile, push next question only to this player
      if (session.profile === "exam") {
        debugLog(
          session.id,
          `Exam profile: advancing player cursor for player ${playerId}`
        );
        const nextQ = advancePlayerCursor(session.id, playerId);
        if (nextQ) {
          debugLog(
            session.id,
            `Serving next exam question to player ${playerId}: ${nextQ.id}`
          );
          io.to(`player:${playerId}`).emit(
            "question:serve",
            publicQuestion(nextQ)
          );
        }
        log(session.id, `Exam next for p=${playerId} -> ${nextQ?.id}`);

        // For exam mode, update ranking immediately since there's no reveal stage
        io.to(session.id).emit("ranking:update", publicRanking(session));
      } else {
        // sync mode: if all players answered this question, auto-advance
        const current = getCurrentQuestionForSession(session.id);
        if (current && current.id === questionId) {
          const allAnswered = session.players.every((p) =>
            session.answers.get(p.id)?.has(questionId)
          );

          const answeredCount = session.players.filter((p) =>
            session.answers.get(p.id)?.has(questionId)
          ).length;

          log(
            session.id,
            `Answered count for q=${questionId}: ${answeredCount}/${session.players.length}`
          );
          debugLog(
            session.id,
            `Sync mode: ${answeredCount}/${session.players.length} players answered question ${questionId}`
          );

          if (allAnswered) {
            const delay = session.rules?.revealDelaySec || 0;
            log(
              session.id,
              `All answered q=${questionId}. Reveal for ${delay}s`
            );
            debugLog(
              session.id,
              `All players answered, starting reveal phase with delay=${delay}s`
            );

            if (delay > 0) {
              debugLog(
                session.id,
                `Emitting question:reveal event for question ${questionId}`
              );
              io.to(session.id).emit("question:reveal", { questionId });

              // Update ranking after reveal delay
              setTimeout(() => {
                // Apply scores now that reveal is complete
                const freshSession = getSession(session.id);
                if (freshSession) {
                  // Apply scores for all answers to this question
                  for (const [pId, answerMap] of freshSession.answers) {
                    const answer = answerMap.get(questionId);
                    if (answer && !answer.scoreApplied) {
                      const player = freshSession.players.find(
                        (p) => p.id === pId
                      );
                      if (player) {
                        const question = freshSession.bank.questions.find(
                          (q) => q.id === questionId
                        );
                        const correct = question?.answer === answer.choiceId;

                        // Apply score
                        let delta = correct
                          ? freshSession.rules.pointsCorrect
                          : freshSession.rules.pointsWrong;
                        player.score += delta;
                        answer.scoreApplied = true;

                        debugLog(
                          session.id,
                          `Applied score for player ${pId}: +${delta} (correct: ${correct})`
                        );
                      }
                    }
                  }
                }

                debugLog(session.id, `Updating ranking after reveal delay`);
                io.to(session.id).emit(
                  "ranking:update",
                  publicRanking(freshSession)
                );

                const nq = advanceSessionIndex(session.id);
                log(session.id, `Advance after reveal, next=${nq?.id}`);
                debugLog(
                  session.id,
                  `Reveal delay completed, advancing to next question: ${nq?.id}`
                );

                if (nq) {
                  debugLog(session.id, `Serving next question: ${nq.id}`);
                  io.to(session.id).emit("question:serve", publicQuestion(nq));
                } else {
                  // Session finished, emit session:finished event
                  debugLog(
                    session.id,
                    `Session finished after reveal, emitting session:finished`
                  );
                  io.to(session.id).emit("session:finished", {
                    ...publicRanking(session),
                  });

                  // Also emit session update with finished status
                  const updatedSession = getSession(session.id);
                  if (updatedSession) {
                    debugLog(
                      session.id,
                      `Emitting session:update with finished status`
                    );
                    io.to(session.id).emit(
                      "session:update",
                      publicSession(updatedSession)
                    );
                  }
                }

                // Update session with new currentIndex (only if not finished)
                if (nq) {
                  const updatedSession = getSession(session.id);
                  if (updatedSession) {
                    io.to(session.id).emit(
                      "session:update",
                      publicSession(updatedSession)
                    );
                  }
                  scheduleSyncAdvance(session);
                }
              }, delay * 1000);
            } else {
              // No reveal delay, apply scores immediately and advance
              const freshSession = getSession(session.id);
              if (freshSession) {
                // Apply scores for all answers to this question
                for (const [pId, answerMap] of freshSession.answers) {
                  const answer = answerMap.get(questionId);
                  if (answer && !answer.scoreApplied) {
                    const player = freshSession.players.find(
                      (p) => p.id === pId
                    );
                    if (player) {
                      const question = freshSession.bank.questions.find(
                        (q) => q.id === questionId
                      );
                      const correct = question?.answer === answer.choiceId;

                      // Apply score
                      let delta = correct
                        ? freshSession.rules.pointsCorrect
                        : freshSession.rules.pointsWrong;
                      player.score += delta;
                      answer.scoreApplied = true;

                      debugLog(
                        session.id,
                        `Applied score for player ${pId}: +${delta} (correct: ${correct})`
                      );
                    }
                  }
                }
              }

              debugLog(
                session.id,
                `No reveal delay, updating ranking immediately`
              );
              io.to(session.id).emit(
                "ranking:update",
                publicRanking(freshSession)
              );

              const nq = advanceSessionIndex(session.id);
              log(session.id, `Advance (no reveal), next=${nq?.id}`);
              debugLog(
                session.id,
                `No reveal delay, advancing immediately to next question: ${nq?.id}`
              );

              if (nq) {
                debugLog(session.id, `Serving next question: ${nq.id}`);
                io.to(session.id).emit("question:serve", publicQuestion(nq));
              } else {
                // Session finished, emit session:finished event
                debugLog(
                  session.id,
                  `Session finished after no reveal, emitting session:finished`
                );
                io.to(session.id).emit("session:finished", {
                  ...publicRanking(session),
                });

                // Also emit session update with finished status
                const updatedSession = getSession(session.id);
                if (updatedSession) {
                  debugLog(
                    session.id,
                    `Emitting session:update with finished status`
                  );
                  io.to(session.id).emit(
                    "session:update",
                    publicSession(updatedSession)
                  );
                }
              }

              // Update session with new currentIndex (only if not finished)
              if (nq) {
                const updatedSession = getSession(session.id);
                if (updatedSession) {
                  io.to(session.id).emit(
                    "session:update",
                    publicSession(updatedSession)
                  );
                }
                scheduleSyncAdvance(session);
              }
            }
          }
        }
      }
    });

    socket.on("host:updateRules", ({ sessionId, rules }) => {
      debugLog(sessionId, `Host update rules request:`, rules);

      const session = getSession(sessionId);
      if (!session) {
        debugLog(sessionId, `Update rules failed: session not found`);
        return;
      }

      updateRules(sessionId, rules);
      debugLog(session.id, `Rules updated successfully`);
      io.to(session.id).emit("session:update", publicSession(session));
    });

    socket.on("host:end", ({ sessionId }) => {
      debugLog(sessionId, `Host end session request`);

      const session = getSession(sessionId);
      if (!session) {
        debugLog(sessionId, `End session failed: session not found`);
        return;
      }

      endSession(sessionId);
      debugLog(session.id, `Session ended successfully`);
      io.to(session.id).emit("session:finished", { ...publicRanking(session) });
    });

    socket.on("player:leave", ({ sessionId }) => {
      const { playerId, isHost } = socket.data || {};
      debugLog(
        sessionId,
        `Player leave request: playerId=${playerId}, isHost=${isHost}`
      );

      // Host não deve ser removido como jogador
      if (isHost) {
        debugLog(
          sessionId,
          `Host leave request - not removing from players list`
        );
        return;
      }

      if (sessionId && playerId) {
        const session = getSession(sessionId);
        if (session) {
          const playerIndex = session.players.findIndex(
            (p) => p.id === playerId
          );
          if (playerIndex !== -1) {
            const removedPlayer = session.players.splice(playerIndex, 1)[0];
            log(
              sessionId,
              `Player left manually: ${removedPlayer.nickname} (${playerId})`
            );
            debugLog(
              sessionId,
              `Player manually removed from session: ${removedPlayer.nickname} (${playerId})`
            );

            // Remove player's answers
            session.answers.delete(playerId);

            // Emit updated session to remaining players
            io.to(sessionId).emit("session:update", publicSession(session));
          }
        }
      }
    });

    socket.on("host:next", ({ sessionId }) => {
      debugLog(sessionId, `Host next question request`);

      const session = getSession(sessionId);
      if (!session) {
        debugLog(sessionId, `Next question failed: session not found`);
        return;
      }

      if (session.profile !== "exam") {
        const nextQ = advanceSessionIndex(session.id);
        if (nextQ) {
          debugLog(session.id, `Host forced next question: ${nextQ.id}`);
          io.to(session.id).emit("question:serve", publicQuestion(nextQ));
          log(session.id, `Host forced next -> ${nextQ.id}`);
        } else {
          // Session finished, emit session:finished event
          debugLog(
            session.id,
            `Session finished after host next, emitting session:finished`
          );
          io.to(session.id).emit("session:finished", {
            ...publicRanking(session),
          });

          // Also emit session update with finished status
          const updatedSession = getSession(session.id);
          if (updatedSession) {
            debugLog(
              session.id,
              `Emitting session:update with finished status`
            );
            io.to(session.id).emit(
              "session:update",
              publicSession(updatedSession)
            );
          }
        }
        if (nextQ) scheduleSyncAdvance(session);
      } else {
        debugLog(
          session.id,
          `Host next ignored: exam profile doesn't support manual advancement`
        );
      }
    });

    socket.on("disconnect", () => {
      const { sessionId, playerId, isHost } = socket.data || {};
      debugLog(
        sessionId || "unknown",
        `Socket disconnected: ${socket.id}, playerId: ${playerId}, isHost: ${isHost}`
      );

      // Host não deve ser removido como jogador
      if (isHost) {
        debugLog(
          sessionId,
          `Host disconnected - not removing from players list`
        );
        return;
      }

      if (sessionId && playerId) {
        // Remove player from session
        const session = getSession(sessionId);
        if (session) {
          const playerIndex = session.players.findIndex(
            (p) => p.id === playerId
          );
          if (playerIndex !== -1) {
            const removedPlayer = session.players.splice(playerIndex, 1)[0];
            log(
              sessionId,
              `Player left: ${removedPlayer.nickname} (${playerId})`
            );
            debugLog(
              sessionId,
              `Player removed from session: ${removedPlayer.nickname} (${playerId})`
            );

            // Remove player's answers
            session.answers.delete(playerId);

            // Emit updated session to remaining players
            io.to(sessionId).emit("session:update", publicSession(session));
          }
        }
      }
    });
  });
}

function publicQuestion(q) {
  return {
    id: q.id,
    prompt: q.prompt,
    choices: q.choices,
    answer: q.answer, // Include correct answer for reveal functionality
  };
}

function publicSession(session) {
  return {
    id: session.id,
    status: session.status,
    currentIndex: session.currentIndex,
    rules: session.rules,
    profile: session.profile,
    playersPublic: session.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      streak: p.streak,
    })),
  };
}

function publicRanking(session) {
  return {
    leaderboard: session.players
      .slice()
      .sort((a, b) => b.score - a.score || b.streak - a.streak)
      .map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        streak: p.streak,
      })),
  };
}
