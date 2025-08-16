import catalog from "./data/catalog.json" with { type: "json" };
import fs from "fs/promises";
import dotenv from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";

dotenv.config();

let vectorStore;

async function loadJSON(path) {
  const raw = await fs.readFile(path, "utf-8");
  const items = JSON.parse(raw);

  return items.map((item) => {
    const content = [
      `System: ${item.System}`,
      `Vendor: ${item.Vendor}`,
      `Problem: ${item.Problem}`,
      `Steps: ${item["What to Try First"]}`,
      `When to call support: ${item["When to Call Support"]}`,
    ].join("\n");

    return new Document({
      pageContent: content,
      metadata: {
        problem: item.Problem,
        steps: item["What to Try First"],
        support: item["When to Call Support"],
      },
    });
  });
}

export async function initStore() {
  const docs = [];

  for (const source of catalog) {
    if (source.type === "json") {
      const entries = await loadJSON(source.path);
      docs.push(...entries);
    }
  }

  vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY })
  );
}

export async function getTroubleshootingMatches(query, maxResults = 3) {
  if (!vectorStore) {
    await initStore();
  }

  const results = await vectorStore.similaritySearch(query, maxResults);

  return results.map((r) => {
    return {
      problem: r.metadata.problem,
      steps: r.metadata.steps
        ?.split("•")
        .map((s) => s.trim())
        .filter(Boolean),
      support: r.metadata.support,
    };
  });
}
