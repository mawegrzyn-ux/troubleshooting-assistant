import { OpenAI } from "@langchain/openai";

const translator = new OpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export async function translateText(text, targetLang) {
  const prompt = `Translate the following text to ${targetLang}:\n\n${text}`;
  try {
    return await translator.invoke(prompt);
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

export async function detectLanguage(text) {
  const prompt = `Detect the language of the following text. Respond with the ISO 639-1 language code only.\n\n${text}`;
  try {
    const result = await translator.invoke(prompt);
    return result.trim().split(/\s+/)[0].toLowerCase();
  } catch (error) {
    console.error("Language detection error:", error);
    return "en";
  }
}
