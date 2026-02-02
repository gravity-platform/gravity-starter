# ChatGPT Agent Architecture

## Overview

The ChatGPT Agent is an advanced conversational node that combines:

- **ReAct pattern** - Single conversation loop where LLM decides what tools to call
- **MCP tool calling** - Discovers and calls attached MCPs (including Spatial Engine)
- **Streaming & Progress Emission** - Continuous updates via emit() to the chunk output
- **Shared engine** - Reuses `shared/openaiStream` for conversation loop and streaming

## Core Loop: ReAct (Reason → Act → Respond)

The agent runs a **single conversation loop** - there are no predefined tasks or plans. The LLM:

1. **Reasons** about the user's request
2. **Acts** by calling tools (findIntent, readSkill, workflow MCPs)
3. **Responds** when it has enough information

### Design Principles

- **LLM decides** - No hardcoded task decomposition; the LLM chooses what tools to call
- **Single loop** - One conversation with the LLM, not multiple sequential tasks
- **Spatial Engine provides context** - findIntent/discoverRelated return skills, MCPs, and context
- **Skills guide behavior** - When a skill is found, readSkill provides instructions

## Streaming & Progress Emission (V1)

The ChatGPT Agent should **not pause** between intents. Instead, it should provide continuous updates by emitting incremental output to the node's `chunk` output connector.

**Output contract (recommended):**

- **`chunk`**: A live, continuously updated string that includes:
  - progress log lines (task start/end, tool start/end)
  - partial assistant text as it is produced
- **`text`**: The final synthesized response emitted once at the end

This mirrors the proven `OpenAIStream` pattern:

- During execution, call `emit({ __outputs: { chunk: live } })` periodically
- On completion, **emit final output before returning** (so downstream nodes receive `text`)

### Live log format

The agent uses a **single ReAct conversation loop** - the LLM decides what tools to call based on the user's request. There are no predefined tasks or plans.

Keep the progress log minimal and human-readable. Tool feedback includes:

- **What's being called** with the query/intent being searched
- **What was found** summarized by type (skills, tools, context items)

Example:

```
Searching for relevant information...
Found: Complaints Handling, 3 context items
Applying skill: Complaints Handling ✓
```

The progress is designed to be **user-friendly** - no technical jargon, just clear status updates about what the assistant is doing.

See `shared/toolFeedback.ts` for the formatting implementation.

### Emission throttling

Avoid emitting on every tiny update. Use a small character threshold (e.g. ~100 chars) similar to `OpenAIStream/service/streaming/textEmitter.ts`.

- Accumulate output in a `live` string
- On each append, compute `newChars`
- Emit only when `newChars` exceeds the threshold
- Always emit one final time at completion

## Example Flow: Simple Request

```
User: "I need to raise a complaint"

STEP 1: CLASSIFY
  → Short request, single intent → SIMPLE
  → Intents: ["raise a complaint"]

STEP 2: EXECUTE
  Intent: "raise a complaint"

  Spatial Search → Returns:
    • Skills: "complaints-handling"
    • Needs: "Get my complaint resolved", "Feel heard"
    • MCPs: (none matched)

  LLM Execution:
    - Skills injected as instructions
    - Context from needs added
    - Agent responds following skill guidance

  Emit progress log:
  "Starting...
  Plan:
  - Task 1: raise a complaint
  Task 1/1: raise a complaint
  Searching context/tools...
  Done."

STEP 3: SYNTHESIZE
  → Single intent, return response directly

  Emit final response:
  "I'm sorry to hear you're having an issue. I'd like to help resolve this.
   Can you tell me more about what happened?"
```

## Example Flow: Complex Request (Multiple Intents)

```
User: "I need to raise a complaint and speak to someone about it"

STEP 1: CLASSIFY
  → Contains "and", multiple intents → COMPLEX
  → Heuristic extracts intents: ["raise a complaint", "speak to someone about it"]

STEP 2: EXECUTE

  Intent 1: "raise a complaint"
    MCP Discovery → Spatial Engine attached
    LLM calls Spatial Engine with query "raise a complaint"
    Spatial returns mix of: needs, skills, images, MCPs
    LLM uses context to respond with complaint acknowledgment
    Result: "I understand you're frustrated..."

  Intent 2: "speak to someone about it"
    MCP Discovery → Spatial Engine + other MCPs
    LLM calls Spatial Engine with query "speak to someone"
    Spatial returns: MCP "Speak to Real Person", related needs
    LLM calls MCP → Workflow executes handoff
    Result: { handoffInitiated: true }

STEP 3: SYNTHESIZE
  Combine results into coherent response

Agent Response:
  "I understand you're frustrated with our service. I've connected you
   with a member of our team who can help resolve this directly.
   They'll be with you shortly."
```

