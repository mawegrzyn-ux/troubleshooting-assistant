// adminRoutes.js
import express from "express";
import fs from "fs";
const router = express.Router();

const filePath = "./data/troubleshooting.json"; // Use your real path

function readData() {
  const raw = fs.readFileSync(filePath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Get all entries
router.get("/entries", (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to load entries" });
  }
});

// Add new entry
router.post("/entries", (req, res) => {
  try {
    const data = readData();
    const newEntry = req.body;
    data.push(newEntry);
    writeData(data);
    res.status(201).json({ message: "Entry added" });
  } catch (e) {
    res.status(500).json({ error: "Failed to add entry" });
  }
});

// Edit entry by index
router.put("/entries/:index", (req, res) => {
  try {
    const data = readData();
    const idx = parseInt(req.params.index);
    if (idx < 0 || idx >= data.length) return res.status(404).json({ error: "Entry not found" });
    data[idx] = req.body;
    writeData(data);
    res.json({ message: "Entry updated" });
  } catch (e) {
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// Delete entry by index
router.delete("/entries/:index", (req, res) => {
  try {
    const data = readData();
    const idx = parseInt(req.params.index);
    if (idx < 0 || idx >= data.length) return res.status(404).json({ error: "Entry not found" });
    data.splice(idx, 1);
    writeData(data);
    res.json({ message: "Entry deleted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

export default router;
