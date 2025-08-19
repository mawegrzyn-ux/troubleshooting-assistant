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

// -----------------------------
// Load troubleshooting docs
// -----------------------------
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

async function searchDocs(query, system = null) {
  let allDocs = [];

  for (let doc of catalog) {
    if (doc.type === "json") {
      const entries = await loadJSON(doc.path);

      const filtered = entries.filter((entry) => {
        const q = query.toLowerCase();
        const matchesSystem = system ? entry.metadata.system === system.toLowerCase() : true;
        return (
          matchesSystem &&
          (q.includes(entry.metadata.system) ||
           q.includes(entry.metadata.vendor) ||
           q.includes(entry.metadata.problem.split(" ")[0]))
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

// -----------------------------
// Intent detection
// -----------------------------
async function detectIntent(message) {
  const prompt = `Classify the following user message as either "casual" or "troubleshooting":

Message: "${message}"

Respond with only one word: casual or troubleshooting.`;

  const intent = await model.call(prompt);
  return intent.trim().toLowerCase();
}

// -----------------------------
// Check if user says issue is resolved
// -----------------------------
export async function detectResolutionIntent(message) {
  const prompt = `Does the following message indicate the user's problem is resolved?

"${message}"

Answer only yes or no.`;

  const reply = await model.call(prompt);
  return reply.toLowerCase().includes("yes");
}

// -----------------------------
// Main entry point
// -----------------------------
export async function getResponse({ message, clarifiedSystem = null }) {
  const intent = await detectIntent(message);
  console.log("Detected intent:", intent);

  // If user says issue is resolved
  const resolved = await detectResolutionIntent(message);
  if (resolved) {
    return {
      text: "✅ I'm glad the issue is resolved! Let me know if you need anything else.",
      reset: true,
    };
  }

  if (intent === "casual") {
    const casualReply = await model.call(`Respond casually and naturally to this user message: "${message}"`);
    return { text: casualReply, reset: false };
  }

  // Otherwise: it's a troubleshooting message
  const results = await searchDocs(message, clarifiedSystem);
  const systems = [
    ...new Set(results.map((doc) => doc.metadata?.system).filter(Boolean)),
  ];

  // Need to clarify system
  if (!clarifiedSystem && systems.length > 1) {
    return {
      needsClarification: true,
      systems,
      message: "Can you tell me which system you're having an issue with?",
    };
  }

  if (results.length === 0) {
    return {
      text: "Hmm, I couldn't find a clear solution for that. Try rephrasing or contact support if the issue persists.",
      reset: false,
    };
  }

  const context = results.map((doc) => doc.pageContent).join("\n\n");

  const response = await model.call(
    `You are a helpful troubleshooting assistant. Based on the info below, respond in friendly, natural language.

Context:
${context}

User issue: "${message}"

Structure your answer with:
- A friendly summary
- What steps the user should try
- When to escalate to support`
  );

  return { text: response, reset: false };
}

export async function initStore() {
  // If needed for future enhancements
}