## Key Concepts

### 1. Core MCPs (Always Available)

The agent always has access to 4 core MCPs provided by the Spatial Engine. These are **context tools** - they gather context (including discovering workflow MCPs) for each task.

#### `findIntent` - Vector Search (Precision Matching)

**Purpose**: Find the EXACT thing the user is asking for.

```typescript
findIntent({ query: "i want to open an account" });
// Returns: [{object_type, title, description, urlLink, similarity_score, skillName?, metadata}]
```

**Returns these object types**:

- **`skill`** - Behavioral instructions (call `readSkill` to get full content)
- **`mcp`** - Workflow MCPs the agent can call to complete tasks
- **`need`** - User needs and context
- **`service`** - Available services
- **`image`** - Visual context

**When to use**:

- User asks a direct question needing a specific answer
- You need to find the right MCP/action for a task
- Finding the best match for what user explicitly asked for

**How it works**: Cosine similarity on 1536D embeddings. Finds content semantically similar to the query text.

#### `discoverRelated` - Spatial Search (Discovery)

**Purpose**: Explore what else might be relevant or interesting.

```typescript
discoverRelated({ query: "account opening" });
// Returns: [{object_type, title, description, distance, metadata}]
```

**Returns the same object types as findIntent** (skills, MCPs, needs, services, images).

**When to use**:

- Suggesting additional relevant options
- "You might also be interested in..."
- Cross-selling or upselling related services
- Exploring a topic area broadly

**How it works**: Searches UMAP space trained on needs. Finds content in the same need-region.

**Key insight**: UMAP encodes need-space, not text-space. Finds things the user didn't explicitly ask for but may want.

#### `readSkill` - Read Full Skill Instructions

**Purpose**: Get complete instructions for a discovered skill.

```typescript
readSkill({ skillName: "complaints-handling" });
// Returns: Full SKILL.md content with metadata, instructions, and available files
```

**When to use**: After `findIntent` or `discoverRelated` returns a skill you need to follow.

**Returns**:

- Metadata (name, description, version, category, triggers)
- Instructions (step-by-step guidance)
- List of available references, scripts, and assets

#### `readSkillFile` - Read Skill Resource Files

**Purpose**: Read additional files referenced by a skill.

```typescript
readSkillFile({ skillName: "complaints-handling", filePath: "references/ESCALATION.md" });
// Returns: File content
```

**When to use**: When skill instructions reference additional files needed to complete the task.

### 2. Workflow MCPs (Discovered at Runtime)

**Workflow MCPs** are discovered at runtime when the agent calls `findIntent` or `discoverRelated`. They are NOT pre-loaded via `getSchema`.

```
getSchema()
  ↓
Returns ONLY 4 core MCPs (no query, no filtering)
  ↓
Agent receives user query
  ↓
Agent creates tasks
  ↓
For each task:
  - Agent calls findIntent/discoverRelated
  - Search returns: skills, needs, AND workflow MCPs
  - Agent calls returned MCPs to complete the task
```

**Workflow MCPs** are different from core MCPs:

- They **complete intents** (trigger workflows, handoffs, transactions)
- They are **returned by findIntent/discoverRelated** as `object_type: "mcp"`
- Calling a workflow MCP typically ends the conversation loop
- Examples: `speakToLiveAgent`, `bankTransfer`, `findCard`, `raiseComplaint`

**Key principle**: The agent decides which MCPs are relevant based on its understanding of the task. There is no pre-filtering of MCPs based on query embedding.

### 3. Spatial Engine as Context MCP

The Spatial Engine is a **context retrieval MCP** that returns semantically relevant objects:

```typescript
// Spatial Engine returns a mix of object types
interface SpatialResult {
  object_type: "skill" | "mcp" | "need" | "service" | "image";
  title: string;
  description: string;
  key_need?: string;
  metadata: any;
  similarity: number;
}

// LLM calls Spatial Engine as a tool, receives context
// Then uses that context to respond or call other MCPs
```

The LLM decides how to use the returned context:

