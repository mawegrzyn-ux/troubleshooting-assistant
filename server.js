import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { getTroubleshootingAnswer } from "./troubleshooter.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await getTroubleshootingAnswer(message);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3000, () => {
  console.log("Assistant backend running on port 3000");
});
