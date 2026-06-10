# Provider VCR fixtures

These cassettes exercise the real provider adapters in `@tarogo/llms` without
requiring credentials during normal test runs.

Run playback from `sdk/`:

```sh
bun -F @tarogo/llms test:vcr
```

Refresh the cassettes from local provider credentials:

```sh
LLMS_PROVIDER_VCR_RECORD=1 bun -F @tarogo/llms test:vcr
```

Refresh one cassette by provider id or cassette name:

```sh
LLMS_PROVIDER_VCR_RECORD=1 LLMS_PROVIDER_VCR_TARGET=cline bun -F @tarogo/llms test:vcr
```

Record mode prefers the normal Tarogo CLI provider settings path. To use another
file, set `LLMS_PROVIDER_VCR_SETTINGS_PATH=/path/to/providers.json`.
`ANTHROPIC_API_KEY` and `CLINE_API_KEY` can be used without a settings file, but
ChatGPT OAuth needs saved `openai-codex` provider settings. For local Tarogo API
recording, also set `CLINE_ENVIRONMENT=local`.

After recording, the test normalizes dynamic response fields such as response
IDs, encrypted reasoning payloads, prompt cache keys, and safety identifiers.
