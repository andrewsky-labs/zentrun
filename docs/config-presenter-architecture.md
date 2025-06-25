# 🧩 ConfigPresenter Architecture

## 📘 Class Diagram

```mermaid
classDiagram
    class IConfigPresenter {
        <<interface>>
        +getSetting()
        +setSetting()
        +getProviders()
        +setProviders()
        +getModelStatus()
        +setModelStatus()
        +getMcpServers()
        +setMcpServers()
    }

    class ConfigPresenter {
        -store: ElectronStore~IAppSettings~
        -providersModelStores: Map~string, ElectronStore~IModelStore~~
        -mcpConfHelper: McpConfHelper
        +constructor()
        +migrateModelData()
    }

    class ElectronStore~T~ {
        +get()
        +set()
        +delete()
    }

    class McpConfHelper {
        +getMcpServers()
        +setMcpServers()
        +onUpgrade()
    }

    class eventBus {
        +emit()
        +on()
    }

    IConfigPresenter <|.. ConfigPresenter
    ConfigPresenter *-- ElectronStore~IAppSettings~
    ConfigPresenter *-- "1" McpConfHelper
    ConfigPresenter *-- "*" ElectronStore~IModelStore~
    ConfigPresenter ..> eventBus
```

---

## 🔄 Data Flow Diagram

```mermaid
sequenceDiagram
    participant Renderer
    participant ConfigPresenter
    participant ElectronStore
    participant McpConfHelper

    Renderer->>ConfigPresenter: getSetting('language')
    ConfigPresenter->>ElectronStore: get('language')
    ElectronStore-->>ConfigPresenter: 'en-US'
    ConfigPresenter-->>Renderer: 'en-US'

    Renderer->>ConfigPresenter: setMcpEnabled(true)
    ConfigPresenter->>McpConfHelper: setMcpEnabled(true)
    McpConfHelper-->>ConfigPresenter: Promise~void~
    ConfigPresenter->>eventBus: emit('mcp-enabled-changed', true)
    ConfigPresenter-->>Renderer: Promise~void~
```

---

## 🗂 Storage Structure

### 📁 Main Configuration (`app-settings.json`)

```json
{
  "language": "en-US",
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "apiKey": "sk-...",
      "enable": true
    }
  ],
  "model_status_openai_gpt-4": true,
  "proxyMode": "system",
  "syncEnabled": false
}
```

### 📁 Model Configuration (`models_openai.json`)

```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "maxTokens": 8192,
      "vision": false,
      "functionCall": true
    }
  ],
  "custom_models": [
    {
      "id": "gpt-4-custom",
      "name": "GPT-4 Custom",
      "maxTokens": 8192
    }
  ]
}
```

---

## 🔧 Component Interaction

```mermaid
flowchart TD
    A[Renderer] -->|Invoke| B[ConfigPresenter]
    B -->|Read/Write| C[Main Configuration Store]
    B -->|Manage| D[Model Store]
    B -->|Delegate| E[McpConfHelper]
    B -->|Trigger| F[Event Bus]
    F -->|Notify| G[Other Presenters]
    F -->|Notify| A
```

---

## 🔑 Key Design Points

1. **Interface Segregation**: Define public APIs via the `IConfigPresenter` interface.
2. **Single Responsibility**: `McpConfHelper` handles all MCP-related logic.
3. **Event Driven**: Changes in configuration are communicated via the event bus.
4. **Version Compatibility**: Built-in data migration mechanism.
5. **Type Safety**: Generic interfaces are used to ensure type safety.
