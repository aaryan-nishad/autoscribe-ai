import type { TopicCandidate } from "../sources/types";

export interface PostGenerationInput {
  topic: TopicCandidate;

  editorialDecision: {
    score: number;
    reason: string;
    keyInsight: string | null;
  };
}

export interface GeneratedPost {
  text: string;
  rationale: string;
  sources: string[];
  keyInsight: string | null;
}

export type PostQualityDecision =
  | "APPROVE"
  | "REJECT";

export interface PostQualityReview {
  decision: PostQualityDecision;

  score: number;

  accuracy: number;

  relevance: number;

  technicalValue: number;

  personaFit: number;

  sourceGrounding: number;

  originality: number;

  clarity: number;

  reason: string;

  improvements: string[];
}