import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";

dotenv.config();

const translator = new OpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export async function translateText(text, targetLang) {
  const prompt = `Translate the following text to ${targetLang}:\n\n${text}`;
  return await translator.call(prompt);
}
