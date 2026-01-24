# Challenge 2: Create Your First Agent

Build a simple AI chat agent in Canvas.

## Goal

Create a workflow that:

- Receives user messages
- Sends them to an LLM (OpenAI/Bedrock)
- Returns AI responses

## Prerequisites

You need credentials configured for at least one LLM provider:

- **OpenAI**: Add `OPENAI_API_KEY` to your `.env`
- **AWS Bedrock**: Configure AWS credentials with Bedrock access

## Steps

### 1. Open Canvas

Navigate to http://localhost:3001

### 2. Create New Workflow

Click **Create New Workflow** and name it "My First Agent"

### 3. Add Nodes

Drag these nodes onto the canvas:

1. **InputTrigger** - Entry point for user messages
2. **OpenAIStream** (or BedrockClaude) - LLM processing
3. **AIResponse** - Display response to user

### 4. Connect Nodes

- InputTrigger `output` → OpenAI `input`
- OpenAI `output` → AIResponse `input`

### 5. Configure OpenAI Node

Click on the OpenAI node to open the **Config Panel** on the right.

**Configuration tab:**

- **Model**: gpt-5
- **System Prompt**: "You are a helpful assistant....."
- **User Prompt**: `{{{signal.inputtrigger1.output.message}}}`

**Debug tab:**

- View node outputs after running
- See the raw response from the LLM
- Inspect errors if something goes wrong

### 6. Configure AIResponse Node

Click on the AIResponse node to configure how the response displays:

**Configuration tab:**

- **Progress/thinking message**: `return signal.openai1.text` (shows partial response while streaming)
- **Main response text**: `return signal.openaistream1.chunk` (displays the streaming output)

### 7. Save Workflow

Click the green **Save** button in the top left.

### 8. Add Test Input

1. Click **Test Inputs** (top right)
2. Enter a test message: `What card is best for travel`
3. Set **User ID**: `debug-user`

### 9. Step Through Nodes

1. Click the **play button** (▶️) on the InputTrigger node to run just that node
2. Check the node output - you should see your test message
3. Click play on the **OpenAIStream** node
4. Watch the response stream in
5. Click play on **AIResponse** to see the final output

> **Tip:** Use the ⚡ button to run the entire workflow at once

## ✅ Challenge Complete

Your agent workflow is built and tested in Canvas! Proceed to [Challenge 3: Create Your First Node](./03-create-your-first-node.md).
