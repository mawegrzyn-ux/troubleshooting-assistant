
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
  maxTokens: 500
});

let documents = [];

export async function initStore() {
  const allDocs = [];
  for (let doc of catalog) {
    if (doc.type === "json") {
      const entries = loadJSON(doc.path);
      allDocs.push(...entries);
    }
  }
  documents = await MemoryVectorStore.fromDocuments(
    allDocs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY })
  );
}

function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath);
  const jsonData = JSON.parse(raw);

  return jsonData.map((item) => ({
    pageContent: `Problem: ${item.problem}
Steps: ${item.what_to_try_first.join("\n")}
When to call support: ${item.when_to_call_support}`,
    metadata: {
      system: item.system?.toLowerCase(),
      vendor: item.vendor?.toLowerCase(),
      problem: item.problem?.toLowerCase()
    }
  }));
}

async function detectIntent(input) {
  const prompt = `Classify this message as either "casual", "identify_system", "describe_issue", "resolved", or "other":
Message: "${input}"`;
  const intent = await model.call(prompt);
  return intent.trim().toLowerCase();
}

export async function getChatResponse(input, sessionState = {}) {
  const intent = await detectIntent(input);
  const state = sessionState.state || {
    stage: "init",
    system: null,
    candidates: []
  };

  if (intent === "resolved" || input.toLowerCase().includes("fixed") || input.toLowerCase().includes("solved")) {
    return { text: "Glad to hear it! I've reset the session. Let me know if anything else comes up.", state: { stage: "init", system: null, candidates: [] } };
  }

  if (intent === "casual" && state.stage === "init") {
    return { text: "Hey there! Which system are you having an issue with?", state };
  }

  if (!state.system) {
    state.system = input.toLowerCase();
    state.stage = "waiting_for_issue";
    return { text: `Thanks! What's the issue you're having with the ${state.system}?`, state };
  }

  if (state.stage === "waiting_for_issue") {
    const searchResults = await documents.similaritySearch(input, 3);
    if (!searchResults.length) {
      return { text: "Hmm, I couldn't find anything matching that issue. Could you describe it differently?", state };
    }
    if (searchResults.length === 1) {
      const entry = searchResults[0].pageContent;
      return { text: formatSteps(entry), state };
    } else {
      state.stage = "awaiting_selection";
      state.candidates = searchResults.map((r, i) => ({
        label: `Option ${i + 1}: ${r.metadata.problem}`,
        full: r.pageContent
      }));
      const options = state.candidates.map(c => c.label).join("\n");
      return { text: `I found a few possible issues:\n${options}\n\nWhich one sounds right? Or reply 'none of these'.`, state };
    }
  }

  if (state.stage === "awaiting_selection") {
    const match = state.candidates.find(c => input.toLowerCase().includes(c.label.toLowerCase().split(":")[1].trim()));
    if (match) {
      return { text: formatSteps(match.full), state: { stage: "init", system: null, candidates: [] } };
    } else {
      return { text: "No problem. I recommend escalating this to your support team.", state: { stage: "init", system: null, candidates: [] } };
    }
  }

  return { text: "I'm not quite sure how to help with that. Could you rephrase?", state };
}

function formatSteps(content) {
  const [problemLine, ...rest] = content.split("\n");
  const steps = rest.filter(l => l.toLowerCase().startsWith("step") || l.startsWith("•"));
  const escalation = rest.find(l => l.toLowerCase().startsWith("when to call support"));
  return `${problemLine}\n\nHere's what to try:\n${steps.join("\n")}\n\n${escalation}`;
}
