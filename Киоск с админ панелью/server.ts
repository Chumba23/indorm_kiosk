import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password123";
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public", "docs"));
  },
  filename: (req, file, cb) => {
    // Keep original filename but make sure it's safe
    const safeName = file.originalname.replace(/[^a-z0-9а-яё\.\-\s]/gi, "_");
    cb(null, safeName);
  },
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure docs directory exists
  try {
    await fs.mkdir(path.join(__dirname, "public", "docs"), { recursive: true });
  } catch (err) {
    console.error("Failed to create docs directory:", err);
  }

  app.use(express.json());
  app.use(cookieParser());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API Routes ---

  // Login
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
      res.cookie("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      return res.json({ success: true });
    }
    res.status(401).json({ error: "Invalid credentials" });
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    res.clearCookie("admin_token");
    res.json({ success: true });
  });

  // Check Auth
  app.get("/api/auth/check", (req, res) => {
    const token = req.cookies.admin_token;
    if (!token) return res.json({ authenticated: false });
    try {
      jwt.verify(token, JWT_SECRET);
      res.json({ authenticated: true });
    } catch (err) {
      res.json({ authenticated: false });
    }
  });

  // Get Catalog
  app.get("/api/catalog", async (req, res) => {
    try {
      const catalogPath = path.join(__dirname, "public", "catalog.json");
      const data = await fs.readFile(catalogPath, "utf-8");
      res.json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ error: "Failed to read catalog" });
    }
  });

  // Update Catalog
  app.post("/api/catalog", authenticate, async (req, res) => {
    try {
      const catalogPath = path.join(__dirname, "public", "catalog.json");
      await fs.writeFile(catalogPath, JSON.stringify(req.body, null, 2), "utf-8");
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save catalog" });
    }
  });

  // File Upload
  app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ 
      success: true, 
      url: `/docs/${req.file.filename}`,
      name: req.file.originalname
    });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