- **Skills** → Behavioral instructions to follow
- **Needs** → User context and requirements
- **MCPs** → Tools it can call to complete tasks
- **Images** → Visual context if relevant

### 4. MCPs as Executable Tools

MCPs are **callable functions** discovered via `discoverMCPTools()`:

```typescript
// MCPs are converted to OpenAI tool format by discoverMCPTools
const tools = mcpSchema.methods.map((method) => ({
  type: "function",
  name: method.name,
  description: method.description,
  parameters: method.input,
}));
```

### 5. MCP Execution = Intent Completion

When a workflow MCP is executed, it typically means the intent is complete:

```typescript
// In toolHandler.ts - workflow MCPs end the conversation
const DATA_TOOLS = ["findIntent", "discoverRelated", "readSkill", "readSkillFile", "getActiveMCPs"];

function hasWorkflowMCP(toolCalls) {
  return toolCalls.some((tc) => !DATA_TOOLS.includes(tc.function.name));
}
```

## MCP Service Connector

The ChatGPT Agent node has a **serviceConnector** named `mcpService`:

```typescript
serviceConnectors: [
  {
    name: "mcpService",
    description: "MCP service connector - automatic schema discovery",
    serviceType: "mcp",
    isService: false, // This node CONSUMES MCP services
  },
],
```

Any node connected via this connector that exposes an MCP service will be discovered via `discoverMCPTools()` and made available to the LLM as callable tools.

**SpatialSearch** is the primary MCP service that provides:

- `findIntent` - Vector search for precision matching (what user actually needs)
- `discoverRelated` - Spatial search for discovery (what else might interest them)
- `readSkill` - Read full skill instructions
- `readSkillFile` - Read skill resource files
- Dynamic MCP discovery - Finds workflow MCPs via UMAP spatial search

```
┌─────────────────────────────────────────────────────┐
│  SpatialSearch (Dictionary Search)                  │
│  ├─ findIntent (vector search - precision)          │
│  ├─ discoverRelated (spatial search - discovery)    │
│  ├─ readSkill, readSkillFile                        │
│  └─ [dynamic MCPs discovered via UMAP search]       │
│     e.g. findCard, speakToLiveAgent, bankTransfer   │
└───────────────────────┬─────────────────────────────┘
                      │  MCP service connector
                      ▼
              ┌─────────────────────┐
              │   ChatGPT Agent     │
              └─────────────────────┘
```

When `getSchema` is called, SpatialSearch:

1. Embeds the user query via `OpenAIEmbeddingService`
2. Transforms to UMAP coordinates
3. Searches dictionary for nearby MCPs within `maxDistance`
4. Returns `findIntent`, `discoverRelated`, `readSkill`, `readSkillFile` + discovered workflow MCPs

No special `spatialSearch.ts` module is needed - the agent uses the standard MCP discovery and execution flow from `shared/openaiStream`.

## Conversation Mode (Multi-Turn Agent)

The ChatGPT Agent can operate in **Conversation Mode** for skills that require back-and-forth interaction with the user. This leverages the CallbackNode pattern to yield execution and wait for user input.

### Conversation Persistence via `previous_response_id`

Conversation state is managed via OpenAI's Responses API using `previous_response_id`. The response ID is stored in Redis with a 30-minute TTL for session management.

#### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  User sends message                                              │
│       ↓                                                          │
│  Check Redis: openai:conv:{workflowId}:{conversationId}:{userId} │
│       ↓                                                          │
│  Found? → Pass previous_response_id to OpenAI                    │
│  Not found? → Fresh conversation                                 │
│       ↓                                                          │
│  OpenAI returns response with responseId                         │
│       ↓                                                          │
│  Save to Redis with 30-min TTL (sliding expiration)              │
└─────────────────────────────────────────────────────────────────┘
```

#### Redis Key Structure

```
Key:   openai:conv:{workflowId}:{conversationId}:{userId}
Value: { lastResponseId: "resp_abc123...", updatedAt: 1706803200000 }
TTL:   30 minutes (resets on each message)
```

#### What `previous_response_id` Preserves

When you pass `previous_response_id`, OpenAI automatically includes the **full conversation chain**:

- All previous user messages
- All previous assistant responses
- All tool calls and their results
- System prompt and instructions
- Reasoning traces

You only need to pass the **new user message** - OpenAI has everything else.

#### Session Timeout (30 minutes)

The 30-minute TTL is a **UX decision**, not a technical limitation:

- OpenAI stores responses for 30 days
- But if a user returns after 30 minutes of inactivity, they likely want a fresh conversation
- The TTL acts as a session boundary
- Each message resets the TTL (sliding expiration)

#### Implementation Location

The conversation state logic is in the **shared streaming service** (`shared/openaiStream/streamingRefactored.ts`), so both `OpenAIStream` and `ChatGPTAgent` nodes use it automatically.

```typescript
// In streamingRefactored.ts
const redis = executionContext?.api?.getRedisClient?.();
const convKey = { workflowId, conversationId, userId };

