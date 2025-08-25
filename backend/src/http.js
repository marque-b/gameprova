import { Router } from "express";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  createSession,
  getSession,
  sessions,
} from "./sessions/sessionStore.js";

const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

function debugLog(msg, extra) {
  if (DEBUG_LOGS) {
    const ts = new Date().toISOString();
    console.log(`[DEBUG] [${ts}] [HTTP] ${msg}`, extra ?? "");
  }
}

const dataDir = path.resolve(process.cwd(), "data");

async function listBanks() {
  debugLog(`Listing banks from directory: ${dataDir}`);
  const files = await fs.readdir(dataDir);
  const banks = files
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({
      name: path.basename(f, ".json"),
      file: f,
    }));
  debugLog(`Found ${banks.length} banks:`, banks);
  return banks;
}

export default function registerHttp(app) {
  const router = Router();

  router.get("/api/health", (_req, res) => {
    debugLog(`Health check requested`);
    res.json({ ok: true });
  });

  router.get("/api/banks", async (_req, res) => {
    debugLog(`Banks list requested`);
    try {
      const banks = await listBanks();
      debugLog(`Returning ${banks.length} banks`);
      res.json({ banks });
    } catch (err) {
      debugLog(`Failed to list banks:`, err);
      res
        .status(500)
        .json({ error: "failed_to_list_banks", details: String(err) });
    }
  });

  router.post("/api/sessions", async (req, res) => {
    const { bank, rules, profile } = req.body || {};
    debugLog(`Session creation requested:`, { bank, rules, profile });

    try {
      if (!bank) {
        debugLog(`Session creation failed: bank required`);
        return res.status(400).json({ error: "bank_required" });
      }

      const session = await createSession({
        bankName: bank,
        rules: rules || {},
        profile: profile || "custom",
      });

      const joinUrl = `/join/${session.id}`;
      debugLog(`Session created successfully: ${session.id}`);
      res.json({ sessionId: session.id, joinUrl });
    } catch (err) {
      debugLog(`Session creation failed:`, err);
      res
        .status(500)
        .json({ error: "failed_to_create_session", details: String(err) });
    }
  });

  router.get("/api/sessions", (req, res) => {
    debugLog(`Active sessions list requested`);

    const activeSessions = [];
    for (const [id, session] of sessions.entries()) {
      if (session.status !== "finished") {
        activeSessions.push({
          id: session.id,
          status: session.status,
          playerCount: session.players.length,
          profile: session.profile,
          bank: { name: session.bank?.meta?.name },
          rules: session.rules,
        });
      }
    }

    debugLog(`Returning ${activeSessions.length} active sessions`);
    res.json({ sessions: activeSessions });
  });

  router.get("/api/sessions/:id/state", (req, res) => {
    const sessionId = req.params.id;
    debugLog(`Session state requested: ${sessionId}`);

    const session = getSession(sessionId);
    if (!session) {
      debugLog(`Session not found: ${sessionId}`);
      return res.status(404).json({ error: "not_found" });
    }

    const { id, status, players, rules, profile, bank, currentIndex } = session;
    const response = {
      id,
      status,
      currentIndex,
      players: players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        streak: p.streak,
      })),
      rules,
      profile,
      bank: { name: bank?.meta?.name },
    };

    debugLog(`Returning session state for ${sessionId}:`, response);
    res.json(response);
  });

  router.delete("/api/sessions/:id", (req, res) => {
    const sessionId = req.params.id;
    debugLog(`Session deletion requested: ${sessionId}`);

    const session = sessions.get(sessionId);
    if (!session) {
      debugLog(`Session not found for deletion: ${sessionId}`);
      return res.status(404).json({ error: "not_found" });
    }

    sessions.delete(sessionId);
    debugLog(`Session deleted successfully: ${sessionId}`);
    res.json({ success: true, message: "Session deleted" });
  });

  app.use(router);
}
