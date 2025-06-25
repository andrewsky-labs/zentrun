# 🔁 From MCP to Tool Use

- [From MCP to Tool Use](#from-mcp-to-tool-use)
  - [MCP Tool Mapping & Definition](#mcp-tool-mapping--definition)
  - [Anthropic Tool API & Context Structure](#anthropic-tool-api--context-structure)
    - [Format Conversion](#format-conversion)
    - [Context Structure](#context-structure)
    - [Streaming](#streaming)
  - [Example: Anthropic Tool Use](#example-anthropic-tool-use)
  - [Gemini Tool API & Context Structure](#gemini-tool-api--context-structure)
  - [Example: Gemini Tool Use](#example-gemini-tool-use)
  - [OpenAI Tool API & Context Structure](#openai-tool-api--context-structure)
  - [Example: OpenAI Tool Use](#example-openai-tool-use)
  - [Prompt Engineering for Non-Native Tool Use](#prompt-engineering-for-non-native-tool-use)

---

## 🛠 MCP Tool Mapping & Definition

MCP (Model Context Protocol) standardizes tool interaction across LLM providers. The `McpClient` class manages all MCP tools and provides a unified interface:

```ts
{
  name: string;
  description?: string;
  inputSchema: {
    type: "object",
    properties: { ... }
  }
}
```

To invoke a tool:
```ts
async callTool(toolName: string, args: Record<string, unknown>): Promise<ToolCallResult>
```

Result structure:
```ts
interface ToolCallResult {
  isError?: boolean;
  content: Array<{
    type: string;
    text: string;
  }>;
}
```

Tool conversion uses methods like:
- `mcpToolsToOpenAITools`
- `mcpToolsToAnthropicTools`
- `mcpToolsToGeminiTools`

---

## 🤖 Anthropic Tool API & Context Structure

### Format Conversion

Anthropic expects tool definitions under `tools` with JSON Schema:

```ts
{
  tools: [
    {
      name: string;
      description: string;
      input_schema: object;
    }
  ]
}
```

### Context Structure

- `system`: system instructions
- `user`: `content` array (text, image, etc.)
- `assistant`: may include `tool_use`
- `tool_result`: part of user message

```ts
private formatMessages(messages: ChatMessage[]): {
  system?: string;
  messages: Anthropic.MessageParam[];
}
```

### Streaming Events

Claude emits:
- `content_block_start`: tool call begins
- `content_block_delta`: argument streaming
- `content_block_stop`: tool call ends
- `message_delta` with `stop_reason: 'tool_use'`

Converted to:

```ts
{
  type: 'tool_call_start' | 'tool_call_chunk' | 'tool_call_end';
  tool_call_id?: string;
  tool_call_name?: string;
  tool_call_arguments_chunk?: string;
  tool_call_arguments_complete?: string;
}
```

---

## 📘 Example: Anthropic Tool Use

### Tool Definition

```json
{
  "name": "getTime",
  "description": "Get a timestamp with millisecond offset. Negative for past, positive for future.",
  "input_schema": {
    "type": "object",
    "properties": {
      "offset_ms": {
        "type": "number",
        "description": "Milliseconds offset from current time"
      }
    },
    "required": ["offset_ms"]
  }
}
```

### User Input

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "What's the date for yesterday?" }
  ]
}
```

### Model Response

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Let me fetch yesterday’s timestamp." },
    {
      "type": "tool_use",
      "id": "toolu_01ABCDEFGHIJKLMNOPQRST",
      "name": "getTime",
      "input": { "offset_ms": -86400000 }
    }
  ]
}
```

### MCP Result

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01ABCDEFGHIJKLMNOPQRST",
      "result": "1684713600000"
    }
  ]
}
```

### Final Response

```json
{
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Based on the timestamp 1684713600000, yesterday was May 22, 2023."
    }
  ]
}
```

---

## 🧠 Gemini Tool API & Context Structure

### Format Conversion

```ts
{
  tools: [
    {
      functionDeclarations: [
        {
          name: string,
          description: string,
          parameters: object // OpenAPI-style JSON schema
        }
      ]
    }
  ]
}
```

### Context

- `systemInstruction`: standalone instruction
- `contents`: message parts
- `functionCall`: tool use
- `functionResponse`: tool result

### Streaming

- `functionCall` = tool call
- `functionCall.args` = arguments
- `functionCallResult` = result

---

## 📘 Example: Gemini Tool Use

### Tool

```json
{
  "tools": [
    {
      "functionDeclarations": [
        {
          "name": "getTime",
          "description": "Return a timestamp offset in ms.",
          "parameters": {
            "type": "object",
            "properties": {
              "offset_ms": {
                "type": "number",
                "description": "Offset in ms. Negative = past."
              }
            },
            "required": ["offset_ms"]
          }
        }
      ]
    }
  ]
}
```

### User Input

```json
{
  "role": "user",
  "parts": [{ "text": "What's the date for yesterday?" }]
}
```

### Tool Call

```json
{
  "role": "model",
  "parts": [
    {
      "functionCall": {
        "name": "getTime",
        "args": { "offset_ms": -86400000 }
      }
    }
  ]
}
```

### MCP Result

```json
{
  "role": "user",
  "parts": [
    {
      "functionResponse": {
        "name": "getTime",
        "response": 1684713600000
      }
    }
  ]
}
```

### Final Output

```json
{
  "role": "model",
  "parts": [
    {
      "text": "Based on timestamp 1684713600000, yesterday was May 22, 2023."
    }
  ]
}
```

---

## 🤖 OpenAI Tool API & Context

### Format Conversion

```ts
{
  tools: [
    {
      type: "function",
      function: {
        name: string,
        description: string,
        parameters: object
      }
    }
  ]
}
```

### Context Structure

- `messages[]`: with `role`, `content`
- `tool_calls[]`: inside assistant message
- `tool` role response: contains `tool_call_id`

### Streaming

- `delta.tool_calls` indicates live function call
- Arguments built over time
- Unified into `LLMCoreStreamEvent`

---

## 📘 Example: OpenAI Tool Use

### Tool

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "getTime",
        "description": "Return timestamp with offset.",
        "parameters": {
          "type": "object",
          "properties": {
            "offset_ms": {
              "type": "number",
              "description": "Offset from now in milliseconds."
            }
          },
          "required": ["offset_ms"]
        }
      }
    }
  ]
}
```

### User Input

```json
[{ "role": "user", "content": "What was yesterday’s date?" }]
```

### Tool Call

```json
[
  {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "getTime",
          "arguments": "{ \"offset_ms\": -86400000 }"
        }
      }
    ]
  }
]
```

### MCP Response

```json
[
  {
    "role": "tool",
    "tool_call_id": "call_abc123",
    "content": "1684713600000"
  }
]
```

### Final Answer

```json
[
  {
    "role": "assistant",
    "content": "Based on the timestamp 1684713600000, yesterday was May 22, 2023."
  }
]
```

---

## 🧪 Prompt Engineering for Non-Native Tool Use

### Prompt Wrapping

```ts
prepareFunctionCallPrompt(messages, mcpTools): ChatCompletionMessageParam[]
```

System prompt includes:
- Function description
- JSON Schema
- Usage examples (e.g., `<function_call>...</function_call>`)

### Streaming Parsing

```ts
parseFunctionCalls(response: string): Array<{
  id: string;
  type: string;
  function: { name: string; arguments: string }
}>
```

Uses:
- Regex
- Tag-based state machine

```ts
type TagState = 'none' | 'start' | 'inside' | 'end';
```

### Example Prompt-based Flow

**1. Add function to system message:**

```
function getTime(offset_ms: number): number
Use this format:

<function_call>
{
  "name": "getTime",
  "arguments": { "offset_ms": -86400000 }
}
</function_call>
```

**2. Model generates:**

```
<function_call>
{
  "name": "getTime",
  "arguments": { "offset_ms": -86400000 }
}
</function_call>
```

**3. Parse and execute with MCP**

```ts
const match = response.match(/<function_call>([\s\S]*?)<\/function_call>/);
if (match) {
  const parsed = JSON.parse(match[1]);
}
```

**4. Inject result into conversation**

```
Result: 1684713600000
Answer: Yesterday was May 22, 2023.
```

This enables tool-like functionality in models without native support via structured prompts and robust parsing.
