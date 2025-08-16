import catalog from "./data/catalog.json" with { type: "json" };
import fs from "fs";
import dotenv from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

dotenv.config();

// --- Load JSON Data (formatted for vector search) ---

async function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath);
  const jsonData = JSON.parse(raw);

  return jsonData.map((item) => ({
    pageContent: `Problem: ${item.problem}
Steps: ${item.what_to_try_first.join("\n")}
When to call support: ${item.when_to_call_support}`,
    metadata: {
      system: item.system?.toLowerCase(),
      vendor: item.vendor?.toLowerCase(),
      problem: item.problem?.toLowerCase(),
    },
  }));
}

// --- Search Function ---

async function searchDocs(query) {
  let allDocs = [];

  for (let doc of catalog) {
    if (doc.type === "json") {
      const entries = await loadJSON(doc.path);

      const filtered = entries.filter((entry) => {
        const q = query.toLowerCase();
        return (
          q.includes(entry.metadata.system) ||
          q.includes(entry.metadata.vendor) ||
          q.includes(entry.metadata.problem.split(" ")[0])
        );
      });

      allDocs = allDocs.concat(filtered.length > 0 ? filtered : entries);
    }
  }

  const vectorStore = await MemoryVectorStore.fromDocuments(
    allDocs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY })
  );

  return await vectorStore.similaritySearch(query, 3);
}

// --- Public API ---

export async function getTroubleshootingMatches(query) {
  const results = await searchDocs(query);

  return results.map((entry) => {
    const lines = entry.pageContent.split("\n").map((l) => l.trim()).filter(Boolean);

    const problem = lines.find((l) => l.toLowerCase().startsWith("problem")) || "";
    const steps = lines.filter((l) =>
      l.startsWith("•") || l.toLowerCase().startsWith("step")
    );
    const support = lines.find((l) =>
      l.toLowerCase().startsWith("when to call support")
    ) || "";

    return {
      problem: problem.replace(/Problem:/i, "").trim(),
      steps: steps.map((s) => s.replace("•", "").trim()),
      support: support.replace(/When to call support:/i, "").trim(),
    };
  });
}

export async function initStore() {
  // Optional init logic if needed later
}
