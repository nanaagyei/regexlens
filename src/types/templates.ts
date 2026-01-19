/**
 * Template types for built-in regex examples
 */

export interface RegexTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string;
  flags: string;
  text: string;
  notes?: string[];
  tags?: string[];
}

export interface TemplateCategory {
  id: string;
  name: string;
  templates: RegexTemplate[];
}
