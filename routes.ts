import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { client } from "./bot";
import { db } from "./bot/database";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/bot/status", (_req, res) => {
    const isReady = client.isReady();
    const user = client.user;
    
    res.json({
      status: isReady ? "online" : "offline",
      username: user?.username || null,
      discriminator: user?.discriminator || null,
      id: user?.id || null,
      guilds: client.guilds.cache.size,
      uptime: client.uptime || 0,
    });
  });

  app.get("/api/leaderboard", (_req, res) => {
    const leaderboard = db.getLeaderboard();
    res.json(leaderboard);
  });

  app.get("/api/stats", (_req, res) => {
    const leaderboard = db.getLeaderboard();
    const totalPoints = leaderboard.reduce((sum, row) => sum + row.points, 0);
    const totalHelpers = leaderboard.length;
    
    res.json({
      totalPoints,
      totalHelpers,
      topHelper: leaderboard[0] || null,
    });
  });

  return httpServer;
}
