/**
 * Types for the Saved Library feature
 */

export interface Snippet {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SnippetListResponse {
  items: Snippet[];
  next_cursor: string | null;
}

export interface CreateSnippetInput {
  name: string;
  pattern: string;
  flags: string;
  description?: string;
  tags?: string[];
}

export interface UpdateSnippetInput {
  name?: string;
  pattern?: string;
  flags?: string;
  description?: string;
  tags?: string[];
}
