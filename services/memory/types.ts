export interface MemorySearchResult {
  query: string;
  results: MemoryResult[];
}

export interface MemoryResult {
  edgeUuid?: string;
  sourceNode?: string;
  targetNode?: string;
  fact?: string;
  name?: string | null;
  intentMeta?: unknown;
  tier?: string;
}

export interface RememberMemoryInput {
  content: string;
  groupId: string;
}

export interface SearchMemoryInput {
  query: string;
  groupId: string;
  limit?: number;
}

export interface MemoryWriteResult {
  success: boolean;
  episodeName?: string;
  taskId?: string;
}