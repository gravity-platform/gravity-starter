# OpenAI Stream Service Architecture Diagram

> **Updated:** February 2026 - GPT-5.2 Responses API + Redis conversation state

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenAI Stream Node                            │
│                    (GPT-5.2 Responses API)                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              streamCompletionCallback()                     │ │
│  │              (streamingRefactored.ts)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│         ┌────────────────────┼────────────────────┐              │
│         ↓                    ↓                    ↓              │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────┐       │
│  │ Redis      │  │ MCP Tool       │  │ OpenAI Client    │       │
│  │ Conv State │  │ Discovery      │  │ (Responses API)  │       │
│  └────────────┘  └────────────────┘  └──────────────────┘       │
│         │                    │                    │              │
│         └────────────────────┼────────────────────┘              │
│                              ↓                                    │
│              ┌──────────────────────────┐                        │
│              │  Conversation Loop       │                        │
│              │  (Multi-Turn + Safety)   │                        │
│              └──────────────────────────┘                        │
│                              │                                    │
│         ┌────────────────────┼────────────────────┐              │
│         ↓                    ↓                    ↓              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐         │
│  │ Stream     │  │ Tool         │  │ Text + Reasoning │         │
│  │ Processor  │  │ Execution    │  │ Emitters         │         │
│  └────────────┘  └──────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INITIALIZATION PHASE                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  Redis: Get conversation state      │
        │  Key: openai:conv:{wf}:{conv}:{user}│
        │  - If found → previousResponseId    │
        │  - If not → fresh conversation      │
        └─────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  discoverMCPTools()                 │
        │  - Returns 4 core MCPs only         │
        │  - findIntent, discoverRelated      │
        │  - readSkill, readSkillFile         │
        │  - Workflow MCPs discovered at      │
        │    runtime via findIntent           │
        └─────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  initializeOpenAIClient()           │
        │  - Fetches credentials              │
        │  - Creates OpenAI client            │
        └─────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  buildInputItems()                  │
        │  - System prompt → instructions     │
        │  - User message (current only)      │
        │  - No history (OpenAI stores it)    │
        └─────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  buildStreamParams()                │
        │  - Model (gpt-5.2, gpt-5-mini, etc) │
        │  - previous_response_id (if any)    │
        │  - reasoning effort/summary         │
        │  - Tools (core MCPs)                │
        └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. CONVERSATION LOOP (Iteration 1...N)                          │
│    Loop Safety: maxIterations=10, timeout=2min, stuck detection │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  openai.responses.create()          │
        │  - stream: true                     │
        │  - previous_response_id (optional)  │
        │  - tools: [core MCPs]               │
        └─────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  for await (event of stream)        │
        │                                     │
        │  ┌───────────────────────────────┐ │
        │  │ Handle event types:           │ │
        │  │ - response.output_text.delta  │ │
        │  │ - response.reasoning.delta    │ │
        │  │ - response.function_call_*    │ │
        │  │ - response.completed          │ │
        │  └───────────────────────────────┘ │
        │                                     │
        │  ┌───────────────────────────────┐ │
        │  │ textEmitter.emitIfNeeded()    │ │
        │  │ reasoningEmitter.emit()       │ │
        │  │ - Emit every ~100 chars       │ │
        │  └───────────────────────────────┘ │
        └─────────────────────────────────────┘
                              │
                              ↓
                    ┌─────────┴─────────┐
                    │ Tool Calls?       │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         Workflow MCP    Data Tools      No Tools
              │               │               │
              ↓               ↓               ↓
    ┌─────────────────┐ ┌───────────┐ ┌──────────────┐
    │ Execute MCP     │ │ Execute   │ │ Conversation │
    │ → Intent done   │ │ Continue  │ │ Complete     │
    │ → Exit loop     │ │ loop      │ └──────────────┘
    └─────────────────┘ └───────────┘
                              │
                              ↓
              ┌───────────────────────────┐
              │ Add tool results to input │
              │ Continue loop             │
              └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 3. FINALIZATION PHASE                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  saveTokenUsage()                   │
        │  - Save to database                 │
        └─────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  Redis: Save conversation state     │
        │  Key: openai:conv:{wf}:{conv}:{user}│
        │  Value: { lastResponseId }          │
        │  TTL: 30 minutes (sliding)          │
        └─────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────┐
        │  Return final output                │
        │  { text, reasoning, responseId }    │
        └─────────────────────────────────────┘
