# Security Policy

The RepoTale team takes the security of our application and our users seriously. This document outlines our security measures, supported versions, and how to responsibly report vulnerabilities.

---

## 🛡️ Security Architecture & Threat Model

RepoTale is designed local-first with several defensive architectural boundaries:

1. **Sandboxed Git Ingestion:**
   - Git repository URLs are sanitized against shell injection, flags, and malformed protocols.
   - Clones execute shallow checkouts (`--depth 1`) in isolated OS temporary directories (`std::env::temp_dir() / "repotale" / <uuid>`).
   - Temporary directories are cleaned up immediately following AST extraction.

2. **Credential Safety (BYOK):**
   - Cloud API keys (Gemini, Anthropic, OpenAI) are **never** logged, tracked in git, or written to plain text configuration files.
   - In native desktop mode, credentials are stored in your operating system's native secure store (macOS Keychain, Windows Credential Manager, Linux Secret Service) via the `keyring` crate.

3. **AST Extraction Without Code Execution:**
   - Tree-sitter parsers statically analyze source code ASTs without executing runtime binaries or evaluation hooks (`eval()`, `exec()`, etc.).

---

## Supported Versions

We release patches for security vulnerabilities on the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a potential security vulnerability in RepoTale, please report it privately:

1. **GitHub Security Advisory (Preferred):**
   - Navigate to the **Security** tab of the RepoTale repository on GitHub.
   - Click **Report a vulnerability** to open a private draft advisory.
2. **Email Disclosure:**
   - Send an email to **`security@repotale.com`** with:
     - Description of the vulnerability and potential impact.
     - Step-by-step reproduction instructions or a Proof of Concept (PoC).
     - Any proposed fixes or remediations.

### Our Response Timeline:
* **Initial Response:** Within 48 hours acknowledging receipt of your report.
* **Assessment & Triaging:** Within 5 business days confirming validity and assigning severity (CVSS).
* **Fix & Coordinated Release:** We aim to release a patch within 14 days of confirmation, after which public attribution is granted in release notes (unless anonymity is requested).

Thank you for helping keep RepoTale and our community safe!