// Get previous response ID
const cached = await redis.get(`openai:conv:${convKey.workflowId}:${convKey.conversationId}:${convKey.userId}`);
if (cached) {
  config.previousResponseId = JSON.parse(cached).lastResponseId;
}

// After response, save new response ID
await redis.setex(redisKey, 30 * 60, JSON.stringify({ lastResponseId: result.responseId }));
```

#### Alternative: Conversations API

The [Conversations API](https://platform.openai.com/docs/api-reference/conversations) offers indefinite persistence (no TTL) but requires:

1. Creating a conversation first (`POST /v1/conversations`)
2. Storing the mapping: your ID → OpenAI's `conv_xxx`
3. Using `conversation` parameter instead of `previous_response_id`

Current implementation uses `previous_response_id` for simplicity.

### Focus Mode 2.0 - Signal-Based

Focus Mode **always** sends messages to the focused node via `/signal`. It never starts a new workflow.

**Focus Mode provides:**

- `focusedComponentId` - the focused node
- `executionId` - from workflow subscription
- `chatId` - stable anchor for the session

**Flow:**

```
Focus Mode activated (focusedComponentId = any node)
    ↓
User sends message
    ↓
POST /signal { executionId, nodeId: focusedComponentId, type: "CONTINUE", inputs }
    ↓
Node receives event → handles it however it wants
    ↓
Repeat
```

**Key principles:**

- **Just send the signal** - It's a state machine, the node handles the event
- **Any node can receive signals** - Callback nodes, UI components, anything
- **No special cases** - No "is execution running?" checks, no fallbacks
- **Legacy**: The old trigger-based routing (`targetTriggerNode`) is legacy

### Signal Delivery API

**`POST /signal`** - Send any event to any node in a running execution.

```typescript
POST /signal
{
  executionId: "...",   // From workflow subscription
  nodeId: "...",        // From focusedComponentId
  type: "CONTINUE",     // Any event type (EXECUTE, CONTINUE, custom, etc.)
  inputs: { continue: "user's follow-up message" }
}
```

**This is not callback-node specific.** Any node can receive any event. The node decides how to handle it.

The state machine routes the event:

```typescript
actor.send({ type, nodeId, inputs });
```

### Agent State

```typescript
interface ChatGPTAgentState {
  chunk: string;
  text: string;
  reasoning?: string;
  hasStartedStreaming?: boolean;
  responseId?: string; // OpenAI response ID for multi-turn persistence
}
```

### Agent Output

```typescript
interface ChatGPTAgentOutput {
  __outputs: {
    chunk: string;
    text: string;
    progress?: string;
    reasoning?: string; // Model reasoning/thinking (captured for analytics)
    responseId?: string; // OpenAI response ID for multi-turn
    focusInputRequired?: boolean; // True = yield, wait for CONTINUE
  };
}
```

### Yield Timeout

Callback nodes that yield (don't return `isComplete: true`) have a **10-minute timeout**. If no signal is received within 10 minutes, the node auto-completes.

This prevents abandoned Focus Mode sessions from keeping actors alive indefinitely.

```typescript
// In CallbackNodeActor.ts
const YIELD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// When node yields (no isComplete):
startYieldTimeout();