```

## Module Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     streamingRefactored.ts                        │
│                         (Orchestrator)                            │
│  - Redis conversation state (get/set)                             │
│  - Coordinates all modules                                        │
└──────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ uses               │ uses               │ uses
         ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ mcp/            │  │ client/         │  │ streaming/      │
│                 │  │                 │  │                 │
│ toolDiscovery   │  │ openaiClient    │  │ textEmitter     │
│ toolExecution   │  │ (Responses API) │  │ reasoningEmitter│
│ toolHandler     │  │                 │  │ streamProcessor │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              │ all used by
                              ↓
                  ┌─────────────────────┐
                  │ conversation/       │
                  │                     │
                  │ conversationLoop    │
                  │ types               │
                  └─────────────────────┘
```

## Data Flow Through Modules

```
User Input
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Redis: Get conversation state                                │
│ Key: openai:conv:{workflowId}:{conversationId}:{userId}     │
│ Output: previousResponseId (if exists, not expired)         │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ discoverMCPTools()                                          │
│ Input: executionContext                                     │
│ Output: { tools: [4 core MCPs], mcpService }               │
│                                                             │
│ Core MCPs (always available):                               │
│ - findIntent: Vector search (precision matching)            │
│ - discoverRelated: Spatial search (discovery)               │
│ - readSkill: Read skill instructions                        │
│ - readSkillFile: Read skill resource files                  │
│                                                             │
│ Workflow MCPs discovered at runtime via findIntent          │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ buildInputItems()                                           │
│ Input: config (systemPrompt, prompt)                       │
│ Output: inputItems[] (Responses API format)                │
│ Note: No history - OpenAI stores it via previous_response_id│
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ buildStreamParams()                                         │
│ Input: config, inputItems, tools                           │
│ Output: streamParams with:                                  │
│ - model (gpt-5.2, gpt-5-mini, etc)                         │
│ - previous_response_id (for conversation continuity)        │
│ - reasoning effort/summary                                  │
│ - tools (4 core MCPs)                                       │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ runConversationLoop()                                       │
│ Loop Safety: maxIterations=10, timeout=2min, stuck detect   │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Iteration 1                                             ││
│ │   openai.responses.create(streamParams)                 ││
│ │   ↓                                                     ││
│ │   Handle stream events:                                 ││
│ │   - response.output_text.delta → textEmitter            ││
│ │   - response.reasoning.delta → reasoningEmitter         ││
│ │   - response.function_call_* → accumulate tool calls    ││
│ │   ↓                                                     ││
│ │   Tool calls? → executeToolCallsInParallel()            ││
│ │   ↓                                                     ││
│ │   Data tool? → Continue loop                            ││
│ │   Workflow MCP? → Exit loop (intent complete)           ││
│ └─────────────────────────────────────────────────────────┘│
│ Output: { fullText, reasoning, responseId, usage }         │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ saveTokenUsage()                                            │
│ Redis: Save conversation state (30-min TTL)                 │
│ Return { __outputs: { text, reasoning, responseId } }      │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
Final Output to User
```

## Tool Types and Execution

