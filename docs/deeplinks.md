# 🔗 Zentrun DeepLinks Documentation

Zentrun supports external invocation through **deeplinks**. This documentation introduces the types of deeplinks supported by Zentrun, their parameters, and usage methods.

---

## 💬 Start Chat

Use this deeplink to quickly start a new chat session with an optional model and initial message.

### 🔗 URL Format

```
zentrun://start?msg={query}&system={systemPrompt}&model={modelId|modelName}
```

### 🧾 Parameters

| Name      | Type   | Required | Description                                                                 |
|-----------|--------|----------|-----------------------------------------------------------------------------|
| msg       | string | No       | Initial chat message                                                        |
| system    | string | No       | System prompt                                                               |
| model     | string | No       | Model ID or name (e.g., `gpt-3.5-turbo`, `deepseek-chat`)                   |

### ⚙️ Behavior

1. If not currently on the chat page, it will automatically navigate to the chat page.
2. If a model is specified, the system will try to match and select it (exact match first, then fuzzy).
3. If an initial message is provided, it will be pre-filled into the input box.

### 🧪 Examples

Basic usage – open a conversation with GPT-3.5:

```
zentrun://start?model=gpt-3.5-turbo
```

Specify an initial message:

```
zentrun://start?msg=Write%20an%20article%20about%20AI
```

Full example – model, message, and system prompt:

```
zentrun://start?msg=Analyze%20this%20code&model=deepseek-coder&system=You%20are%20a%20code%20analysis%20expert
```

---

## ⚙️ Install MCP

Use this deeplink to install Model Control Protocol (MCP) server configuration.

### 🔗 URL Format

```
zentrun://mcp/install?code={base64Encode(JSON.stringify(jsonConfig))}
```

### 🧾 Parameters

| Name  | Type           | Required | Description                                                              |
|-------|----------------|----------|--------------------------------------------------------------------------|
| code  | string (JSON)  | Yes      | Base64-encoded JSON string of the MCP server configuration               |

### ⚙️ Behavior

1. If MCP is not enabled, it will be automatically enabled.
2. The app navigates to the MCP configuration section in settings.
3. The "Add Server" dialog is opened and pre-filled with the config.

---

## 🧱 Configuration JSON Format

The MCP config JSON should follow one of the supported structures.

### 📝 Example: `command` without `url` → recognized as `stdio`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-filesystem-server",
      "args": [
        "/Users/username/Desktop"
      ]
    }
  }
}
```

### 📝 Example: `url` without `command` → recognized as `sse` by default

```json
{
  "mcpServers": {
    "browser-use-mcp-server": {
      "url": "http://localhost:8000/sse"
    }
  }
}
```

### 📦 Full Configuration Examples

**STDIO server:**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-filesystem-server",
      "args": [
        "/Users/username/Desktop"
      ],
      "env": {},
      "descriptions": "filesystem mcp server",
      "icons": "📁",
      "type": "stdio",
      "autoApprove": ["all"]
    }
  }
}
```

**SSE server:**

```json
{
  "mcpServers": {
    "browser-use-mcp-server": {
      "url": "http://localhost:8000/sse",
      "type": "sse",
      "icons": "🏠",
      "autoApprove": ["all"]
    }
  }
}
```

---

## 🛠 How to Generate MCP `code` Parameter

```javascript
import { encode } from 'js-base64';

const config = {
  "mcpServers": {
    "browser-use-mcp-server": {
      "url": "http://localhost:8000/sse"
    }
  }
}
const code = encode(JSON.stringify(config))
```

---

## 💬 Chat Deeplink Example

```
zentrun://start?msg=%E5%A4%A9%E6%B0%94%E4%B8%8D%E9%94%99&system=%E4%BD%A0%E6%98%AF%E4%B8%80%E4%B8%AA%E9%A2%84%E6%8A%A5%E5%91%98%2C%E8%AF%B7%E4%BD%A0%E7%A4%BC%E8%B2%8C%E8%80%8C%E4%B8%93%E4%B8%9A%E5%9B%9E%E7%AD%94%E7%94%A8%E6%88%B7%E9%97%AE%E9%A2%98&model=deepseek-chat
```

---

## 🧪 STDIO Install Example

```
zentrun://mcp/install?code=eyJtY3BTZXJ2ZXJzIjp7ImZpbGVzeXN0ZW0iOnsiY29tbWFuZCI6Im1jcC1maWxlc3lzdGVtLXNlcnZlciIsImFyZ3MiOlsiL1VzZXJzL3VzZXJuYW1lL0Rlc2t0b3AiXX19fQ==
```

---

## 🧪 SSE Install Example

```
zentrun://mcp/install?code=eyJtY3BTZXJ2ZXJzIjp7ImJyb3dzZXItdXNlLW1jcC1zZXJ2ZXIiOnsidXJsIjoiaHR0cDovL2xvY2FsaG9zdDo4MDAwL3NzZSJ9fX0=
```
