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

export async function getTroubleshootingMatches(query) {
  const entries = await searchDocs(query);

  return entries.map(entry => {
    const lines = entry.pageContent.split("\n").map(l => l.trim()).filter(Boolean);

    const problemLine = lines.find(l => l.toLowerCase().startsWith("problem"));
    const stepsLines = lines.filter(l =>
      l.startsWith("•") || l.toLowerCase().startsWith("step")
    );
    const supportLine = lines.find(l =>
      l.toLowerCase().startsWith("when to call support")
    );

    return {
      problem: problemLine?.replace(/Problem:/i, "").trim() || "",
      steps: stepsLines.map(line => line.replace("•", "").trim()),
      support: supportLine?.replace(/When to call support:/i, "").trim() || ""
    };
  });
}
