# Implement Azure Foundry / Azure OpenAI compatibility in the codebase

## Goal
Modify the codebase so the existing AI integration can work with an Azure model deployed through Microsoft Foundry / Azure OpenAI, while preserving compatibility with the current provider setup.

This implementation should prefer the **stable OpenAI-compatible `/openai/v1` API** and the standard **`openai` JavaScript SDK**, not the deprecated Azure AI Inference beta SDK.

---

## Important research constraints you must follow

1. **Use the standard `openai` SDK against an Azure base URL**.
   - Microsoft’s current guidance for Azure OpenAI v1 is to use `OpenAI()` with a `baseURL` ending in `/openai/v1/`.
   - Do **not** require `api-version` for this v1 path.
   - Do **not** build this around the deprecated Azure AI Inference beta SDK.

2. **Use the deployment name in requests, not the model catalog ID**.
   - The value passed as `model` must be the Azure deployment name such as `gpt-4.1-mini`, `DeepSeek-V3.1`, etc., exactly as deployed in the portal.

3. **Support both common Azure endpoint patterns**.
   The code should work if the user provides either:
   - Azure OpenAI resource style endpoint:
     - `https://<resource>.openai.azure.com`
   - Foundry project style endpoint:
     - `https://<resource>.services.ai.azure.com/api/projects/<project>`

4. **Normalize the endpoint into a final OpenAI-compatible base URL**.
   Rules:
   - If the configured endpoint already ends with `/openai/v1` or `/openai/v1/`, use it as-is.
   - If it contains `/api/projects/`, append `/openai/v1`.
   - Otherwise append `/openai/v1/`.

5. **Support both auth styles**.
   - Preferred for production: Microsoft Entra ID via `DefaultAzureCredential`.
   - Also support API-key auth for quicker setup / local development.

6. **Be careful about token scope**.
   There is nuance in current Microsoft docs:
   - Azure OpenAI resource examples use scope: `https://cognitiveservices.azure.com/.default`
   - Foundry project quickstart examples use scope: `https://ai.azure.com/.default`

   Because of this, implement:
   - explicit env override: `AZURE_OPENAI_TOKEN_SCOPE`
   - sensible default behavior:
     - if endpoint contains `/api/projects/`, default to `https://ai.azure.com/.default`
     - otherwise default to `https://cognitiveservices.azure.com/.default`

7. **Do not log secrets or raw tokens**.

---

## Deliverables

Please make these changes in the codebase:

### 1) Add Azure provider support to the existing LLM abstraction
If the codebase already has a provider abstraction or factory, extend it to support:
- `azure_openai`
- or `azure_foundry`

Use whichever naming convention matches the current project style, but keep naming consistent.

### 2) Add environment-driven configuration
Add support for these env vars:

```env
AI_PROVIDER=azure_openai

# Required
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=

# Auth mode
AZURE_OPENAI_AUTH_MODE=api_key
# allowed values: api_key | entra

# For api_key mode
AZURE_OPENAI_API_KEY=

# Optional override; code should derive this if omitted
AZURE_OPENAI_BASE_URL=

# Optional override; code should derive this if omitted
AZURE_OPENAI_TOKEN_SCOPE=

# Optional model behavior settings
AZURE_OPENAI_MAX_OUTPUT_TOKENS=
AZURE_OPENAI_TEMPERATURE=
```

Notes:
- `AZURE_OPENAI_ENDPOINT` may be either:
  - `https://<resource>.openai.azure.com`
  - `https://<resource>.services.ai.azure.com/api/projects/<project>`
  - or an already-normalized `/openai/v1` URL
- `AZURE_OPENAI_DEPLOYMENT` must be the **deployment name**, not the raw base model identifier.

### 3) Install required dependencies if missing
Use the minimum set needed:

```bash
npm install openai
npm install @azure/identity
```

Only add packages that are actually needed.

### 4) Implement a reusable Azure client factory
Create or update a helper/factory module that:
- builds normalized base URL
- chooses auth mode
- creates an `OpenAI` client instance
- returns both `client` and `deployment`

### 5) Update existing chat / completion code paths
Wherever the app currently calls the LLM:
- route Azure requests through this client factory
- call either:
  - `client.responses.create(...)` if current architecture is response-oriented, or
  - `client.chat.completions.create(...)` if current architecture is already built around chat completions

Prefer the least disruptive change to the current codebase.

### 6) Add a small health-check or smoke-test path
If the project has an internal diagnostics route / script / CLI test, add a simple Azure test that:
- performs one trivial prompt
- verifies a non-empty text response
- fails with a useful error if auth or endpoint config is wrong

### 7) Update `.env.example` and docs
Document exactly:
- which endpoint to paste
- that deployment name is required
- how to switch auth mode
- common mistakes

---

## Implementation details

### Recommended TypeScript helper
Use a helper close to this shape, adapted to the project’s architecture:

```ts
import OpenAI from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

function normalizeAzureBaseUrl(input: string): string {
  const endpoint = input.trim().replace(/\/+$/, "");

  if (endpoint.endsWith("/openai/v1")) return endpoint;
  if (endpoint.includes("/api/projects/")) return `${endpoint}/openai/v1`;
  return `${endpoint}/openai/v1/`;
}

function resolveAzureTokenScope(endpoint: string): string {
  if (process.env.AZURE_OPENAI_TOKEN_SCOPE?.trim()) {
    return process.env.AZURE_OPENAI_TOKEN_SCOPE.trim();
  }

  return endpoint.includes("/api/projects/")
    ? "https://ai.azure.com/.default"
    : "https://cognitiveservices.azure.com/.default";
}

export function createAzureOpenAIClient() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const authMode = (process.env.AZURE_OPENAI_AUTH_MODE || "api_key").toLowerCase();

  if (!endpoint) throw new Error("Missing AZURE_OPENAI_ENDPOINT");
  if (!deployment) throw new Error("Missing AZURE_OPENAI_DEPLOYMENT");

  const baseURL = process.env.AZURE_OPENAI_BASE_URL?.trim()
    ? process.env.AZURE_OPENAI_BASE_URL.trim()
    : normalizeAzureBaseUrl(endpoint);

  if (authMode === "entra") {
    const tokenScope = resolveAzureTokenScope(endpoint);
    const tokenProvider = getBearerTokenProvider(
      new DefaultAzureCredential(),
      tokenScope,
    );

    return {
      client: new OpenAI({
        baseURL,
        apiKey: tokenProvider,
      }),
      deployment,
      baseURL,
      authMode,
    };
  }

  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing AZURE_OPENAI_API_KEY for api_key auth mode");

  return {
    client: new OpenAI({
      baseURL,
      apiKey,
    }),
    deployment,
    baseURL,
    authMode,
  };
}
```

### Recommended request pattern
If the app already uses a prompt/message abstraction, preserve it and only replace the provider-specific transport.

If the existing app expects plain text output, a reasonable pattern is:

```ts
const { client, deployment } = createAzureOpenAIClient();

const response = await client.responses.create({
  model: deployment,
  input: userPrompt,
  max_output_tokens: Number(process.env.AZURE_OPENAI_MAX_OUTPUT_TOKENS || 800),
});

const text = response.output_text?.trim() || "";
if (!text) {
  throw new Error("Azure returned an empty response");
}

return text;
```

If the codebase already uses chat messages heavily, use this instead:

```ts
const { client, deployment } = createAzureOpenAIClient();

const completion = await client.chat.completions.create({
  model: deployment,
  messages,
  temperature: Number(process.env.AZURE_OPENAI_TEMPERATURE || 0.2),
});

const text = completion.choices?.[0]?.message?.content?.trim() || "";
if (!text) {
  throw new Error("Azure returned an empty chat completion");
}

return text;
```

---

## What to change in the existing codebase

Please inspect the repository and then do the following:

1. Find the current LLM entrypoint / provider factory / AI service.
2. Add Azure support there instead of creating a disconnected parallel implementation.
3. Keep existing providers working.
4. Make Azure selection fully env-driven.
5. Add strong validation errors for misconfiguration.
6. Ensure secrets are never printed in logs.
7. Update docs and `.env.example`.

If the codebase is NestJS, prefer:
- a provider/service for client creation
- config validation in the config module
- no inline SDK construction inside controllers

---

## Common mistakes to avoid

Do **not** do these:

- Do not use the raw model catalog ID as the `model` argument if Azure expects a deployment name.
- Do not keep using deprecated Azure AI Inference beta SDK patterns.
- Do not hardcode `api-version` onto `/openai/v1` calls.
- Do not assume all Azure endpoints are `openai.azure.com`; Foundry project endpoints may be `services.ai.azure.com/api/projects/...`.
- Do not assume a single token scope works for every Azure endpoint style.
- Do not replace the whole AI layer if only a provider adapter is needed.

---

## Acceptance criteria

The task is complete only if all of the following are true:

- Azure can be selected via environment variable.
- The code accepts a Foundry or Azure OpenAI endpoint and normalizes it correctly.
- The code uses the standard `openai` SDK.
- The code supports both `api_key` and `entra` auth modes.
- The code uses deployment name, not raw catalog model ID.
- Existing providers still work.
- `.env.example` and docs are updated.
- A smoke test or verification step exists.

---

## Suggested verification steps

After implementation, verify with one of these configurations.

### Option A — API key mode

```env
AI_PROVIDER=azure_openai
AZURE_OPENAI_AUTH_MODE=api_key
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=<deployment-name>
AZURE_OPENAI_API_KEY=<secret>
```

### Option B — Foundry project + Entra

```env
AI_PROVIDER=azure_openai
AZURE_OPENAI_AUTH_MODE=entra
AZURE_OPENAI_ENDPOINT=https://<resource>.services.ai.azure.com/api/projects/<project>
AZURE_OPENAI_DEPLOYMENT=<deployment-name>
```

Then run the project’s normal test / dev command and verify that a simple prompt returns valid text.

---

## Output format I want from you

After making the changes, respond with:

1. Summary of what files were changed
2. Exact env vars added/updated
3. Any migration notes
4. How to test locally
5. Any unresolved risks or assumptions

