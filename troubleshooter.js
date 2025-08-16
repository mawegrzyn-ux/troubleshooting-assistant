  import catalog from "./data/catalog.json" with { type: "json" };
import fs from "fs";
import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

dotenv.config();

const model = new OpenAI({
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function detectIntent(input) {
  const prompt = `Determine if this user message is a troubleshooting request or just general conversation.

Message: "${input}"

Answer with only one word: "troubleshooting" or "chat".`;

  const response = await model.call(prompt);
  return response.trim().toLowerCase();
}

async function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath);
  const jsonData = JSON.parse(raw);

  return jsonData.map((item) => ({
    pageContent: `Problem: ${item.problem}
System: ${item.system}
Steps: ${item.what_to_try_first.join("\n")}
When to call support: ${item.when_to_call_support}`,
    metadata: {
      system: item.system?.toLowerCase(),
      vendor: item.vendor?.toLowerCase(),
      problem: item.problem?.toLowerCase(),
    },
  }));
}

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

export async function getTroubleshootingMatches(query) {
  const intent = await detectIntent(query);

  if (intent !== "troubleshooting") {
    // Non-troubleshooting query
    return {
      generalResponse: `Hi there! 👋 I'm your troubleshooting assistant. If you're having an issue with POS, kiosks, or other systems, just describe the problem and I'll help!`,
    };
  }

  const results = await searchDocs(query);

  return {
    matches: results.map((entry) => {
      const lines = entry.pageContent.split("\n").map((l) => l.trim()).filter(Boolean);

      const problem = lines.find((l) => l.toLowerCase().startsWith("problem")) || "";
      const system = lines.find((l) => l.toLowerCase().startsWith("system")) || "";
      const steps = lines.filter((l) =>
        l.startsWith("•") || l.toLowerCase().startsWith("step")
      );
      const support = lines.find((l) =>
        l.toLowerCase().startsWith("when to call support")
      ) || "";

      return {
        problem: problem.replace(/Problem:/i, "").trim(),
        system: system.replace(/System:/i, "").trim(),
        steps: steps.map((s) => s.replace("•", "").trim()),
        support: support.replace(/When to call support:/i, "").trim(),
      };
    }),
  };
}

export async function initStore() {
  // Optional init logic
}
