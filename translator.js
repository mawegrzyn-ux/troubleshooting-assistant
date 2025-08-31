import dotenv from "dotenv";
import { OpenAI } from "@langchain/openai";

dotenv.config();

const translator = new OpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export async function translateText(text, targetLang) {
  const prompt = `Translate the following text to ${targetLang}:\n\n${text}`;
  try {
    return await translator.call(prompt);
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}
