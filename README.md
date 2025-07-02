```md
# 🛰️ Zentrun — The Open Source Palantir Alternative

Zentrun is an open source platform for **AI-powered decision automation** — a transparent, prompt-driven alternative to Palantir Foundry and AIP.

It allows you to:
- **Ingest, analyze, and visualize data** with natural language
- **Define actions and automate decisions** based on structured prompts
- **Build modular, ontology-aware AI Apps** that operate like Palantir AIP Apps

## ✨ Demo: Prompt → Function (Zent) → App

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

---

## 🧠 Prompt-to-Execution: From Questions to Actions

In Zentrun, prompts define **runnable logic** — not just passive insights.
Each prompt creates a **Zent**: a structured function that can be reused, scheduled, and executed.

Zents form the building blocks of **AI Apps**, which:
- Maintain local or RAG-based knowledge
- Understand context through a structured ontology
- Visualize insights and **act** on decisions

From prompt → to code → to logic → to action.

---

## 🧭 Ontology + Logic = Strategic Execution

Zentrun includes a lightweight yet powerful **ontology system**, allowing you to:
- Define key entities (e.g., Candidate, Channel, Campaign)
- Capture their relationships and historical changes
- Build decisions mapped to structured, real-world context

This lets your AI Apps behave less like scripts — and more like strategic systems.

---

## ⚙️ How It Works

**1. Prompt a function**
→ Zentrun generates Python, SQL, or shell-based logic

**2. Save as Zent**
→ Zent = Executable & schedulable logic block

**3. Combine into AI App**
→ Modular app = Zents + Ontology + Data

**4. Analyze, decide, act**
→ End-to-end automation of decision flows

---

## 📦 Example AI Apps

- 🧑‍💼 **Recruiting App**: Detect GPT-written resumes → Score applicants → Recommend interviews
- 📈 **Marketing App**: Track trends → Classify performance → Post & analyze content
- 🧠 **Strategy App**: Simulate scenarios → Compare outcomes → Recommend actions
- 🔍 **Competitive Monitor**: Track rivals → Extract signals → Suggest response
- 💬 **Sales App**: Cluster leads → Predict success → Alert team

---

## 🔑 Key Features

- ✅ Prompt-to-code (Python, SQL, Shell, Browser)
- ✅ Zent = Reusable execution logic
- ✅ Built-in visualizations (chart, table, map)
- ✅ Structured ontology & local state memory
- ✅ RAG integration with document context
- ✅ Runs offline or integrated into pipelines

---

## 🆚 Zentrun vs. Palantir

| Palantir Foundry / AIP | Zentrun (Open Source)             |
|------------------------|-----------------------------------|
| Closed-source          | ✅ Transparent & auditable         |
| Enterprise-only        | ✅ Free & self-hosted & Enterprise |
| Partly customizable    | ✅ Fully customizable              |
| Complex setup          | ✅ Prompt-first simplicity         |
| Cloud-only             | ✅ Works locally or hybrid         |

---

## 💼 From Automation to Monetization

- Package AI Apps for clients or internal ops
- Sell repeatable workflows with real execution logic
- Use Zents as plug-in logic across teams

Zentrun lets you **turn prompts into product-grade software**.

---

Zentrun isn’t just an automation tool.
It’s your open source **decision automation platform**.
Welcome to Software 3.0.


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