```
┌─────────────────────────────────────────────────────────────┐
│ CORE MCPs (Data Tools) - Continue conversation loop         │
├─────────────────────────────────────────────────────────────┤
│ findIntent      │ Vector search - precision matching        │
│                 │ Returns: skills, MCPs, needs, services    │
├─────────────────┼───────────────────────────────────────────┤
│ discoverRelated │ Spatial search - discovery                │
│                 │ Returns: related content in need-space    │
├─────────────────┼───────────────────────────────────────────┤
│ readSkill       │ Read full skill instructions              │
│                 │ Returns: SKILL.md content + file list     │
├─────────────────┼───────────────────────────────────────────┤
│ readSkillFile   │ Read skill resource files                 │
│                 │ Returns: File content                     │
└─────────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ WORKFLOW MCPs - End conversation loop (intent complete)     │
├─────────────────────────────────────────────────────────────┤
│ Discovered at runtime via findIntent/discoverRelated        │
│ Examples: speakToLiveAgent, bankTransfer, findCard          │
│ Calling these triggers workflows and completes the intent   │
└─────────────────────────────────────────────────────────────┘
```

## Parallel Tool Execution Detail

```
Model calls findIntent to discover context:
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ toolCalls = [                                               │
│   { name: "findIntent", args: { query: "transfer money" } }│
│ ]                                                           │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ executeToolCallsInParallel(toolCalls, mcpService)          │
│                                                             │
│ findIntent returns:                                         │
│ - skill: "bank-transfers" (call readSkill for instructions)│
│ - mcp: "bankTransfer" (workflow MCP to execute transfer)   │
│ - need: "Send money securely"                              │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Data tool (findIntent) → Continue loop                      │
│ Model now has context, may call readSkill or bankTransfer   │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Model calls workflow MCP:                                   │
│ { name: "bankTransfer", args: { amount: 100, to: "..." } } │
└─────────────────────────────────────────────────────────────┘
    │
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Workflow MCP executed → Exit loop (intent complete)         │
└─────────────────────────────────────────────────────────────┘
```

## File Structure Visual

```
shared/openaiStream/
│
├── 📄 streamingRefactored.ts (Orchestrator)
│   ├── Redis conversation state (get/set)
│   ├── Coordinates all modules
│   └── Returns final output
│
├── 📄 index.ts (Public API)
│   └── Exports all public functions and types
│
├── 📁 mcp/ (MCP Tool Integration)
│   ├── 📄 toolDiscovery.ts
│   │   ├── discoverMCPTools()
│   │   └── Returns 4 core MCPs only
│   │
│   ├── 📄 toolExecution.ts
│   │   ├── executeToolCallsInParallel()
│   │   └── executeToolCall() with telemetry
│   │
│   └── 📄 toolHandler.ts
│       ├── hasWorkflowMCP() - detect intent completion
│       └── DATA_TOOLS list (core MCPs)
│
├── 📁 client/ (OpenAI Client - Responses API)
│   └── 📄 openaiClient.ts
│       ├── initializeOpenAIClient()
│       ├── buildInputItems() (not buildMessages)
│       └── buildStreamParams()
│
├── 📁 conversation/ (Conversation Management)
│   ├── 📄 conversationLoop.ts
│   │   └── runConversationLoop()
│   │       ├── Loop safety (maxIterations, timeout)
│   │       ├── Stuck detection (workflow MCPs only)
│   │       └── Multi-turn coordination
│   │
│   └── � types.ts
│       └── ResponseInputItem, ConversationConfig
│
└── � streaming/ (Stream Processing)
    ├── 📄 streamProcessor.ts
    │   └── Process Responses API events
    │
    ├── 📄 textEmitter.ts
    │   └── TextEmitter class (throttled emission)
    │
    └── 📄 reasoningEmitter.ts
        └── ReasoningEmitter class (GPT-5.2 reasoning)
```

## Summary

This architecture provides:

- ✅ **GPT-5.2 Responses API** - Modern streaming with reasoning traces
- ✅ **Redis conversation state** - 30-min TTL session management
- ✅ **Core MCPs** - 4 context tools (findIntent, discoverRelated, readSkill, readSkillFile)
- ✅ **Runtime MCP discovery** - Workflow MCPs discovered via findIntent
- ✅ **Loop safety** - Multi-layer protection (iterations, timeout, stuck detection)
- ✅ **Clear separation** - Each module has one responsibility
- ✅ **Testable** - Each component can be tested independently
