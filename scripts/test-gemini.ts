import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const model =
    process.env.GEMINI_MODEL ??
    "gemini-3.5-flash-lite";

  console.log("Testing Gemini API...");
  console.log(`Model: ${model}`);

  const response =
    await ai.models.generateContent({
      model,

      contents:
        "In one sentence, explain what an AI agent is.",
    });

  console.log("\nGemini response:");
  console.log(response.text);
}

main().catch((error) => {
  console.error("\nGemini test failed:");
  console.error(error);

  process.exitCode = 1;
});