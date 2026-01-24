# Signal Routing System

**Understanding how workflow execution flows between nodes**

## Overview

The signal routing system is the core mechanism that controls workflow execution. It uses a **signal-based architecture** where:

- **Edges represent both data flow and control signals**
- **Nodes execute when they receive signals and have required inputs**
- **The route table pre-computes all signal routes for efficient execution**

## Key Concepts

### 1. Route Table

When a workflow loads, a route table is built containing:

```typescript
interface RouteTable {
  // Source node ID → Array of route entries
  routing: Map<string, RouteEntry[]>;

  // Target node ID → Connector name → Array of source node IDs
  connectorDependencies: Map<string, Map<string, string[]>>;

  // Nodes that start execution (e.g., InputTrigger)
  triggerNodes: string[];
}

interface RouteEntry {
  targetNodeId: string;
  signalType: string; // "EXECUTE", "CONTINUE", etc.
  targetHandle?: string; // Which input connector this connects to
}
```

### 2. Signal Types

| Signal     | Purpose                         | Used By               |
| ---------- | ------------------------------- | --------------------- |
| `EXECUTE`  | Primary execution signal        | All nodes (default)   |
| `CONTINUE` | Advance callback node iteration | Loop, streaming nodes |
| `SPAWN`    | Initialize callback node actor  | CallbackNode          |
| `RESET`    | Reset callback node state       | CallbackNode          |

### 3. Node Inputs Structure

When nodes complete, their outputs are stored in a structured format:

```typescript
// nodeInputs[targetNodeId][connectorName][sourceNodeId] = output
type NodeInputs = Record<string, Record<string, Record<string, any>>>;
```

Example:

```javascript
nodeInputs = {
  "pineconeupload1": {
    "metadata": {
      "code2": { url: "example.com", title: "Example" }
    },
    "vector": {
      "bedrockembedding1": [0.1, 0.2, 0.3, ...]
    }
  }
}
```

## Signal Flow Process

### Step 1: Node Completes Execution

When a node completes, it emits a `NODE_OUTPUT` event with its output data.

### Step 2: Route Signals

The `SignalRouterOrchestrator` processes the completion:

1. **Look up routes** in the route table for the completed node
2. **Update nodeInputs** for each downstream node's specific connector
3. **Check readiness** for each downstream node

### Step 3: Readiness Check

A node is ready to execute when **ANY** of its connectors has all required inputs:

```typescript
// For each connector of the target node
for (const [connectorName, requiredSources] of connectorDeps) {
  const connectorInputs = nodeConnectorInputs[connectorName] || {};
  const receivedSources = new Set(Object.keys(connectorInputs));

  // Check if this connector has all its required inputs
  const connectorReady = requiredSources.length === 0 || requiredSources.every((source) => receivedSources.has(source));

  if (connectorReady) {
    // Node can execute!
    break;
  }
}
```

### Step 4: Execute Ready Nodes

When a node is ready, the system sends an `EXECUTE_NODE_WITH_SIGNAL` event.

## Connector Dependencies

### How Connectors Work

Nodes can have multiple input connectors, each representing a different type of input:

```typescript
// Example: PineconeUpload node
inputs: [
  {
    name: "text", // Connector name
    type: NodeInputType.STRING,
    required: true,
  },
  {
    name: "metadata", // Another connector
    type: NodeInputType.OBJECT,
    required: false,
  },
];
```

### Dependency Tracking

The route table tracks dependencies at the connector level:

```typescript
// Example connector dependencies
connectorDependencies.get("pineconeupload1") = Map {
  "metadata" → ["code2"],
  "vector" → ["bedrockembedding1"]
}
```

## Signal-Based Inputs for Callback Nodes

Callback nodes (like Loop) use signal inputs for control flow:

```typescript
const definition: EnhancedNodeDefinition = {
  type: "Loop",
  inputs: [
    {
      name: "items",
      type: NodeInputType.ARRAY,
      required: true,
      signal: "EXECUTE", // Starts the loop
    },
    {
      name: "continue",
      type: NodeInputType.SIGNAL,
      required: false,
      signal: "CONTINUE", // Advances to next iteration
    },
  ],
};
```

### Benefits

- **Clear Intent**: Signal declarations make control flow explicit
- **Better Debugging**: "Send CONTINUE to Loop" vs "Execute Loop"
- **Visual Clarity**: Edges become signal routes in the UI

## Input Structure Patterns

### Single Input Connector Nodes

Inputs are **flattened** for backward compatibility:

```typescript
// Input structure
nodeInputs = {
  targetNode: {
    default: {
      sourceNode1: { data: "value1" },
      sourceNode2: { data: "value2" },
    },
  },
};

// Flattened for executor
context.inputs = {
  sourceNode1: { data: "value1" },
  sourceNode2: { data: "value2" },
};

// Template access
("${input.sourceNode1.data}"); // "value1"
```

### Multi-Connector Nodes

Inputs **preserve connector structure**:

```typescript
// Input structure
nodeInputs = {
  memory1: {
    signal: {
      inputtrigger1: { output: { message: "hello" } },
    },
    storeConversation: {
      openai2: { text: "user message" },
      openaistream1: { text: "assistant response" },
    },
  },
};

// Preserved for executor
context.inputs = {
  signal: {
    inputtrigger1: { output: { message: "hello" } },
  },
  storeConversation: {
    openai2: { text: "user message" },
    openaistream1: { text: "assistant response" },
  },
};

// Template access (includes connector name)
("${input.storeConversation.openai2.text}"); // "user message"
```

## Common Workflow Patterns

### 1. Simple Sequential Flow

```
Node A → Node B → Node C
```

Each node waits for the previous to complete.

### 2. Parallel Execution

```
     → Node B
Node A
     → Node C
```

B and C execute in parallel after A completes.

### 3. Multiple Inputs (Join)

```
Node A →
         Node C (requires both)
Node B →
```

Node C waits for both A and B to complete.

### 4. Connector-Specific Inputs

```
Node A → pinecone.metadata
Node B → pinecone.vector
```

Different nodes feed different connectors of the same target.

### 5. Callback Node Loop

```
InputTrigger → Loop → ProcessItem → Loop.continue
                 ↓
              Output
```

Loop emits items, ProcessItem processes them, then signals continue.

## Debug Mode

In debug mode, the signal routing system provides additional information:

1. **Active signals** - Which nodes are ready to execute
2. **Triggered signals** - Which downstream nodes will be triggered
3. **Waiting info** - Which connectors are waiting for which inputs

### Step Debugging with Callback Nodes

1. **SPAWN signal** - Always executes immediately (initializes actor)
2. **CONTINUE signals** - Wait for DEBUG_STEP in debug mode
3. User clicks "Step" → Sends DEBUG_STEP → Next iteration executes

## Best Practices

1. **Always specify targetHandle** when connecting to nodes with multiple inputs
2. **Use descriptive connector names** that indicate the data type or purpose
3. **Mark connectors as required** only when the node cannot function without that input
4. **Leverage the route table** for efficient signal routing

## Troubleshooting

### Node Not Executing

- Check if all required connectors have received inputs
- Verify edges are correctly mapped in the route table
- Ensure source nodes are completing successfully

### Wrong Data Received

- Verify the targetHandle on the edge matches the connector name
- Check if inputs are being flattened (single connector) or preserved (multi-connector)

### Callback Node Stuck

- Ensure `isComplete: true` is returned when done
- Verify CONTINUE signals are being sent from downstream nodes
- Check that the loop has items to process

---

**Related**: [Node Types](./02-node-types.md) | [Service Connectors](./07-service-connectors.md)
