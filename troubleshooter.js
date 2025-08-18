import catalog from "./data/catalog.json" with { type: "json" };
import fs from "fs";
import dotenv from "dotenv";
import { OpenAIEmbeddings, OpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

dotenv.config();

const model = new OpenAI({
  temperature: 0.5,
  openAIApiKey: process.env.OPENAI_API_KEY,
  maxTokens: 500,
});

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

export async function detectResolutionIntent(message) {
  const prompt = `Does the following message indicate the user's problem is resolved?\n\n"${message}"\n\nAnswer yes or no.`;
  const reply = await model.call(prompt);
  return reply.toLowerCase().includes("yes");
}

export async function getTroubleshootingResponse(query) {
  const results = await searchDocs(query);

  const systems = [
    ...new Set(
      results
        .map((doc) => doc.metadata?.system)
        .filter((system) => Boolean(system))
    ),
  ];

  const queryLower = query.toLowerCase();
  const detected = systems.filter((sys) => queryLower.includes(sys));

  if (detected.length !== 1) {
    return {
      needsClarification: true,
      systems,
      message: "Can you confirm which system this relates to?",
    };
  }

  const context = results.map((doc) => doc.pageContent).join("\n\n");

  const prompt = `You are a helpful assistant. Use the following troubleshooting info to naturally answer the user's question.

Context:
${context}

User: ${query}`;

  const reply = await model.call(prompt);
  return { text: reply };
}

export async function initStore() {}
