import process from "node:process"; // Zásadní pro Deno/Node hybrid
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => { // Přidáno podtržítko pro linter
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => { // Přidáno podtržítko pro linter
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

const db = new Database("netbook.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    picture TEXT,
    provider TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT,
    content TEXT,
    image TEXT,
    video TEXT,
    type TEXT,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    privacy TEXT,
    vocal_imprint TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT,
    author_name TEXT,
    text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  // OAuth Routes
  app.get("/api/auth/url", (req, res) => {
    const provider = req.query.provider;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    if (provider === "google") {
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) return res.status(400).json({ error: "Google Client ID not configured" });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${appUrl}/auth/callback`,
        response_type: "code",
        scope: "openid profile email",
        access_type: "offline",
        prompt: "consent"
      });
      res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    } else {
      res.status(400).json({ error: "Unsupported provider" });
    }
  });

  app.get("/auth/callback", (req, res) => {
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: '${req.query.code}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // API Routes
  app.get("/api/posts", (_req, res) => { // Přidáno podtržítko pro linter
    const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    res.json(posts);
  });

  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post("/api/posts", (req, res) => {
    const { id, authorId, content, image, video, type, privacy, vocalImprint } = req.body;
    db.prepare("INSERT INTO posts (id, author_id, content, image, video, type, privacy, vocal_imprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, authorId, content, image, video, type, privacy, vocalImprint);
    res.json({ status: "ok" });
  });

  app.post("/api/users", (req, res) => {
    const { id, name, email, picture, provider } = req.body;
    db.prepare("INSERT OR REPLACE INTO users (id, name, email, picture, provider) VALUES (?, ?, ?, ?, ?)")
      .run(id, name, email, picture, provider);
    res.json({ status: "ok" });
  });

  app.get("/api/posts/:postId/comments", (req, res) => {
    const comments = db.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC").all(req.params.postId);
    res.json(comments);
  });

  app.post("/api/comments", (req, res) => {
    const { id, postId, authorName, text } = req.body;
    db.prepare("INSERT INTO comments (id, post_id, author_name, text) VALUES (?, ?, ?, ?)")
      .run(id, postId, authorName, text);
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => { // Přidáno podtržítko pro linter
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
