// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded files statically (so you can open them in the browser)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- DB setup ---
const dbPath = path.join(__dirname, "helpdesk.db");
const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',         -- new | in_progress | resolved
    admin_response TEXT,                        -- optional text from admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- Safe migration: add attachment_url column if missing ---
const cols = db.prepare(`PRAGMA table_info(tickets);`).all();
const hasAttachment = cols.some((c) => c.name === "attachment_url");
if (!hasAttachment) {
  db.exec(`ALTER TABLE tickets ADD COLUMN attachment_url TEXT;`);
}

// --- Multer storage for uploads ---
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${(file.originalname || "file").replace(
      /\s+/g,
      "_"
    )}`;
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// --- routes ---
// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Create ticket (now supports file upload: field name = "attachment")
app.post("/api/tickets", upload.single("attachment"), (req, res) => {
  console.log("CT:", req.headers["content-type"]);
  console.log("BODY:", req.body);
  console.log(
    "FILE:",
    req.file && {
      originalname: req.file.originalname,
      filename: req.file.filename,
    }
  );
  const { name, email, description } = req.body || {};
  if (!name || !email || !description) {
    // if user sent multipart but forgot JSON fields, they’re still in req.body (thanks to Express)
    return res
      .status(400)
      .json({ error: "name, email, and description are required" });
  }

  // If a file was uploaded, expose it under /uploads/<filename>
  const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

  const insert = db.prepare(`
    INSERT INTO tickets (name, email, description, attachment_url)
    VALUES (@name, @email, @description, @attachment_url)
  `);
  const info = insert.run({ name, email, description, attachment_url });

  console.log(
    `Would normally send email here with body: New ticket #${info.lastInsertRowid} from ${name} <${email}>`
  );

  const row = db
    .prepare("SELECT * FROM tickets WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(row);
});

// List tickets
app.get("/api/tickets", (req, res) => {
  const rows = db
    .prepare(
      `
    SELECT * FROM tickets
    ORDER BY datetime(created_at) DESC
  `
    )
    .all();
  res.json(rows);
});

// Get one ticket
app.get("/api/tickets/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM tickets WHERE id = ?")
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "ticket not found" });
  res.json(row);
});

// Update status and/or admin_response
app.patch("/api/tickets/:id", (req, res) => {
  const { status, admin_response } = req.body || {};
  const allowed = new Set(["new", "in_progress", "resolved"]);
  if (status && !allowed.has(status)) {
    return res
      .status(400)
      .json({ error: "status must be one of: new | in_progress | resolved" });
  }

  const existing = db
    .prepare("SELECT * FROM tickets WHERE id = ?")
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: "ticket not found" });

  const next = {
    status: status ?? existing.status,
    admin_response: admin_response ?? existing.admin_response,
    id: req.params.id,
  };

  db.prepare(
    `
    UPDATE tickets
    SET status = @status,
        admin_response = @admin_response,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `
  ).run(next);

  if (admin_response && String(admin_response).trim()) {
    console.log(
      `Would normally send email here with body: Response to ticket #${req.params.id}\n\n${admin_response}`
    );
  }

  const updated = db
    .prepare("SELECT * FROM tickets WHERE id = ?")
    .get(req.params.id);
  res.json(updated);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