// When new event received or node completes:
clearYieldTimeout();
```

### Focus Mode Triggers

Focus Mode can be triggered two ways:

1. **User clicks expand** - User clicks the expand icon on a focusable component
2. **Agent triggers it** - Agent emits `focusOnLoad: true` in component props

```typescript
// Agent can trigger Focus Mode by emitting focusOnLoad
emit({
  __outputs: {
    text: "I need more information...",
    focusInputRequired: true, // Yield, wait for CONTINUE
  },
  // Component props
  focusOnLoad: true, // Auto-open Focus Mode
});
```

### Signal Flow

**Signals are just XState events.** Any node can receive any event. The state machine routes them uniformly; the node decides how to handle them.

| Event            | Common Usage                 |
| ---------------- | ---------------------------- |
| `EXECUTE`        | Start executing - first time |
| `CONTINUE`       | Resume with new input        |
| `SPAWN`          | Create actor                 |
| Any custom event | Node-specific behavior       |

**Key insight**: All events are routed the same way. The node interprets them based on its implementation.

```typescript
// State machine routes all events the same way
actor.send({ type: "EXECUTE", nodeId, inputs })
actor.send({ type: "CONTINUE", nodeId, inputs })
actor.send({ type: "MY_CUSTOM_EVENT", nodeId, inputs })

// Node handles based on event type
async handleEvent(event, state, emit) {
  switch (event.type) {
    case "EXECUTE":
      // First run
      break;
    case "CONTINUE":
      // Resume with new input
      break;
  }
}
```

**This is not callback-node specific.** The `/signal` endpoint can send any event to any node type.

### Agent handleEvent

The agent handles both EXECUTE and CONTINUE events:

```typescript
async handleEvent(event, state, emit) {
  // CONTINUE - user sent a follow-up via Focus Mode
  if (event.type === "CONTINUE") {
    const result = await runChatGPTAgentCallback(
      { ...config, prompt: event.inputs.continue },
      ...,
      state.responseId,  // Pass previous responseId for context
    );
    emit(result);

    if (result.__outputs?.focusInputRequired) {
      return { ...state, responseId: result.__outputs.responseId };  // Yield
    }
    return { ...state, responseId: result.__outputs.responseId, isComplete: true };
  }

  // EXECUTE - first run
  const result = await runChatGPTAgentCallback(config, ...);
  emit(result);

  if (result.__outputs?.focusInputRequired) {
    return { ...state, responseId: result.__outputs.responseId };  // Yield
  }
  return { ...state, responseId: result.__outputs.responseId, isComplete: true };
}
```

## Memory Integration (Future)

Memory is not yet implemented. Future versions may add:

- Conversation memory persistence
- User preference tracking
- Fact extraction

## Comparison: OpenAIStream vs ChatGPT Agent

| Feature             | OpenAIStream                | ChatGPT Agent                    |
| ------------------- | --------------------------- | -------------------------------- |
| Task decomposition  | ❌ No                       | ✅ Yes                           |
| Skills              | ✅ Yes (via spatial search) | ✅ Yes (via spatial search)      |
| Memory              | ❌ No                       | ❌ Not yet (planned)             |
| Spatial search      | ✅ Yes                      | ✅ Yes (per-intent)              |
| Loop type           | Tool-call loop              | Classify → Execute → Synthesize  |
| MCP discovery       | At start                    | Per intent                       |
| Complexity handling | ❌ No                       | ✅ Yes - simple vs complex paths |

## Directory Structure

```
ChatGPTAgent/
├── ARCHITECTURE.md          # This file
├── node/
│   ├── index.ts             # Node definition + exports
│   └── executor.ts          # CallbackNode executor
├── service/
│   ├── index.ts             # Barrel export
│   └── runChatGPTAgent.ts   # Core Classify → Execute → Synthesize loop
└── util/
    └── types.ts             # TypeScript interfaces

