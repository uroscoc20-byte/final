import Database from "better-sqlite3";
import path from "path";

const DB_FILE = path.join(process.cwd(), "bot_data.db");

class BotDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_FILE);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_points (
        user_id TEXT PRIMARY KEY,
        points INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS active_tickets (
        channel_id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        requestor_id TEXT NOT NULL,
        helpers TEXT DEFAULT '[]',
        points INTEGER DEFAULT 0,
        random_number INTEGER,
        proof_submitted INTEGER DEFAULT 0,
        proof TEXT,
        embed_message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ticket_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT,
        category TEXT,
        requestor_id TEXT,
        helpers TEXT,
        points_per_helper INTEGER,
        total_points_awarded INTEGER,
        closed_by TEXT,
        closed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  getPoints(userId: string): number {
    const row = this.db.prepare("SELECT points FROM user_points WHERE user_id = ?").get(userId) as { points: number } | undefined;
    return row?.points ?? 0;
  }

  setPoints(userId: string, points: number): void {
    this.db.prepare(
      "INSERT INTO user_points (user_id, points) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET points = excluded.points"
    ).run(userId, points);
  }

  addPoints(userId: string, amount: number): number {
    const current = this.getPoints(userId);
    const newPoints = current + amount;
    this.setPoints(userId, newPoints);
    return newPoints;
  }

  removePoints(userId: string, amount: number): number {
    const current = this.getPoints(userId);
    const newPoints = Math.max(0, current - amount);
    this.setPoints(userId, newPoints);
    return newPoints;
  }

  deleteUserPoints(userId: string): boolean {
    const result = this.db.prepare("DELETE FROM user_points WHERE user_id = ?").run(userId);
    return result.changes > 0;
  }

  resetAllPoints(): void {
    this.db.prepare("DELETE FROM user_points").run();
  }

  getLeaderboard(): Array<{ user_id: string; points: number }> {
    return this.db.prepare("SELECT user_id, points FROM user_points ORDER BY points DESC").all() as Array<{ user_id: string; points: number }>;
  }

  getConfig(key: string): string | null {
    const row = this.db.prepare("SELECT value FROM config WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setConfig(key: string, value: string): void {
    this.db.prepare(
      "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(key, value);
  }

  saveTicket(ticket: {
    channelId: string;
    category: string;
    requestorId: string;
    helpers: string[];
    points: number;
    randomNumber: number;
    proofSubmitted: boolean;
    proof?: string;
    embedMessageId?: string;
  }): void {
    this.db.prepare(`
      INSERT INTO active_tickets (channel_id, category, requestor_id, helpers, points, random_number, proof_submitted, proof, embed_message_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET
        helpers = excluded.helpers,
        proof_submitted = excluded.proof_submitted,
        proof = excluded.proof,
        embed_message_id = excluded.embed_message_id
    `).run(
      ticket.channelId,
      ticket.category,
      ticket.requestorId,
      JSON.stringify(ticket.helpers),
      ticket.points,
      ticket.randomNumber,
      ticket.proofSubmitted ? 1 : 0,
      ticket.proof ?? null,
      ticket.embedMessageId ?? null
    );
  }

  getTicket(channelId: string): {
    channelId: string;
    category: string;
    requestorId: string;
    helpers: string[];
    points: number;
    randomNumber: number;
    proofSubmitted: boolean;
    proof: string | null;
    embedMessageId: string | null;
  } | null {
    const row = this.db.prepare("SELECT * FROM active_tickets WHERE channel_id = ?").get(channelId) as any;
    if (!row) return null;
    return {
      channelId: row.channel_id,
      category: row.category,
      requestorId: row.requestor_id,
      helpers: JSON.parse(row.helpers || "[]"),
      points: row.points,
      randomNumber: row.random_number,
      proofSubmitted: row.proof_submitted === 1,
      proof: row.proof,
      embedMessageId: row.embed_message_id,
    };
  }

  getAllTickets(): Array<{
    channelId: string;
    category: string;
    requestorId: string;
    helpers: string[];
    points: number;
    randomNumber: number;
    proofSubmitted: boolean;
    proof: string | null;
    embedMessageId: string | null;
  }> {
    const rows = this.db.prepare("SELECT * FROM active_tickets").all() as any[];
    return rows.map(row => ({
      channelId: row.channel_id,
      category: row.category,
      requestorId: row.requestor_id,
      helpers: JSON.parse(row.helpers || "[]"),
      points: row.points,
      randomNumber: row.random_number,
      proofSubmitted: row.proof_submitted === 1,
      proof: row.proof,
      embedMessageId: row.embed_message_id,
    }));
  }

  deleteTicket(channelId: string): boolean {
    const result = this.db.prepare("DELETE FROM active_tickets WHERE channel_id = ?").run(channelId);
    return result.changes > 0;
  }

  archiveTicket(ticket: {
    channelId: string;
    category: string;
    requestorId: string;
    helpers: string[];
    pointsPerHelper: number;
    totalPointsAwarded: number;
    closedBy: string;
  }): void {
    this.db.prepare(`
      INSERT INTO ticket_history (channel_id, category, requestor_id, helpers, points_per_helper, total_points_awarded, closed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticket.channelId,
      ticket.category,
      ticket.requestorId,
      JSON.stringify(ticket.helpers),
      ticket.pointsPerHelper,
      ticket.totalPointsAwarded,
      ticket.closedBy
    );
  }
}

export const db = new BotDatabase();
