# Contributing to RepoTale

Thank you for your interest in contributing to **RepoTale**!

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Rust](https://rustup.rs/) (for Tauri desktop app builds)
- [Git](https://git-scm.com/)

### Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/buzzcobain/RepoTale.git
   cd RepoTale
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in Web Development Mode:
   ```bash
   npm run dev
   ```

4. Run in Desktop App Mode (Tauri v2):
   ```bash
   npm run tauri dev
   ```

## Project Architecture

- **`src-tauri/`**: Rust backend handling shallow git sandboxing, Tree-sitter AST queries, native OS Keychain storage (`keyring`), and LLM orchestrator.
- **`src/`**: React 18 + TypeScript frontend canvas.
  - `components/graph/`: Dynamic `@xyflow/react` canvas with Dagre automated layouts.
  - `components/narrative/`: Chapter-by-chapter walkthrough with synchronized scroll spy.
  - `components/sidecar/`: Context-grounded architectural Q&A sidecar.
  - `components/export/`: Dual-layer exporter (README additions & static `/docs/index.html` viewer).
  - `services/`: Tauri bridge, LLM engine, and sample stories.

## Pull Request Guidelines

- Ensure `npm run build` succeeds without any TypeScript errors.
- Follow conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Open a PR against the `main` branch.
