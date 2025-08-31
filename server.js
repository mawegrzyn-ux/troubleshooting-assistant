import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getTroubleshootingResponse, initStore, detectResolutionIntent } from "./troubleshooter.js";
import adminRoutes from "./adminRoutes.js";

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
