# Contributing to RepoTale

Thank you for your interest in contributing to **RepoTale**! We welcome contributions of all kinds: bug reports, documentation improvements, language AST parsers, UI polish, and feature enhancements.

By contributing to RepoTale, you agree that your contributions will be licensed under the [Apache 2.0 License](./LICENSE) and subject to our [Contributor License Agreement (CLA)](./CLA.md) and [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 🧭 Code of Conduct

RepoTale is committed to providing a welcoming, inclusive, and harassment-free community for everyone. Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating in issues, discussions, or pull requests.

---

## 🛠️ Development Setup

### Prerequisites
* **[Node.js](https://nodejs.org/)** (v18 or higher; v20 LTS recommended)
* **[npm](https://www.npmjs.com/)** or **[pnpm](https://pnpm.io/)**
* **[Git](https://git-scm.com/)**
* *(Optional for native desktop builds)*: **[Rust](https://rustup.rs/)** (v1.75+) and Tauri v2 OS dependencies.

### Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/RepoTale.git
   cd RepoTale
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run in Web Development Mode (Fast browser iteration):**
   ```bash
   npm run dev
   ```
   Open [http://localhost:1420](http://localhost:1420) in your browser.

4. **Run in Desktop Mode (Tauri v2 Shell):**
   ```bash
   npm run tauri dev
   ```

---

## 🏛️ Project Architecture Overview

* **`src-tauri/`** (Rust Core):
  * `src/git.rs`: Sandboxed shallow git ingestion (`git clone --depth 1`) in isolated temporary directories.
  * `src/ast/`: Deterministic Tree-sitter AST queries extracting functions, classes, imports, and call graphs.
  * `src/keychain.rs`: OS-native secure credential store (`keyring`) for BYOK API keys.
  * `src/llm/`: Prompts and streaming IPC clients for local Ollama and cloud LLMs.
  * `src/export.rs`: Dual-layer export pipeline (README.md additions & static GitHub Pages bundle).

* **`src/`** (React 18 + TypeScript Frontend):
  * `components/graph/`: Dynamic `@xyflow/react` canvas with Dagre hierarchical layout and smooth camera tracking.
  * `components/narrative/`: Chapter cards with `IntersectionObserver` scroll-spy synchronizing active subgraphs.
  * `components/sidecar/`: Conversational Q&A drawer grounded on extracted AST symbols.
  * `components/export/`: Preview and export modal for Markdown README and static HTML viewer.
  * `services/`: Tauri IPC bridge, LLM engine, sample stories, and export engine.

---

## 🌿 Contribution Workflow

1. **Create a topic branch from `main`:**
   ```bash
   git checkout -b feat/my-awesome-feature
   # or
   git checkout -b fix/canvas-zoom-glitch
   ```

2. **Branch Naming Conventions:**
   * `feat/<feature-name>`: New functionality
   * `fix/<bug-name>`: Bug fixes
   * `docs/<topic>`: Documentation updates
   * `refactor/<target>`: Code refactoring without behavioral changes

3. **Commit Messages (Conventional Commits):**
   Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   * `feat: add Go language Tree-sitter AST extractor`
   * `fix: correct camera bounds calculation on horizontal layout`
   * `docs: update quickstart instructions for Windows`
   * `chore: upgrade Tailwind CSS dependencies`

4. **Verify Quality Before Pushing:**
   ```bash
   # Run TypeScript strict type-check
   npm run lint
   ```

5. **Submit a Pull Request:**
   * Push your branch to your fork: `git push -u origin feat/my-awesome-feature`
   * Open a PR against `main` on the upstream RepoTale repository.
   * Fill out the provided [Pull Request Template](.github/pull_request_template.md).
   * Ensure the automated CI checks pass.

---

## 🔒 Security Vulnerabilities

If you discover a security vulnerability, please do **NOT** open a public issue. Follow the reporting guidelines outlined in our [Security Policy](./SECURITY.md).

Thank you for helping make RepoTale an incredible tool for developers everywhere!
