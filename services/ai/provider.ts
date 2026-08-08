import {
  geminiProvider,
} from "./gemini";

import type {
  AIProvider,
} from "./types";

export function getAIProvider():
  AIProvider {
  const provider =
    (
      process.env.AI_PROVIDER ??
      "gemini"
    ).toLowerCase();

  switch (provider) {
    case "gemini":
      return geminiProvider;

    default:
      throw new Error(
        `Unsupported AI provider: ${provider}`,
      );
  }
}