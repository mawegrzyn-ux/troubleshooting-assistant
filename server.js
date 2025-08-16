import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getTroubleshootingMatches, initStore } from "./troubleshooter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Updated Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const results = await getTroubleshootingMatches(message);
    res.json({ results });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Serve frontend build (React)
app.use(express.static(path.join(__dirname, "frontend/dist")));

// React Router fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

// Start server
initStore().then(() => {
  app.listen(3000, () => {
    console.log("Assistant backend + frontend running on port 3000");
  });
});
