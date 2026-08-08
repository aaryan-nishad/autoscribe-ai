export interface AITextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface AITextGenerationResponse {
  text: string;
}

export interface AIProvider {
  generate(
    request: AITextGenerationRequest,
  ): Promise<AITextGenerationResponse>;
}