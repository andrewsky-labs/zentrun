# 🧩 Event System Design Document

## 🔍 Background

The `provider-models-updated` event in the current project is triggered from **two different sources**:

1. **BaseLLMProvider**: Triggered during model operations (e.g., `addCustomModel`, `removeCustomModel`)
2. **ConfigPresenter**: Triggered during config changes (e.g., `addCustomModel`, `removeCustomModel`)

This causes several problems:
- **Recursive loop triggering** (leading to potential infinite loops)
- **Unclear semantics** (same event name means different things in different contexts)
- **Tight coupling** and poor maintainability

---

## 🏷 Event Categories and Naming Conventions

Events are grouped by functional domain and follow a consistent naming pattern:

### 1. Configuration Events

| Event Name                  | Description                            |
|----------------------------|----------------------------------------|
| `config:provider-changed`  | Triggered when provider config changes |
| `config:system-changed`    | Triggered when system config changes   |
| `config:model-list-changed`| Triggered when model list is updated   |

### 2. Model Events

> **Removed** – All model state/name changes will now be emitted through `ConfigPresenter` to align with top-level `Settings` semantics.

### 3. Conversation Events

| Event Name              | Description                  |
|------------------------|------------------------------|
| `conversation:created` | A new conversation is created |
| `conversation:activated` | A conversation is activated |
| `conversation:cleared`  | All conversations are cleared |

### 4. Stream Events

| Event Name        | Description                 |
|------------------|-----------------------------|
| `stream:response`| Streaming response received |
| `stream:end`     | Stream completed            |
| `stream:error`   | Stream error occurred       |

### 5. App Update Events

| Event Name              | Description                      |
|------------------------|----------------------------------|
| `update:status-changed`| Update status has changed        |
| `update:progress`      | Update download progress         |
| `update:error`         | An update error occurred         |
| `update:will-restart`  | App will restart after update    |

### 6. Sync Events

| Event Name              | Description             |
|------------------------|-------------------------|
| `sync:backup-started`  | Backup process started  |
| `sync:backup-completed`| Backup completed        |
| `sync:backup-error`    | Backup failed           |
| `sync:import-started`  | Import process started  |
| `sync:import-completed`| Import completed        |
| `sync:import-error`    | Import failed           |

---

## 🎯 Responsibility Separation

Clarified event responsibility for each component:

| Component         | Responsibility                         |
|------------------|----------------------------------------|
| `ConfigPresenter`| Emits only config-related events       |
| `BaseLLMProvider`| Handles model operations only (no events) |
| `ThreadPresenter`| Emits conversation-related events      |
| `UpgradePresenter`| Emits update-related events           |

---

## ⏱ Current Event Flow (Before Refactor)

```text
BaseLLMProvider                ConfigPresenter                  Presenter(Main)                  Settings(Renderer)
     |                              |                                 |                                |
     |--- provider-models-updated-->|                                 |                                |
     |                              |--- provider-models-updated----->|                                |
     |                              |                                 |--- provider-models-updated---->|
     |                              |                                 |                                |--- refreshProviderModels()
     |                              |                                 |                                |
     |--- model-status-changed----->|                                 |                                |
     |                              |--- model-status-changed-------->|                                |
     |                              |                                 |--- model-status-changed------->|
     |                              |                                 |                                |--- updateLocalModelStatus()
     |                              |                                 |                                |
     |                              |--- provider-setting-changed---->|                                |
     |                              |                                 |--- provider-setting-changed--->|
     |                              |                                 |                                |--- refreshAllModels()
```

---

## 🔄 Refactored Event Flow

```text
ConfigPresenter                  Presenter(Main)                  Settings(Renderer)
     |                                 |                                |
     |--- config:model-list-changed--->|                                |
     |                                 |--- config:model-list-changed-->|
     |                                 |                                |--- refreshProviderModels()
     |                                 |                                |
     |--- model:status-changed-------->|                                |
     |                                 |--- model:status-changed------->|
     |                                 |                                |--- updateLocalModelStatus()
     |                                 |                                |
     |--- config:provider-changed----->|                                |
     |                                 |--- config:provider-changed---->|
     |                                 |                                |--- refreshAllModels()
```

---

This event refactor aims to **reduce coupling**, **clarify semantics**, and **avoid recursive loops**, making the system more maintainable and scalable.
