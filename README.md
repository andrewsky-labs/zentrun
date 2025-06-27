# 🧠 Zentrun — A Software 3.0 based Agent App Platform

Zentrun is a platform where
**prompts generate real, executable code**,
and that code becomes **reusable functions inside agents.**

Each agent accumulates these functions,
and gradually behaves like a real app —
automating tasks, analyzing data, and supporting UI components.

Zentrun runs fully locally.
You own the features, logic, and data.

---

## 📌 What Is an Agent App?

An **Agent App** is a unit of reusable, prompt-defined functions
that can be saved, scheduled, and composed.

It’s more than a script — it’s a growing system
built with natural language and structured like software.

| SaaS (Software 1.0)          | Agent App (Software 3.0, Zentrun)         |
|------------------------------|--------------------------------------------|
| Fixed features               | Create new features from prompts           |
| Vendor-owned data            | Local database embedded per agent          |
| No logic customization       | Custom logic and UI defined by user        |
| Pay-per-seat licensing       | Open-source, local-first                   |
| You use it                   | You build, run, and own it                 |

---
---

[Learn More about Zentrun](https://zentrun.com)


---

## ✨ Installation

| Platform         | Stable                                                                                                  |
|------------------|---------------------------------------------------------------------------------------------------------|
| Windows          | [Download](https://download.zentrun.com/Zentrun%20Setup%200.0.1.exe)                                    |
| macOS            | [Download](https://download.zentrun.com/Zentrun-0.0.1-mac-x64.dmg)                     |
| Linux (tar.gz)   | [Download](https://download.zentrun.com/Zentrun-0.0.1-linux-x64.tar.gz)           |
| Linux (AppImage) | [Download](https://download.zentrun.com/Zentrun-0.0.1-linux-x86_64.AppImage) |

Download from zentrun.com or GitHub Releases.

##  ✨  Quick Start

```bash
git clone https://github.com/andrewsky-labs/zentrun
cd zentrun
yarn
yarn run dev
```

This handles everything: installs dependencies, builds core components, and launches the app.

## ✨ Demo: Prompt → Function → App

🎬 In the demo below, a marketing Agent App is created with prompts:

1. Collects AI news
2. Summarizes content
3. Posts automatically to Twitter
4. Analyzes engagement
5. Visualizes results

Each step is generated from language.
Each function is saved and reusable.

[![Demo Video](assets/demo.jpg)](https://youtu.be/HcqcrWb2jxA)

---

## 🔧 Key Features

### 1. 🧠 Prompt-Based Code Generation
- Generate Python, shell, browser automation code
- Save as persistent, schedulable functions
- No drag & drop – just prompts

### 2. 📂 Agent-Level Memory & Database
- Each agent has its own database (SQLite)
- Supports state tracking and RAG with local/cloud docs

### 3. 📊 Data Pipeline: Ingest → Analyze → Visualize
- Handle PDFs, CSVs, APIs, scraped content
- Auto-generate SQL, Python, and chart logic

### 4. 🧱 Modular Execution Architecture
- Zent → Agent → ZPilot (workspace hierarchy)
- Compose agents from reusable functional units

### 5. 💻 Fully Local Execution
- Windows, macOS, Linux
- Electron GUI and CLI
- No cloud lock-in, no API quota

---

## 💬 Monetize Your Agent Apps (Optional)

Some users package their Agent Apps
as internal tools, client deliverables, or microservices.
You can create repeatable workflows and share or resell them.

Zentrun helps you move from temporary automation
to sustainable, composable software — made from prompts.

---

Zentrun isn’t just a tool. It’s a Software 3.0 framework where agents evolve from your words.

### Screenshots



<div align="center">
  <img src="/assets/zentrun_main.jpg" alt="Zentrun" width="90%">
</div>

<div align="center">
  <img src="/assets/zent_build.png" alt="Zentrun" width="90%">
</div>
<div align="center">
  <img src="/assets/agent_build.png" alt="Zentrun" width="90%">
</div>
<div align="center">
  <img src="/assets/zpilot_build.png" alt="Zentrun" width="90%">
</div>


## 🤖 Supported Model Providers

<table>
  <tr align="center">
    <td>
      <img src="./src/renderer/src/assets/llm-icons/ollama.svg" width="50" height="50" alt="Ollama Icon"><br/>
      <a href="https://ollama.com">Ollama</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/deepseek-color.svg" width="50" height="50" alt="Deepseek Icon"><br/>
      <a href="https://deepseek.com/">Deepseek</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/siliconcloud.svg" width="50" height="50" alt="Silicon Icon"><br/>
      <a href="https://www.siliconflow.cn/">Silicon</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/qwen-color.svg" width="50" height="50" alt="QwenLM Icon"><br/>
      <a href="https://chat.qwenlm.ai">QwenLM</a>
    </td>
  </tr>
  <tr align="center">
    <td>
      <img src="./src/renderer/src/assets/llm-icons/doubao-color.svg" width="50" height="50" alt="Doubao Icon"><br/>
      <a href="https://console.volcengine.com/ark/">Doubao</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/minimax-color.svg" width="50" height="50" alt="MiniMax Icon"><br/>
      <a href="https://platform.minimaxi.com/">MiniMax</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/fireworks-color.svg" width="50" height="50" alt="Fireworks Icon"><br/>
      <a href="https://fireworks.ai/">Fireworks</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/ppio-color.svg" width="50" height="50" alt="PPIO Icon"><br/>
      <a href="https://ppinfra.com/">PPIO</a>
    </td>
  </tr>
  <tr align="center">
    <td>
      <img src="./src/renderer/src/assets/llm-icons/openai.svg" width="50" height="50" alt="OpenAI Icon"><br/>
      <a href="https://openai.com/">OpenAI</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/gemini-color.svg" width="50" height="50" alt="Gemini Icon"><br/>
      <a href="https://gemini.google.com/">Gemini</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/github.svg" width="50" height="50" alt="GitHub Models Icon"><br/>
      <a href="https://github.com/marketplace/models">GitHub Models</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/moonshot.svg" width="50" height="50" alt="Moonshot Icon"><br/>
      <a href="https://moonshot.ai/">Moonshot</a>
    </td>
  </tr>
  <tr align="center">
    <td>
      <img src="./src/renderer/src/assets/llm-icons/openrouter.svg" width="50" height="50" alt="OpenRouter Icon"><br/>
      <a href="https://openrouter.ai/">OpenRouter</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/azure-color.svg" width="50" height="50" alt="Azure OpenAI Icon"><br/>
      <a href="https://azure.microsoft.com/en-us/products/ai-services/openai-service">Azure OpenAI</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/qiniu.svg" width="50" height="50" alt="Qiniu Icon"><br/>
      <a href="https://www.qiniu.com/products/ai-token-api">Qiniu</a>
    </td>
    <td>
      <img src="./src/renderer/src/assets/llm-icons/grok.svg" width="50" height="50" alt="Grok Icon"><br/>
      <a href="https://x.ai/">Grok</a>
    </td>
  </tr>
</table>

** Compatible with any model provider in OpenAI/Gemini/Anthropic API format

## ✨  System Requirements
Minimum specs for a decent experience:

macOS: 13.6+ (8GB RAM for 3B models, 16GB for 7B, 32GB for 13B)
Windows: 10+ with GPU support for NVIDIA/AMD/Intel Arc
Linux: Most distributions work, GPU acceleration available

## ✨  Contributing

Please refer to [Contribution Guide](https://github.com/andrewsky-labs/zentrun/CONTRIBUTING.md).



## 📃 License

[LICENSE](./LICENSE)
