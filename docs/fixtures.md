# RegexLens Fixtures

This document describes the built-in test pack fixture for RegexLens.

## Overview

The fixture provides suites of regex patterns and test cases for correctness, performance safety, and environment sanity checks. It is designed for both browser (Web Worker) and Node API usage.

## File Location

The fixture file lives at:

```
data/fixtures/regexlens-fixture-v1.json
```

## Loading

The fixture is served via a read-only API route:

```
GET /api/fixtures/regexlens
```

Returns the full JSON object. Cache headers allow short-lived caching (`max-age=60`).

## Fixture Schema (High Level)

- **fixture_version**, **fixture_name**, **created_at**: Metadata
- **defaults**: Timeout and behavior defaults
  - `timeout_ms_browser_worker`: 75ms — used for fixture test runs in the browser
  - `timeout_ms_node`: 50ms — documented for Node if server-side regex execution is added
  - `reset_lastIndex_before_each_test`: Ensured by creating a new RegExp per test
- **suites**: Array of test suites
  - Each suite has: `id`, `title`, `category`, `regex` (source + flags), `description`, `tests`
  - Category values: `correctness`, `performance_safety`, `environment_sanity`
  - Tests can override the suite-level `regex` (e.g. Unicode suite)
  - Tests have `expected.behavior`: `match`, `no_match`, `timeout_or_no_match`, etc.
  - Some tests include `runtime_instructions` (e.g. `set_lastIndex_sequence` for sticky flag)

## Timeout and Error Handling

- **Worker isolation**: All regex evaluation for user patterns runs in a Web Worker, never on the main thread. This prevents catastrophic backtracking from freezing the UI.
- **Timeout enforcement**: The fixture runner uses `matchWithTimeout` with the fixture timeout (75ms for browser). If the worker does not respond in time, the worker is terminated and the result is `status: "timeout"`.
- **Error surfaces**: RegExp construction errors (e.g. unsupported lookbehind, invalid Unicode escapes) are caught and returned as `status: "error"` with a structured error object. The UI displays these without crashing.

## Catastrophic Backtracking Warning

Patterns like `^(a+)+$` against long non-matching input (e.g. many `a`s followed by `X`) cause exponential backtracking. Without a timeout, they can hang the application. RegexLens mitigates this by:

1. Running regex evaluation only in a Web Worker
2. Enforcing a timeout and terminating the worker if it exceeds the limit
3. Returning a structured timeout result so the user sees a clear message instead of a frozen UI

Do not run such patterns synchronously on the main thread.
