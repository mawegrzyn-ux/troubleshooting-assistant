import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {
  getTroubleshootingResponse,
  initStore,
  detectResolutionIntent,
} from "./troubleshooter.js";
import adminRoutes from "./adminRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/chat", async (req, res) => {
  try {
    const { message, clarifiedSystem } = req.body;
    const finalMessage = clarifiedSystem
      ? `${message} on ${clarifiedSystem}`
      : message;

    const shouldReset = await detectResolutionIntent(finalMessage);

    if (shouldReset) {
      return res.json({
        text: "✅ Thanks for confirming. I'm resetting the chat.",
        reset: true,
      });
    }

    const response = await getTroubleshootingResponse(finalMessage);
    res.json(response);
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.use("/api", adminRoutes);
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

initStore().then(() => {
  app.listen(3000, () => {
    console.log("Assistant backend + frontend running on port 3000");
  });
});
