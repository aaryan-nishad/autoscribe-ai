import {
  GoogleGenAI,
} from "@google/genai";

import type {
  AIProvider,
  AITextGenerationRequest,
  AITextGenerationResponse,
} from "./types";

class GeminiProvider
  implements AIProvider
{
  private readonly client: GoogleGenAI;

  private readonly model: string;

  constructor() {
    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured.",
      );
    }

    this.client =
      new GoogleGenAI({
        apiKey,
      });

    this.model =
      process.env.GEMINI_MODEL ??
      "gemini-3.5-flash-lite";
  }

  async generate(
    request: AITextGenerationRequest,
  ): Promise<AITextGenerationResponse> {
    const response =
      await this.client.models.generateContent(
        {
          model: this.model,

          contents: [
            {
              role: "user",

              parts: [
                {
                  text:
                    `${request.systemPrompt}\n\n` +
                    `USER REQUEST:\n${request.userPrompt}`,
                },
              ],
            },
          ],
        },
      );

    const text =
      response.text?.trim();

    if (!text) {
      throw new Error(
        "Gemini returned an empty response.",
      );
    }

    return {
      text,
    };
  }
}

export const geminiProvider =
  new GeminiProvider();