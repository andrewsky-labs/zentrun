# 🧠 MCP Presenter Architecture Document

## 🧩 Module Overview

The **MCP (Model Context Protocol) Presenter** is the core module in Zentrun responsible for managing MCP servers and tools. Its key responsibilities include:

1. **MCP Server Management** – Starting, stopping, configuring, default server setup, and npm registry speed testing
2. **MCP Tool Management** – Tool discovery, name conflict handling, caching, permission checks, and invocation
3. **LLM Adaptation** – Converting MCP tool definitions to formats compatible with LLM providers (OpenAI, Anthropic, Gemini)
4. **State and Events** – Monitoring server state and emitting related events via `eventBus`

---

## 🧱 Core Components

```mermaid
classDiagram
    class IMCPPresenter {
        <<Interface>>
        +getMcpServers()
        +getMcpClients()
        +startServer()
        +stopServer()
        +callTool()
        +getAllToolDefinitions()
        +mcpToolsToOpenAITools()
        +openAIToolsToMcpTool()
        +mcpToolsToAnthropicTools()
        +anthropicToolUseToMcpTool()
        +mcpToolsToGeminiTools()
        +geminiFunctionCallToMcpTool()
        +addMcpServer()
        +removeMcpServer()
        +updateMcpServer()
        +getMcpDefaultServers()
        +addMcpDefaultServer()
        +removeMcpDefaultServer()
        +toggleMcpDefaultServer()
        +getMcpEnabled()
        +setMcpEnabled()
        +resetToDefaultServers()
    }

    class McpPresenter {
        -serverManager: ServerManager
        -toolManager: ToolManager
        -configPresenter: IConfigPresenter
        +initialize()
        ...
    }

    class ServerManager {
        -clients: Map<string, McpClient>
        +testNpmRegistrySpeed()
        +getRunningClients()
        ...
    }

    class ToolManager {
        -cachedToolDefinitions: MCPToolDefinition[]
        -toolNameToTargetMap: Map<string, object>
        +getAllToolDefinitions()
        +callTool()
        ...
    }

    class McpClient {
        +serverName: string
        +connect()
        +callTool()
        +listTools()
    }

    class McpConfHelper {
        +getMcpServers()
        +setMcpServers()
        ...
    }

    class IConfigPresenter {
        <<Interface>>
        +getMcpServers()
        +setMcpServers()
        ...
    }

    McpPresenter ..|> IMCPPresenter
    McpPresenter o-- ServerManager
    McpPresenter o-- ToolManager
    McpPresenter o-- IConfigPresenter
    ServerManager "1" *-- "0..*" McpClient : manages
```

---

## 🔄 Data Flow

### 1. Initialization & Default Server Start

```mermaid
sequenceDiagram
    participant AppStartup
    participant McpPresenter
    participant ServerManager
    participant IConfigPresenter
    participant McpClient

    AppStartup->>McpPresenter: constructor()
    McpPresenter->>ServerManager: create
    McpPresenter->>ToolManager: create
    McpPresenter->>IConfigPresenter: getMcpServers()
    McpPresenter->>ServerManager: testNpmRegistrySpeed()
    loop For each defaultServerName
        McpPresenter->>ServerManager: startServer()
        ServerManager->>McpClient: new & connect()
        McpClient->>MCP Server: Connect
        MCP Server-->>McpClient: Connected
        McpClient-->>ServerManager: Status Event
    end
```

### 2. Tool Call Flow (e.g., OpenAI)

```mermaid
sequenceDiagram
    participant LLM
    participant McpPresenter
    participant ToolManager
    participant McpClient
    participant MCPServer

    LLM->>McpPresenter: getAllToolDefinitions()
    McpPresenter->>ToolManager: getAllToolDefinitions()
    ToolManager->>McpClient: listTools()
    McpClient-->>ToolManager: raw tool list
    ToolManager-->>McpPresenter: definitions[]
    McpPresenter->>LLM: converted OpenAI tool definitions

    loop For each tool_call
        LLM->>McpPresenter: openAIToolsToMcpTool()
        McpPresenter->>ToolManager: callTool()
        ToolManager->>ToolManager: check permission
        ToolManager->>McpClient: callTool()
        McpClient->>MCPServer: Execute
        MCPServer-->>McpClient: Result
        McpClient-->>ToolManager: ToolCallResult
        ToolManager-->>McpPresenter: Response
        McpPresenter->>LLM: Result
    end
```

---

## 🧩 Key Design Highlights

### 1. **Layered Architecture**

- **Interface Layer**: `IMCPPresenter` defines public methods
- **Presenter Layer**: `McpPresenter` coordinates logic, delegates to managers
- **Manager Layer**: `ServerManager` & `ToolManager` manage runtime logic
- **Config Layer**: `IConfigPresenter` & `McpConfHelper` handle settings
- **Client Layer**: `McpClient` communicates with individual MCP servers

### 2. **Multi-Protocol Support**

- `McpClient` can handle `stdio`, `sse`, `http`, and `in-memory` protocols via `Transport` abstraction

### 3. **Tool Management & Adaptation**

- `ToolManager` handles:
  - Tool discovery
  - Name conflict resolution
  - Mapping/caching tool definitions
- `McpPresenter` handles:
  - Format conversions between MCP ↔ OpenAI/Anthropic/Gemini
- `toolNameToTargetMap`: used for accurate routing to original tools & clients

### 4. **Configuration-Driven Behavior**

- Configurations are stored and loaded via `McpConfHelper`
- Uses `electron-store` for persistence

### 5. **Error Handling & Events**

- Errors handled at each layer (server start, tool call, etc.)
- All status/state changes are emitted via `eventBus`

### 6. **Performance & Environment Optimization**

- `ServerManager` benchmarks npm registries to select the fastest
- `McpClient` carefully injects env vars (e.g., PATH, proxies, registry) for `stdio` tools

