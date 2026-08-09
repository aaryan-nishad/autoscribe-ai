export type EditorialDecision =
  | "SELECT"
  | "REJECT";

export interface EditorialPolicy {
  minimumScore: number;

  weights: {
    relevance: number;
    significance: number;
    novelty: number;
    timeliness: number;
    evidence: number;
    audienceValue: number;
  };

  interests: string[];

  preferredTopics: string[];

  lowPriorityTopics: string[];

  blacklist: string[];

  opinions: string[];

  rejectionRules: string[];
}

export interface EditorialScore {
  relevance: number;
  significance: number;
  novelty: number;
  timeliness: number;
  evidence: number;
  audienceValue: number;

  totalScore: number;

  decision: EditorialDecision;

  reason: string;
}

/**
 * Structured result returned by the AI editorial reviewer.
 */
export interface AIEditorialReview {
  decision: EditorialDecision;

  score: number;

  relevance: number;

  significance: number;

  novelty: number;

  timeliness: number;

  evidence: number;

  audienceValue: number;

  reason: string;

  keyInsight: string | null;
}
export interface SemanticDuplicateReview {
  isDuplicate: boolean;
  hasMeaningfulNewDevelopment: boolean;
  confidence: number;
  reason: string;
}