Shared modules (in src/shared/):
├── openaiStream/            # Canonical streaming engine
├── openaiStreamEngine.ts    # Facade re-export
├── intentHelpers.ts         # classifyIsComplex, extractIntentsHeuristic
└── progressChunkEmitter.ts  # Throttled chunk emission
```

## Loop Safety

The ChatGPT Agent has **multi-layer loop protection** to prevent infinite loops and runaway iterations:

### Layer 1: Conversation Loop (`conversationLoop.ts`)

| Safeguard       | Default   | Description                                         |
| --------------- | --------- | --------------------------------------------------- |
| `maxIterations` | 10-20     | Hard cap on tool-call iterations (set by ambition)  |
| `timeoutMs`     | 2 min     | Timeout for entire conversation loop                |
| Stuck detection | 3 repeats | Exits if same tool calls repeat 3 times in a row    |
| No tool calls   | -         | Natural exit when LLM stops calling tools           |
| Workflow MCP    | -         | Exits when workflow MCP is called (intent complete) |

### Layer 2: Agent Run (`runChatGPTAgent.ts`)

| Safeguard              | Default | Description                                           |
| ---------------------- | ------- | ----------------------------------------------------- |
| `CONVERSATION_TIMEOUT` | 2 min   | Timeout passed to conversation loop                   |
| `ambition` setting     | medium  | Controls maxIterations: small=10, medium=15, large=20 |

### Layer 3: Executor (`executor.ts`)

| Safeguard            | Default | Description                                    |
| -------------------- | ------- | ---------------------------------------------- |
| `MAX_CONTINUE_COUNT` | 50      | Max CONTINUE signals before forcing completion |
| `SESSION_TIMEOUT_MS` | 30 min  | Max session duration from first EXECUTE        |
| Duplicate EXECUTE    | -       | Ignores duplicate EXECUTE if already streaming |

### Layer 4: CallbackNode Framework

| Safeguard     | Default | Description                          |
| ------------- | ------- | ------------------------------------ |
| Yield timeout | 10 min  | Auto-completes if no signal received |

### Ambition Settings

The `ambition` config controls task decomposition depth:

```typescript
const ambitionSettings = {
  small: { maxTasks: 5, maxIterations: 10 },
  medium: { maxTasks: 10, maxIterations: 15 },
  large: { maxTasks: 20, maxIterations: 20 },
};
```

### Stuck Loop Detection

The conversation loop detects when the LLM is stuck calling the same **workflow MCPs** repeatedly.

**Data tools are excluded** - `findIntent`, `discoverRelated`, `readSkill`, `readSkillFile`, `getActiveMCPs` can be called multiple times as the LLM gathers context. This is normal behavior.

**Only workflow MCPs trigger stuck detection** - If the same workflow MCP (e.g., `speakToLiveAgent`, `bankTransfer`) is called with the same arguments 3 times in a row, the loop exits.

```typescript
// Only check workflow MCPs (exclude data tools)
const workflowCalls = toolCalls.filter((tc) => !DATA_TOOLS.includes(tc.function.name));
if (workflowCalls.length === 0) return ""; // No stuck detection for data-only iterations

const signature = workflowCalls
  .map((tc) => `${tc.name}:${tc.arguments}`)
  .sort()
  .join("|");

// If same workflow signature 3 times in a row → exit
if (signature === lastSignature) {
  repeatedCount++;
  if (repeatedCount >= 3) break;
}
```

## Configuration

```typescript
interface ChatGPTAgentConfig {
  // OpenAI settings
  model: string;
  maxTokens?: number;

  // Agent settings
  maxTasks?: number; // Max tasks in queue (default: 10)
  maxIterations?: number; // Max loop iterations (default: 20)

  // Spatial search settings
  skillLimit?: number; // Max skills per search (default: 3)
  mcpLimit?: number; // Max MCPs per search (default: 5)
  contextLimit?: number; // Max context items (default: 10)

  // Memory settings
  enableMemory?: boolean; // Enable conversation memory
  memoryScope?: "conversation" | "user" | "workflow";

  // Prompts
  systemPrompt?: string; // Base system prompt
  taskDecompositionPrompt?: string; // How to break down requests
}
```

## Implementation Status

| Feature                  | Status                               |
| ------------------------ | ------------------------------------ |
| Node definition          | ✅ Complete                          |
| Executor (CallbackNode)  | ✅ Complete                          |
| Intent classification    | ✅ Heuristic-based                   |
| Intent extraction        | ✅ Heuristic-based                   |
| Progress emission        | ✅ Via progressChunkEmitter          |
| MCP discovery            | ✅ Via shared/openaiStream           |
| MCP execution            | ✅ Via runConversationLoop           |
| Spatial Engine           | ✅ Attached as MCP                   |
| Conversation Mode        | ✅ Complete (previous_response_id)   |
| Skills injection         | ✅ Via readSkill/readSkillFile tools |
| Loop Safety              | ✅ Multi-layer protection            |
| Memory                   | ❌ Not implemented                   |
| LLM-based classification | ❌ Using heuristics                  |

## Next Steps

1. **Memory** - Conversation/user memory persistence
   - Store conversation summaries
   - User preference tracking
   - Fact extraction and retrieval
2. **LLM-based classification** - Replace heuristics with LLM call
   - More accurate intent detection for complex requests
   - Better handling of ambiguous queries

## References

- [OpenAI Codex Skills](https://developers.openai.com/codex/skills/)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Gravity Platform Skills Architecture](../../../skills/SKILLS_ARCHITECTURE.md)
