import catalog from "./data/catalog.json" with { type: "json" };
import fs from "fs";
import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

dotenv.config();

// --- Document Loaders ---

async function loadPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function loadWord(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function loadJSON(filePath) {
  const rawData = fs.readFileSync(filePath);
  const jsonData = JSON.parse(rawData);

  return jsonData.map(item => ({
    pageContent: `Problem: ${item.problem}
Steps: ${item.what_to_try_first.join(" ")}
When to call support: ${item.when_to_call_support}`,
    metadata: { 
      system: item.system.toLowerCase(), 
      vendor: item.vendor.toLowerCase(), 
      problem: item.problem.toLowerCase() 
    }
  }));
}

// --- Search Function ---

async function searchDocs(query) {
  let docs = [];

  for (let doc of catalog) {
    if (doc.type === "json") {
      const entries = await loadJSON(doc.path);

      // Filter by metadata if system/vendor words appear in query
      const filtered = entries.filter(entry => {
        const q = query.toLowerCase();
        return (
          q.includes(entry.metadata.system) ||
          q.includes(entry.metadata.vendor) ||
          q.includes(entry.metadata.problem.split(" ")[0]) // quick problem keyword
        );
      });

      docs = docs.concat(filtered.length > 0 ? filtered : entries);
    }
  }

  const vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY })
  );

  const results = await vectorStore.similaritySearch(query, 1);
  return results.map(r => r.pageContent);
}



// --- Main Answer Function ---

const model = new OpenAI({
  temperature: 0.2,
  openAIApiKey: process.env.OPENAI_API_KEY,
  maxTokens: 500
});

export async function getTroubleshootingAnswer(query) {
  const results = await searchDocs(query);
  const context = results.join("\n\n");

const prompt = `You are a troubleshooting assistant. 
Answer the question ONLY using the context below.
Return your answer in this format:
- Problem: <problem>
- Steps:
  • Step 1
  • Step 2
  • Step 3
- When to call support: <support condition>

Context:
${context}

Question: ${query}`;

  return await model.call(prompt);
}
