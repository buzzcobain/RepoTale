# 🧭 RepoTale (`repotale.com`)

[![RepoTale Interactive Guide](https://img.shields.io/badge/RepoTale-Interactive_Tour-blue?style=for-the-badge&logo=compass)](https://repotale.com)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/buzzcobain/RepoTale/actions/workflows/ci.yml/badge.svg)](https://github.com/buzzcobain/RepoTale/actions/workflows/ci.yml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-blueviolet)](https://v2.tauri.app/)
[![React 18](https://img.shields.io/badge/React-18-blue)](https://react.dev)

> **RepoTale** is an open-source, local-first desktop application designed to ingest Git repositories, parse their Abstract Syntax Trees (AST) and architecture, and generate an interactive, chapter-driven parallax walkthrough paired with a dynamic visual code graph (`@xyflow/react` + Dagre), a context-grounded conversational Q&A sidecar, and automated GitHub-native documentation export pipelines.

---

## 💡 Why RepoTale?

RepoTale was created to solve two major, everyday developer headaches: **the cognitive overload of onboarding into unfamiliar codebases**, and **the friction of writing and maintaining good documentation**.

* 🧠 **Demystifying Complex Codebases:** When developers clone an unfamiliar repository, they are typically hit with hundreds of dense, unstructured files and minimal setup guides. RepoTale digests the repository's AST and architecture to present an intuitive, interactive story of how the system actually works—from entry points to business logic and data flow.
* 🗺️ **Visual, Step-by-Step Exploration:** Instead of dumping flat markdown or wall-of-text documentation, RepoTale pairs chapter-driven narrative cards with an interactive visual code graph. As you scroll through functional chapters, the graph dynamically illuminates connecting functions and zooms in on relevant code paths.
* 💬 **Context-Aware Architectural Q&A:** Static documentation cannot answer ad-hoc questions. RepoTale includes a built-in, local-first conversational sidecar where developers can ask specific architectural questions and receive grounded answers with direct file and line references.
* ✍️ **Automating the Documentation Chore:** Developers hate writing docs. Once you finish exploring a walkthrough, RepoTale can automatically commit a rich `README.md` (with native Mermaid diagrams and expandable chapters) or emit an interactive standalone web viewer directly to `/docs` for zero-config GitHub Pages hosting.
* 🛡️ **Local-First & Privacy by Default:** Designed to run 100% locally on your machine with local models (e.g. Ollama) without leaking private source code to third-party servers, while retaining the flexibility to connect to frontier cloud models (Gemini, Claude, GPT-4o) via user-provided API keys (BYOK).
* 🔁 **A Self-Sustaining Community Loop:** By embedding the official RepoTale badge into generated README files, every documented repository introduces new developers to interactive code exploration, creating an organic discovery loop across GitHub.

---

## 🌟 Key Architecture & Features

### 1. Sandboxed Ingestion & Tree-Sitter AST Parser (Rust / Tauri v2)
* **Sandboxed Shallow Clone:** Executes `git clone --depth 1` into an OS temporary folder (`std::env::temp_dir() / "repotale" / <uuid>`) with sanitized URLs to prevent command injection.
* **Manifest Sniffer:** Detects runtimes, entrypoints, and frameworks by inspecting `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc.
* **Tree-sitter AST Extraction:** Parses AST symbols (functions, classes, structs, methods, call-sites, and imports) across TypeScript, JavaScript, Python, and Rust.

### 2. Dual-Tier Inference Orchestrator
* **Local Tier (Default & Free):** Direct connection to `http://localhost:11434` (Ollama) with automatic model detection (`qwen2.5-coder:1.5b/3b`, `llama3.2:3b`).
* **Cloud Tier (BYOK):** Direct API connectors for Google Gemini (`gemini-2.0-flash`, `gemini-1.5-pro`), Anthropic Claude (`claude-3-5-sonnet`), and OpenAI (`gpt-4o`) using user-provided API keys stored securely in the OS keychain via the `keyring` crate.
* **Cost & Token Estimation:** Surfaces token counts and estimated costs prior to API dispatch.

### 3. Split-Screen Parallax & Visual Canvas
* **Left Pane (Narrative Walkthrough):** Scroll-driven chapter cards with sticky chapter progress indicators, syntax-highlighted code blocks, annotations, and reading progress bars.
* **Right Pane (Dynamic Graph Canvas):** `@xyflow/react` canvas with Dagre automated hierarchy layouts (`TB` or `LR`). Nodes represent functions/modules styled by type (`entry`, `middleware`, `service`, `data`, `utility`).
* **Scroll Choreography:** Synchronized `IntersectionObserver` smoothly zooms and pans the canvas camera to center the subgraph for the current chapter's `activeNodes`, applying glowing animated borders.

### 4. Grounded Conversational Q&A Sidecar
* Slide-out conversational copilot grounded in the repository's AST symbols, current chapter focus, and source code snippets with zero hallucination.
* Includes clickable symbol cards and file references.

### 5. Dual-Layer Documentation & Export Engine
* **Layer 1: Native GitHub `README.md` Additions:**
  - Official shields.io RepoTale badge.
  - Native GitHub `mermaid` flowchart matching the `callGraph`.
  - Collapsible `<details>` blocks for each chapter walkthrough.
* **Layer 2: Standalone Static Parallax Viewer (`/docs` Directory):**
  - Emits a self-contained, single-file HTML/JS/CSS bundle into `/docs/index.html` with pre-baked JSON state.
  - Zero-config hosting on **GitHub Pages** (`https://<username>.github.io/<repo>/`).

---

## 🛠️ Quickstart & Development

### Requirements
- Node.js >= 18
- npm or pnpm
- Rust toolchain (optional for Tauri desktop compilation, web mode runs via Vite)

### Installation

```bash
cd repotale
npm install
```

### Running in Web Dev Mode (Browser)

```bash
npm run dev
```

Visit `http://localhost:1420` in your browser. The app runs with full client-side fallbacks, sample repository previews, direct Ollama/Gemini connectors, and static export preview.

### Running with Tauri Desktop (Native OS Window)

```bash
npm run tauri dev
```

---

## 📄 Shared Data Contract: `RepoTaleStory`

```typescript
export interface RepoTaleStory {
  meta: {
    repoName: string;
    description: string;
    primaryLanguage: string;
    frameworks: string[];
    entryPoint: string;
  };
  callGraph: {
    nodes: Array<{
      id: string;
      label: string;
      type: "entry" | "middleware" | "service" | "data" | "utility";
      filePath: string;
      lineRange: [number, number];
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label?: string;
    }>;
  };
  chapters: Array<{
    id: string;
    chapterNumber: number;
    title: string;
    summary: string;
    narrative: string;
    activeNodes: string[];
    codeSnippets: Array<{
      filePath: string;
      startLine: number;
      endLine: number;
      code: string;
      annotation: string;
    }>;
  }>;
}
```

---

## 🔒 Security & Sandboxing

* Shallow git clones are strictly sandboxed within OS temporary directories.
* Repository URLs are sanitized against shell injection characters.
* API keys are accessed through native OS Keychain entries (`keyring` crate) without saving secrets in plain-text configuration files.

---

## 🤝 Contributing & Community

Contributions are warmly welcomed! RepoTale is an open-source community effort.

> **Branching Model:** We follow **GitHub Flow**. All features, bug fixes, and documentation improvements should be developed on topic branches (e.g., `feat/my-feature`, `fix/issue-description`) and submitted via pull requests targeting `main`.

* **[Contributing Guide](./CONTRIBUTING.md)**: Setup, branch conventions, and workflow.
* **[Code of Conduct](./CODE_OF_CONDUCT.md)**: Community standards and pledge.
* **[Contributor License Agreement (CLA)](./CLA.md)**: IP protection for contributors and users.
* **[Security Policy](./SECURITY.md)**: Vulnerability reporting procedures.

---

## 👥 Contributors

Huge thanks to all the amazing people who have contributed to RepoTale!

<p align="left">
  <a href="https://github.com/buzzcobain" title="buzzcobain">
    <img src="https://github.com/buzzcobain.png" width="48" height="48" style="border-radius: 50%;" alt="buzzcobain" />
  </a>
  <a href="https://github.com/bernalalexis-try" title="bernalalexis-try">
    <img src="https://github.com/bernalalexis-try.png" width="48" height="48" style="border-radius: 50%;" alt="bernalalexis-try" />
  </a>
</p>

<a href="https://github.com/buzzcobain/RepoTale/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=buzzcobain/RepoTale" alt="RepoTale Contributors" />
</a>

Contributions of any kind are welcome! Check out our **[Contributing Guide](./CONTRIBUTING.md)** to get involved.

---

## 📄 License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](./LICENSE) file for the full license text.

