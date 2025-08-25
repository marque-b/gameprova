import express from "express";
import cors from "cors";
import { createServer } from "http";
import registerHttp from "./http.js";
import initWs from "./ws.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HOST = process.env.HOST || "0.0.0.0";
const DEBUG_LOGS = process.env.DEBUG_LOGS === "true";

// Initialize debug logging
if (DEBUG_LOGS) {
  console.log(`[DEBUG] Backend starting with DEBUG_LOGS enabled`);
  console.log(`[DEBUG] Environment: PORT=${PORT}, HOST=${HOST}`);
}

const app = express();
app.use(cors());
app.use(express.json());

// Add debug middleware for HTTP requests
if (DEBUG_LOGS) {
  app.use((req, res, next) => {
    console.log(`[DEBUG] HTTP ${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  });
}

registerHttp(app);

const server = createServer(app);
initWs(server);

server.listen(PORT, HOST, () => {
  console.log(`backend listening on http://${HOST}:${PORT}`);
  if (DEBUG_LOGS) {
    console.log(`[DEBUG] Server started successfully`);
  }
});
