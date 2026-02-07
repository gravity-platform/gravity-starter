# Challenge 3: Create Your First Node

Build a custom node to extend the platform.

## Goal

- Understand node structure by reviewing existing nodes
- Learn how credentials work with nodes
- Use your IDE's AI assistant to generate a new node

## Step 1: Review Existing Nodes

Before building your own, study how existing nodes are structured. Review these two examples:

### OpenAI Node (Simple LLM call)

```
packages/openai/src/OpenAI/
├── node/
│   ├── index.ts      # Node definition (inputs, outputs, config schema)
│   └── executor.ts   # Node executor (extends PromiseNode)
├── service/
│   └── queryChatGPT.ts  # Business logic
└── util/
    └── types.ts      # TypeScript types
```

### SearchWeb Node (API integration with credentials)

```
packages/ingest/src/SearchWeb/
├── node/
│   ├── index.ts      # Node definition with credentials
│   └── executor.ts   # Executor using credentials
├── service/
│   └── searchWebService.ts  # API calls
└── util/
    └── types.ts
```

## Step 2: Understand Node Structure

Every node has two parts:

**1. Definition (`node/index.ts`)** - Describes the node:

- `type` - Unique identifier
- `inputs` / `outputs` - Data connectors
- `configSchema` - UI form fields
- `credentials` - Required API keys

**2. Executor (`node/executor.ts`)** - Runs the node:

- Extends `PromiseNode` (or `CallbackNode` for stateful execution)
- `executeNode()` method does the work
- Returns `{ __outputs: { ... } }`

## Step 3: Understand Credentials

Nodes declare credential requirements in the definition:

```typescript
credentials: [
  {
    name: "openAICredential",    // Credential type name
    required: true,
    displayName: "OpenAI API",
    description: "OpenAI API credentials for authentication",
  },
],
```

In the executor, access credentials via context:

```typescript
const credentialContext = this.buildCredentialContext(context);
// Then pass to your service function
```

In the service, retrieve the actual API key:

```typescript
const credentials = await getNodeCredentials(context, "searchapiCredential");
const apiKey = credentials?.apiKey;
```

## Step 4: Use AI to Generate Your Node

The complete node documentation is in `packages/docs/nodes/`. Point your IDE's AI assistant to this folder.

| Document                                            | What You'll Learn           |
| --------------------------------------------------- | --------------------------- |
| [01-quick-start.md](../nodes/01-quick-start.md)     | Create your first node      |
| [02-node-types.md](../nodes/02-node-types.md)       | PromiseNode vs CallbackNode |
| [03-patterns.md](../nodes/03-patterns.md)           | Common patterns             |
| [04-credentials.md](../nodes/04-credentials.md)     | Handling API keys           |
| [06-config-schema.md](../nodes/06-config-schema.md) | Config UI schemas           |

**Prompt your AI assistant:**

> "I want to create a new Gravity node that [describe what it does].
> Use the documentation in `packages/docs/nodes/` and follow the patterns
> from `packages/openai/src/OpenAI/` as a reference.
> Create the node definition, executor, and service files."

## Step 5: Build & Deploy

```bash
npm run build -w @gravity-platform/my-node
docker compose restart node-service workflow
```

> **Tip:** If you haven't run `./gravity dev` yet, do that first — it installs all workspace dependencies.

Your node now appears in Canvas!

## ✅ Challenge Complete

You understand node structure and can generate new nodes with AI assistance. Proceed to [Challenge 4: Ingest Content to Spatial](./04-ingest-content-to-spatial.md).
