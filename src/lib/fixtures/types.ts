/**
 * Fixture schema types (minimal mapping, no schema drift)
 */

export interface FixtureRegex {
  source: string;
  flags: string;
}

export interface FixtureTestExpected {
  behavior: string;
  match_count?: number | null;
  notes?: string;
  may_be_slow?: boolean;
}

export interface FixtureRuntimeInstructions {
  set_lastIndex_sequence?: number[];
  expected_results_sequence?: string[];
}

export interface FixtureTest {
  id: string;
  input: string;
  regex?: FixtureRegex;
  expected: FixtureTestExpected;
  runtime_instructions?: FixtureRuntimeInstructions;
}

export interface FixtureSuite {
  id: string;
  title: string;
  category: string;
  description?: string;
  regex?: FixtureRegex;
  tests: FixtureTest[];
  expected_engine_notes?: string[];
}

export interface FixtureDefaults {
  timeout_ms_browser_worker: number;
  timeout_ms_node: number;
  max_input_preview_chars: number;
  reset_lastIndex_before_each_test: boolean;
}

export interface FixtureRoot {
  fixture_version: string;
  fixture_name: string;
  created_at: string;
  notes?: string[];
  defaults: FixtureDefaults;
  suites: FixtureSuite[];
  agent_instructions?: Record<string, unknown>;
}
