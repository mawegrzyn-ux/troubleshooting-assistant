import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getTroubleshootingResponse, initStore, detectResolutionIntent } from "./troubleshooter.js";
import adminRoutes from "./adminRoutes.js";
import { translateText, detectLanguage } from "./translator.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, clarifiedSystem, selectedProblem } = req.body;
    const combined = clarifiedSystem ? `${message} on ${clarifiedSystem}` : message;

    const reset = await detectResolutionIntent(combined);
    let response = { text: "" };
    if (!reset) {
      response = await getTroubleshootingResponse(combined, clarifiedSystem, selectedProblem);
    }
    res.json({ ...response, reset });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Translation endpoint
app.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    const translated = await translateText(text, targetLang);
    res.json({ text: translated });
  } catch (err) {
    console.error("Error in /translate:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.post("/detect-language", async (req, res) => {
  try {
    const { text } = req.body;
    const language = await detectLanguage(text);
    res.json({ language });
  } catch (err) {
    console.error("Error in /detect-language:", err);
    res.status(500).json({ error: "Language detection failed" });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend/dist")));
app.use("/api", adminRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

await initStore();
app.listen(3000, () => {
  console.log("Assistant backend + frontend running on port 3000");
});
