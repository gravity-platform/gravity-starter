# GravityAI Plugin Node Development Guide

**Create powerful AI workflow nodes with GravityAI's plugin system**

## 📚 Documentation

### Getting Started

1. **[Quick Start](./01-quick-start.md)** - Templates, setup, and your first node
2. **[Node Types](./02-node-types.md)** - PromiseNode vs CallbackNode decision guide

### Core Concepts

3. **[Implementation Patterns](./03-patterns.md)** - Critical patterns and architecture
4. **[Credential Management](./04-credentials.md)** - Security and authentication
5. **[Config Schema Reference](./06-config-schema.md)** - UI configuration and field types

### Advanced Topics

6. **[Service Connectors](./07-service-connectors.md)** - Inter-node communication
7. **[MCP Services](./08-mcp-services.md)** - AI tool discovery and integration
8. **[Signal Routing](./09-signal-routing.md)** - Workflow execution flow

### Reference

9. **[Troubleshooting](./05-troubleshooting.md)** - Common issues and solutions

---

## 🏗️ Architecture Overview

GravityAI uses a **plugin-based architecture** where nodes are distributed as npm packages:

```
@gravityai-dev/your-node/
├── src/
│   ├── index.ts              # Plugin definition
│   ├── YourNode/
│   │   ├── node/
│   │   │   ├── index.ts      # Node definition
│   │   │   └── executor.ts   # Execution logic
│   │   ├── service/          # Business logic & API calls
│   │   └── util/             # Types & utilities
│   ├── shared/
│   │   └── platform.ts       # Platform dependencies
│   └── credentials/          # Credential definitions
└── package.json
```

## 🎯 Key Principles

| Principle                  | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| **Plugin Pattern**         | Nodes are npm packages that register themselves                 |
| **Separation of Concerns** | Executors handle workflow logic, services handle business logic |
| **Credential Security**    | Services fetch credentials internally, never exposed to nodes   |
| **Signal-Based Routing**   | Edges represent both data flow and control signals              |
| **Service Connectivity**   | Nodes provide and consume services through connectors           |
| **MCP Integration**        | AI nodes discover tools from connected MCP services             |

## � Quick Decision Guide

### Choose Your Node Type

| Use Case                   | Node Type        |
| -------------------------- | ---------------- |
| API call that returns once | **PromiseNode**  |
| Data transformation        | **PromiseNode**  |
| Streaming responses        | **CallbackNode** |
| Processing collections     | **CallbackNode** |
| Long-running tasks         | **CallbackNode** |

### Critical Pattern (Must Follow)

```typescript
// ✅ CORRECT: Dependency injection pattern
import { PromiseNode, type NodeExecutionContext } from "@gravityai-dev/plugin-base";

export default class MyNodeExecutor extends PromiseNode {
  constructor() {
    super("MyNode");
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: MyConfig,
    context: NodeExecutionContext
  ): Promise<MyOutput> {
    // Use injected API - never global state
    const credentialContext = this.buildCredentialContext(context);
    const result = await myService(config, credentialContext, context.api);
    return { __outputs: result };
  }
}
```

## � Real Examples

Reference these published packages for complete implementations:

### PromiseNode Examples

| Package                      | Description            |
| ---------------------------- | ---------------------- |
| `@gravityai-dev/aws-bedrock` | BedrockClaude executor |
| `@gravityai-dev/openai`      | OpenAI completion      |
| `@gravityai-dev/aws-s3`      | S3 file operations     |

### CallbackNode Examples

| Package                 | Description           |
| ----------------------- | --------------------- |
| `@gravityai-dev/ingest` | ApifyResults executor |
| `@gravityai-dev/flow`   | Loop executor         |
| `@gravityai-dev/openai` | OpenAIStream executor |

### Service Connector Examples

| Pattern           | Example                             |
| ----------------- | ----------------------------------- |
| MCP Provider      | PostgresFetch - vector search tools |
| MCP Consumer      | Nova - discovers and uses tools     |
| Embedding Service | OpenAI - text embedding             |

## 🚨 Critical Rules

### Never Override `execute()`

```typescript
// ❌ WRONG
async execute(inputs, context) { ... }

// ✅ CORRECT - implement executeNode() or handleEvent()
protected async executeNode(inputs, config, context) { ... }
```

### Always Wrap Outputs

```typescript
// ❌ WRONG
return { text: "result" };

// ✅ CORRECT
return { __outputs: { text: "result" } };
```

### CallbackNode Completion

```typescript
// ❌ WRONG - outputs are LOST
return { __outputs: {...}, isComplete: true };

// ✅ CORRECT - emit THEN mark complete
emit({ __outputs: { finalResult: data } });
return { isComplete: true };
```

## 🛠️ Development Workflow

1. **Create** your node package with the template structure
2. **Define** your node in `node/index.ts`
3. **Implement** execution logic in `node/executor.ts`
4. **Add** service logic in `service/index.ts`
5. **Register** in plugin `src/index.ts`
6. **Test** with the debug resolver
7. **Publish** to npm

---

**Next**: Start with [Quick Start](./01-quick-start.md) for essential templates
