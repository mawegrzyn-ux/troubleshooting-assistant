import catalog from "./data/catalog.json" with { type: "json" };
import fs from "fs";
import dotenv from "dotenv";
import { OpenAIEmbeddings, OpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable. Please set it in your .env file.");
  throw new Error("OPENAI_API_KEY is not defined");
}

const model = new OpenAI({
  temperature: 0.5,
  openAIApiKey: process.env.OPENAI_API_KEY,
  maxTokens: 500,
});

let vectorStore;

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
  if (!vectorStore) {
    await initStore();
  }
  return await vectorStore.similaritySearch(query, 5);
}

export async function getTroubleshootingResponse(query, clarifiedSystem = "", selectedProblem = "") {
  const results = await searchDocs(query);

  const problems = results.map(r => r.metadata.problem);
  const uniqueProblems = [...new Set(problems)];
  const systems = [...new Set(results.map(r => r.metadata.system).filter(Boolean))];

  if (!selectedProblem && uniqueProblems.length > 1) {
    return {
      needsProblemSelection: true,
      problems: uniqueProblems,
      message: "I found multiple issues. Can you select the one you're facing?"
    };
  }

  if (!clarifiedSystem && systems.length !== 1) {
    return {
      needsClarification: true,
      systems,
      message: "Can you tell me which system you're having an issue with?"
    };
  }

  const relevant = results.find(r =>
    (r.metadata.problem === selectedProblem || query.toLowerCase().includes(r.metadata.problem))
  ) || results[0];

  const prompt = `You are a helpful assistant. Given the context below, provide natural, clear troubleshooting guidance to help the user.
Context:
${relevant.pageContent}
User: ${query}`;

  const reply = await model.call(prompt);
  return { text: reply };
}

export async function detectResolutionIntent(message) {
  const prompt = `Does the following message indicate the user's problem is resolved?\n\n"${message}"\n\nAnswer yes or no.`;
  const reply = await model.call(prompt);
  return reply.toLowerCase().includes("yes");
}

export async function initStore() {
  let allDocs = [];

  for (let doc of catalog) {
    if (doc.type === "json") {
      const entries = await loadJSON(doc.path);
      allDocs = allDocs.concat(entries);
    }
  }

  vectorStore = await MemoryVectorStore.fromDocuments(
    allDocs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY })
  );
}
