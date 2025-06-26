# Zentrun — A Software 3.0 Framework for Function-Evolving AI Agents

Zentrun is a Software 3.0 framework where AI agents don't just respond —
they evolve by equipping new functions through natural language prompts.

Each prompt becomes executable code.
Each piece of code becomes a reusable feature.
Your agent grows like an app — not a script.

## 🔍 What Is Software 3.0?

| Software 1.0 (SaaS) | Software 3.0 (Zentrun)                                              |
|---------------------|---------------------------------------------------------------------|
| Fixed, prebuilt features | Users can create additional functions via prompt                    |
| Data locked in vendor systems | Data stays in your agent's own DB                                   |
| Limited UI and workflow structure | Users can create fully customizable UI + flow from natural language |
| Limited analytics due to restricted data access	 | Full data ownership with unlimited analytics possibilities |
| One-size-fits-all tools		 | Agents tailored to your workflow	 |

In Software 3.0, users don’t consume software — they **grow** it.
Zentrun empowers you to turn natural language into working code, and let your agents accumulate real, executable skills.

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

## ✨ Demo


🎬 Demo: See an Agent Grow

In the demo below, a marketing agent:

1) 📥 Collects AI-related news

2) ✍️ Transforms it into SNS posts

3) 🐦 Uploads content to Twitter

4) 📊 Analyzes collected data

5) 📈 Visualizes insights through a custom UI

All steps are created and run through vibe-coding —
imagine using an app and being able to add new features on the fly, just by saying what you want.

[![Demo Video](assets/demo.jpg)](https://youtu.be/HcqcrWb2jxA)

Click the image to play the video.

---

## 🧠 Why Zentrun?

| Core Value | What It Enables |
|------------|------------------|
| **Prompt-to-Code** | Your prompts generate executable code, not just results. |
| **Persistent Features** | Every prompt becomes a stored function — schedule, reuse, and chain it. |
| **Agent Memory** | Each agent has its own embedded DB — remembers state, tracks data, builds history. |
| **Full-stack Agent Logic** | Go beyond automation: create analytics, UI, file parsing, and app-like flows. |
| **Local-first by design** | Run everything on your machine. No API quotas, no cloud dependency. |
| **Composable Architecture** | Zent → Agent → ZPilot — build scalable workflows from small pieces. |
| **Vibe-coded simplicity** | Write and structure logic in natural language — no drag & drop. |

---

## ✨ Zentrun Key Features

### 1. 🤖 Agent-Based Code Generation
- Agents generate actual Python, shell, and browser code from prompts
- Features are saved, reusable, and schedulable
- Zent → Agent → ZPilot hierarchy supports modular automation

### 2. 🧠 Embedded Memory & RAG
- Each agent has a built-in DB (SQLite)
- Agents remember past results and decisions
- RAG support: pull docs into context from local/cloud sources

### 3. 📊 Full Data Flow: Ingest → Analyze → Visualize
- Handle PDFs, text, CSVs, web scraping, and APIs
- Auto-generate SQL/Python for data wrangling
- Generate Markdown-ready charts (Mermaid, Matplotlib)

### 4. 🛠 Automation & App Logic
- Slack, Reddit, Twitter, CRM, form filling, scraping, and browser actions
- MCP server controls Chromium browsers locally
- Publish agents or Zent packs to community marketplace

### 5. 💻 Developer & User Experience
- Works on Windows, macOS, Linux (Electron & CLI)
- Instant install & run — all local, no complex setup
- Export/share agents as single files
- Themeable UI with light/dark/transparent modes

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
