// adminRoutes.js
import express from "express";

import fs from "fs";
import { randomUUID } from "crypto";

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

    const data = readData();
    const newEntry = { id: randomUUID(), ...req.body };
    data.push(newEntry);
    writeData(data);
    res.status(201).json(newEntry);

  } catch (e) {
    res.status(500).json({ error: "Failed to add entry" });
  }
});

// Edit entry by id
router.put("/entries/:id", (req, res) => {
  try {
    const data = readData();
    const id = req.params.id;
    const idx = data.findIndex(entry => entry.id === id);
    if (idx === -1) return res.status(404).json({ error: "Entry not found" });
    data[idx] = { ...req.body, id };
    writeData(data);
    res.json(data[idx]);

  } catch (e) {
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// Delete entry by id
router.delete("/entries/:id", (req, res) => {
  try {
    const data = readData();
    const id = req.params.id;
    const idx = data.findIndex(entry => entry.id === id);
    if (idx === -1) return res.status(404).json({ error: "Entry not found" });
    data.splice(idx, 1);
    writeData(data);
    res.json({ id });

  } catch (e) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

export default router;
