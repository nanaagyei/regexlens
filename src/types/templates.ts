/**
 * Template types for built-in regex examples
 */

export type TemplateCategoryId =
  | "validation"
  | "extraction"
  | "code"
  | "advanced"
  | "learning";

export interface RegexTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string;
  flags: string;
  text: string;
  category: TemplateCategoryId;
  notes?: string[];
  tags?: string[];
}

export interface TemplateCategory {
  id: TemplateCategoryId;
  label: string;
}
