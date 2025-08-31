// adminRoutes.js
import express from "express";
import { promises as fs } from "fs";
const router = express.Router();

const filePath = "./data/troubleshooting.json"; // Use your real path

async function readData() {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeData(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Get all entries
router.get("/entries", async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to load entries" });
  }
});

// Add new entry
router.post("/entries", async (req, res) => {
  try {
    const data = await readData();
    const newEntry = req.body;
    data.push(newEntry);
    await writeData(data);
    res.status(201).json({ message: "Entry added" });
  } catch (e) {
    res.status(500).json({ error: "Failed to add entry" });
  }
});

// Edit entry by index
router.put("/entries/:index", async (req, res) => {
  try {
    const data = await readData();
    const idx = parseInt(req.params.index);
    if (idx < 0 || idx >= data.length) return res.status(404).json({ error: "Entry not found" });
    data[idx] = req.body;
    await writeData(data);
    res.json({ message: "Entry updated" });
  } catch (e) {
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// Delete entry by index
router.delete("/entries/:index", async (req, res) => {
  try {
    const data = await readData();
    const idx = parseInt(req.params.index);
    if (idx < 0 || idx >= data.length) return res.status(404).json({ error: "Entry not found" });
    data.splice(idx, 1);
    await writeData(data);
    res.json({ message: "Entry deleted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

export default router;
