use crate::ast::{AstCallGraphScaffold, ManifestInfo};
use serde_json::json;

pub fn build_system_prompt() -> &'static str {
    r#"You are RepoTale AI, an elite software architect and code storyteller.
Your mission is to analyze the provided repository architecture, manifest, AST call-graph scaffold, and file snippets, and generate an interactive, chapter-driven parallax walkthrough story paired with a call graph.

You MUST respond strictly with valid JSON conforming to the RepoTaleStory JSON schema below without any extra markdown formatting, commentary, or text outside the JSON block.

JSON Schema:
{
  "meta": {
    "repoName": "string",
    "description": "string",
    "primaryLanguage": "string",
    "frameworks": ["string"],
    "entryPoint": "string"
  },
  "callGraph": {
    "nodes": [
      {
        "id": "string (unique identifier, e.g. src/index.ts:bootstrap)",
        "label": "string (clean display symbol name)",
        "type": "entry" | "middleware" | "service" | "data" | "utility",
        "filePath": "string",
        "lineRange": [number, number]
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "string (matches a node id)",
        "target": "string (matches a node id)",
        "label": "string (optional edge description like calls, dispatches, reads)"
      }
    ]
  },
  "chapters": [
    {
      "id": "chapter-1",
      "chapterNumber": 1,
      "title": "string (e.g. Chapter 1: The Gateway & Ingestion Lifecycle)",
      "summary": "string (1-2 sentences high-level overview)",
      "narrative": "string (in-depth architectural explanation explaining data flow and design choices)",
      "activeNodes": ["string (IDs of nodes from callGraph that are active during this chapter)"],
      "codeSnippets": [
        {
          "filePath": "string",
          "startLine": number,
          "endLine": number,
          "code": "string (actual syntax snippet)",
          "annotation": "string (concise note explaining what this code block does in context)"
        }
      ]
    }
  ]
}

Guidelines:
1. Divide the codebase into 4 to 6 logical sequential chapters (e.g., 1. Ingestion & Entrypoint, 2. Middleware & Authentication/Routing, 3. Core Domain & Business Logic Services, 4. Data Layer & Storage, 5. Utilities & Error Handlers).
2. Every chapter must have meaningful codeSnippets with exact annotations and a list of activeNodes that correspond to nodes in the callGraph.
3. Ensure callGraph nodes have distinct types ('entry', 'middleware', 'service', 'data', 'utility') and valid edges representing true data/call flows.
"#
}

pub fn build_user_prompt(manifest: &ManifestInfo, scaffold: &AstCallGraphScaffold) -> String {
    let scaffold_summary = json!({
        "manifest": manifest,
        "nodes": scaffold.nodes,
        "edges": scaffold.edges,
        "keySymbols": scaffold.file_symbols.iter().take(20).map(|s| {
            json!({
                "name": s.name,
                "kind": s.kind,
                "filePath": s.file_path,
                "lines": [s.start_line, s.end_line],
                "type": s.node_type,
                "calls": s.calls,
                "snippet": s.snippet
            })
        }).collect::<Vec<_>>()
    });

    format!(
        "Generate the complete RepoTaleStory JSON for this repository:\n\nRepository: {}\nLanguage: {}\nFrameworks: {:?}\nEntry: {}\n\nScaffold Context:\n{}",
        manifest.repo_name,
        manifest.primary_language,
        manifest.frameworks,
        manifest.entry_point,
        scaffold_summary.to_string()
    )
}

pub fn estimate_tokens(text: &str) -> usize {
    // Rough estimation: 1 token ~= 4 characters for English and code
    (text.len() + 3) / 4
}
