// database.js - SQLite Database Handler

import Database from 'better-sqlite3';

class BotDatabase {
  constructor() {
    this.db = new Database('bot_data.db');
    this.init();
  }

  init() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_points (
        user_id TEXT PRIMARY KEY,
        points INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS active_tickets (
        channel_id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        requestor_id TEXT NOT NULL,
        helpers TEXT DEFAULT '[]',
        points INTEGER DEFAULT 0,
        random_number INTEGER,
        proof_submitted INTEGER DEFAULT 0,
        embed_message_id TEXT,
        in_game_name TEXT,
        concerns TEXT,
        selected_bosses TEXT DEFAULT '[]',
        selected_server TEXT,
        is_closed INTEGER DEFAULT 0,
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

    console.log('✅ Database initialized');
  }

  // ========== POINTS SYSTEM ==========

  getPoints(userId) {
    const stmt = this.db.prepare('SELECT points FROM user_points WHERE user_id = ?');
    const row = stmt.get(userId);
    return row ? row.points : 0;
  }

  addPoints(userId, amount) {
    const current = this.getPoints(userId);
    const newTotal = current + amount;
    this.setPoints(userId, newTotal);
    return newTotal;
  }

  removePoints(userId, amount) {
    const current = this.getPoints(userId);
    const newTotal = Math.max(0, current - amount);
    this.setPoints(userId, newTotal);
    return newTotal;
  }

  setPoints(userId, points) {
    const stmt = this.db.prepare(`
      INSERT INTO user_points (user_id, points) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET points = excluded.points
    `);
    stmt.run(userId, points);
  }

  getLeaderboard(limit = 100) {
    const stmt = this.db.prepare('SELECT user_id, points FROM user_points ORDER BY points DESC LIMIT ?');
    return stmt.all(limit);
  }

  resetAllPoints() {
    this.db.prepare('DELETE FROM user_points').run();
  }

  deleteUserPoints(userId) {
    const stmt = this.db.prepare('DELETE FROM user_points WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  // ========== TICKET SYSTEM ==========

  saveTicket(ticketData) {
    const stmt = this.db.prepare(`
      INSERT INTO active_tickets (
        channel_id, category, requestor_id, helpers, points, random_number,
        proof_submitted, embed_message_id, in_game_name, concerns,
        selected_bosses, selected_server, is_closed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET
        helpers = excluded.helpers,
        proof_submitted = excluded.proof_submitted,
        is_closed = excluded.is_closed
    `);

    stmt.run(
      ticketData.channel_id,
      ticketData.category,
      ticketData.requestor_id,
      JSON.stringify(ticketData.helpers || []),
      ticketData.points || 0,
      ticketData.random_number,
      ticketData.proof_submitted ? 1 : 0,
      ticketData.embed_message_id,
      ticketData.in_game_name,
      ticketData.concerns,
      JSON.stringify(ticketData.selected_bosses || []),
      ticketData.selected_server,
      ticketData.is_closed ? 1 : 0
    );
  }

  getTicket(channelId) {
    const stmt = this.db.prepare('SELECT * FROM active_tickets WHERE channel_id = ?');
    const row = stmt.get(channelId);
    
    if (!row) return null;

    return {
      channel_id: row.channel_id,
      category: row.category,
      requestor_id: row.requestor_id,
      helpers: JSON.parse(row.helpers),
      points: row.points,
      random_number: row.random_number,
      proof_submitted: row.proof_submitted === 1,
      embed_message_id: row.embed_message_id,
      in_game_name: row.in_game_name,
      concerns: row.concerns,
      selected_bosses: JSON.parse(row.selected_bosses),
      selected_server: row.selected_server,
      is_closed: row.is_closed === 1,
      created_at: row.created_at
    };
  }

  getAllActiveTickets() {
    const stmt = this.db.prepare('SELECT * FROM active_tickets WHERE is_closed = 0');
    const rows = stmt.all();
    
    return rows.map(row => ({
      channel_id: row.channel_id,
      category: row.category,
      requestor_id: row.requestor_id,
      helpers: JSON.parse(row.helpers),
      points: row.points,
      random_number: row.random_number,
      proof_submitted: row.proof_submitted === 1,
      embed_message_id: row.embed_message_id,
      in_game_name: row.in_game_name,
      concerns: row.concerns,
      selected_bosses: JSON.parse(row.selected_bosses),
      selected_server: row.selected_server,
      is_closed: row.is_closed === 1,
      created_at: row.created_at
    }));
  }

  saveTicketHistory(historyData) {
    const stmt = this.db.prepare(`
      INSERT INTO ticket_history (
        channel_id, category, requestor_id, helpers,
        points_per_helper, total_points_awarded, closed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      historyData.channel_id,
      historyData.category,
      historyData.requestor_id,
      historyData.helpers,
      historyData.points_per_helper,
      historyData.total_points_awarded,
      historyData.closed_by
    );
  }

  close() {
    this.db.close();
  }
}

export default BotDatabase;