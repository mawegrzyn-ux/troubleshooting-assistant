import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAI } from "langchain/llms/openai";
import dotenv from "dotenv";

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
  return JSON.stringify(jsonData, null, 2);
}

// --- Search Function ---

async function searchDocs(query) {
  // For now, load all docs from catalog
  let combinedTexts = [];

  for (let doc of catalog) {
    let text;
    if (doc.type === "json") {
      text = await loadJSON(doc.path);
    }
    combinedTexts.push(text);
  }

  const vectorStore = await MemoryVectorStore.fromTexts(
    combinedTexts,
    catalog,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY })
  );

  const results = await vectorStore.similaritySearch(query, 3);
  return results.map(r => r.pageContent);
}

// --- Main Answer Function ---

const model = new OpenAI({
  temperature: 0.2,
  openAIApiKey: process.env.OPENAI_API_KEY
});

export async function getTroubleshootingAnswer(query) {
  const results = await searchDocs(query);
  const context = results.join("\n\n");

  const prompt = `You are a troubleshooting assistant. 
Use ONLY the context provided to answer the question.
If the answer is not in the context, reply: "I don’t know, please contact support."

Context:
${context}

Question: ${query}`;

  return await model.call(prompt);
}
