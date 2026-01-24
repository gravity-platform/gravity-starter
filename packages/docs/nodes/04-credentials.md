# Credential Management

**The One Rule: Nodes NEVER touch credentials. Services fetch credentials internally.**

## 🚨 The One Rule

**Nodes pass context to services. Services fetch credentials using `getNodeCredentials()`.**

This is the **only** credential pattern in GravityAI. No exceptions.

## ✅ CORRECT Pattern

### 1. Node Level (Executor)

```typescript
// ✅ CORRECT: Pass context to service
protected async executeNode(inputs, config, context) {
  const credentialContext = this.buildCredentialContext(context);
  const result = await myService(config, credentialContext);
  return { __outputs: result };
}

// ❌ WRONG: Never access credentials directly
// const apiKey = context.credentials.myCredential.apiKey;
```

### 2. Service Level

```typescript
// ✅ CORRECT: Service fetches credentials internally
export async function myService(config: any, credentialContext: CredentialContext) {
  const credentials = await getNodeCredentials(credentialContext, "myCredential");
  const apiKey = credentials.apiKey;

  // Use the credentials
  return await externalAPI.call(apiKey, config.data);
}

// ❌ WRONG: Service should not receive raw credentials
// export async function myService(apiKey: string, data: any) {
//   return await externalAPI.call(apiKey, data);
// }
```

## 🏗️ Credential Context Structure

```typescript
interface CredentialContext {
  workflowId: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  config: any; // Contains credentialId references
  credentials?: any; // Platform-managed credentials
}
```

## 🔧 Building Credential Context

### In Executors (Standard Pattern)

```typescript
private buildCredentialContext(context: NodeExecutionContext) {
  const { workflowId, executionId, nodeId } = this.validateAndGetContext(context);

  return {
    workflowId,
    executionId,
    nodeId,
    nodeType: this.nodeType,
    config: context.config,
    credentials: context.credentials || {},
  };
}
```

### In Interactions (Debug Mode)

```typescript
const credentialContext: CredentialContext = {
  workflowId: context.workflow?.id || "unknown",
  executionId: context.executionId || context.workflow?.runId || "unknown",
  nodeId: context.nodeId || "interaction",
  nodeType: context.nodeType || "MyNode",
  config: context.config,
};
```

## 📋 Complete Implementation

### 1. Node Definition - Declare Credentials

```typescript
export const MyNode: EnhancedNodeDefinition = {
  type: "MyNode",
  name: "My Node",
  // ... other properties
  credentials: [
    {
      name: "myCredential",
      type: "myCredentialType", // Must match credential definition
      required: true,
    },
  ],
};
```

### 2. Node Config - Store Credential IDs

```typescript
// The node config should contain credential IDs:
{
  "credentials": {
    "myCredential": "cred_xxxxx" // The actual credential ID from database
  },
  "apiEndpoint": "https://api.example.com",
  // ... other config
}
```

### 3. Service - Fetch Credentials

```typescript
// Services receive api parameter from executor
export async function myService(config: any, credentialContext: CredentialContext, api: any) {
  // Use api.getNodeCredentials to fetch credentials
  const credentials = await api.getNodeCredentials(credentialContext, "myCredential");

  if (!credentials?.apiKey) {
    throw new Error("API key not found in credentials");
  }

  // Use credentials for API call
  const response = await fetch(config.apiEndpoint, {
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config.data),
  });

  return response.json();
}
```

### 4. Credential Definition

```typescript
// src/credentials/index.ts

// Option 1: Use existing credential from plugin-base
import { OpenAICredential } from "@gravityai-dev/plugin-base";
export { OpenAICredential as MyCredential };

// Option 2: Define custom credential
export const MyCredential = {
  name: "myCredential",
  type: "object",
  title: "My API Credentials",
  properties: {
    apiKey: {
      type: "string",
      title: "API Key",
      description: "Your API key from the service",
    },
    endpoint: {
      type: "string",
      title: "API Endpoint",
      description: "Custom API endpoint (optional)",
      default: "https://api.example.com",
    },
  },
  required: ["apiKey"],
};
```

## 🔗 Real Examples

### AWS Services Pattern

```typescript
// Study: @gravityai-dev/aws-bedrock
export async function callBedrockClaude(config, credentialContext, api) {
  const credentials = await api.getNodeCredentials(credentialContext, "awsCredential");

  const bedrock = new BedrockRuntimeClient({
    region: credentials.region || "us-east-1",
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  // Use bedrock client...
}
```

### API Key Pattern

```typescript
// Study: @gravityai-dev/openai
export async function generateCompletion(config, credentialContext, api) {
  const credentials = await api.getNodeCredentials(credentialContext, "openaiCredential");

  const openai = new OpenAI({
    apiKey: credentials.apiKey,
    organization: credentials.organizationId,
  });

  // Use openai client...
}
```

## 🚨 Common Issues

### Issue: "Credentials are required" Error

**Cause**: Node definition doesn't declare credentials properly

**Solution**:

```typescript
// Add to node definition
credentials: [
  {
    name: "myCredential",
    type: "myCredentialType",
    required: true,
  },
];
```

### Issue: "Credential not found" Error

**Cause**: Config doesn't have credential ID stored

**Solution**: Ensure config has:

```typescript
{
  "credentials": {
    "myCredential": "cred_xxxxx" // Must be valid credential ID
  }
}
```

### Issue: Service can't access credentials

**Cause**: Not using `api.getNodeCredentials()` properly

**Solution**:

```typescript
// In service - use the injected api parameter
const credentials = await api.getNodeCredentials(credentialContext, "myCredential");
```

## 🎯 Migration Checklist

When updating a node to the credential pattern:

- [ ] Remove all credential access from node code
- [ ] Update validation functions to only accept config
- [ ] Create `CredentialContext` at the top of executors
- [ ] Pass `credentialContext` and `context.api` to all service calls
- [ ] Update services to use `api.getNodeCredentials()` internally
- [ ] Remove credential parameters from service function signatures
- [ ] Add credential requirements to node definition
- [ ] Test with debug resolver to ensure credentials load properly

## 🔗 Study Real Implementations

**AWS Credential Pattern:**

- `@gravityai-dev/aws-bedrock` - AWS credential handling
- `@gravityai-dev/aws-s3` - AWS service integration

**API Key Pattern:**

- `@gravityai-dev/openai` - OpenAI API key handling
- `@gravityai-dev/pinecone` - Pinecone API key handling

**Custom Credential Pattern:**

- Any package with custom credential definitions

---

**Next**: [Troubleshooting](./05-troubleshooting.md) - Common issues and solutions
