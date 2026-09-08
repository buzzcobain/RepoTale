use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPayload {
    pub story_json: String,
    pub target_dir: String,
    pub create_git_branch: bool,
    pub branch_name: Option<String>,
    pub github_username: Option<String>,
    pub repo_name: Option<String>,
    pub update_readme: Option<bool>,
    pub push_to_remote: Option<bool>,
    pub html_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub readme_addition: String,
    pub static_html_path: String,
    pub branch_created: bool,
    pub pushed_to_remote: bool,
    pub pr_url: Option<String>,
}

pub fn generate_markdown_readme(story_json_str: &str, github_user: &str, repo_name: &str) -> Result<String> {
    let story: serde_json::Value = serde_json::from_str(story_json_str)?;

    let meta = &story["meta"];
    let chapters = story["chapters"].as_array().ok_or_else(|| anyhow!("Invalid chapters in story"))?;
    let nodes = story["callGraph"]["nodes"].as_array().ok_or_else(|| anyhow!("Invalid nodes in story"))?;
    let edges = story["callGraph"]["edges"].as_array().ok_or_else(|| anyhow!("Invalid edges in story"))?;

    let name = meta["repoName"].as_str().unwrap_or(repo_name);
    let desc = meta["description"].as_str().unwrap_or("");
    let lang = meta["primaryLanguage"].as_str().unwrap_or("Code");

    let mut md = String::new();

    // Official Badge
    md.push_str(&format!(
        "[![RepoTale Interactive Guide](https://img.shields.io/badge/RepoTale-Interactive_Tour-blue?style=for-the-badge&logo=compass)](https://{}.github.io/{}/)\n\n",
        github_user, repo_name
    ));

    md.push_str(&format!("## 🗺️ RepoTale Architecture Walkthrough: {}\n\n", name));
    if !desc.is_empty() {
        md.push_str(&format!("_{}_\n\n", desc));
    }

    // Mermaid Diagram
    md.push_str("### 📊 System Call Graph\n\n```mermaid\nflowchart TD\n");
    for node in nodes {
        let id = node["id"].as_str().unwrap_or("").replace([':', '/', '.', '-'], "_");
        let label = node["label"].as_str().unwrap_or("");
        let ntype = node["type"].as_str().unwrap_or("utility");

        let shape = match ntype {
            "entry" => format!("{}[[\"🚀 {}\"]]", id, label),
            "service" => format!("{}(\"⚙️ {}\")", id, label),
            "data" => format!("{}[(\"💾 {}\")]", id, label),
            "middleware" => format!("{}{{\"🛡️ {}\"}}", id, label),
            _ => format!("{}[\"🔧 {}\"]", id, label),
        };
        md.push_str(&format!("    {}\n", shape));
    }

    for edge in edges {
        let src = edge["source"].as_str().unwrap_or("").replace([':', '/', '.', '-'], "_");
        let tgt = edge["target"].as_str().unwrap_or("").replace([':', '/', '.', '-'], "_");
        if let Some(lbl) = edge["label"].as_str() {
            md.push_str(&format!("    {} -->|\"{}\"| {}\n", src, lbl, tgt));
        } else {
            md.push_str(&format!("    {} --> {}\n", src, tgt));
        }
    }
    md.push_str("```\n\n");

    // Collapsible Chapters
    md.push_str("### 📖 Chapter-by-Chapter Guided Tour\n\n");
    for chapter in chapters {
        let num = chapter["chapterNumber"].as_i64().unwrap_or(1);
        let title = chapter["title"].as_str().unwrap_or("");
        let summary = chapter["summary"].as_str().unwrap_or("");
        let narrative = chapter["narrative"].as_str().unwrap_or("");

        md.push_str(&format!("<details>\n<summary><b>Chapter {}: {}</b></summary>\n\n", num, title));
        md.push_str(&format!("> **Summary:** {}\n\n", summary));
        md.push_str(&format!("{}\n\n", narrative));

        if let Some(snippets) = chapter["codeSnippets"].as_array() {
            for snip in snippets {
                let file = snip["filePath"].as_str().unwrap_or("");
                let start = snip["startLine"].as_i64().unwrap_or(1);
                let end = snip["endLine"].as_i64().unwrap_or(1);
                let code = snip["code"].as_str().unwrap_or("");
                let annotation = snip["annotation"].as_str().unwrap_or("");

                md.push_str(&format!("#### 📄 `{}` (Lines {}-{})\n\n", file, start, end));
                if !annotation.is_empty() {
                    md.push_str(&format!("_{}_\n\n", annotation));
                }
                md.push_str(&format!("```{}\n{}\n```\n\n", lang.to_lowercase(), code));
            }
        }
        md.push_str("</details>\n\n");
    }

    md.push_str("---\n*Generated with ❤️ by [RepoTale](https://repotale.com) — The Interactive Codebase Storyteller.*\n");

    Ok(md)
}

pub fn generate_standalone_html(story_json_str: &str) -> String {
    format!(r#"<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepoTale — Interactive Codebase Story</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Inter', sans-serif; }}
    pre, code {{ font-family: 'Fira Code', monospace; }}
    .active-card {{ border-color: #6366f1; box-shadow: 0 0 25px rgba(99, 102, 241, 0.35); }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-2xl">🧭</span>
      <div>
        <h1 id="header-repo-name" class="font-bold text-lg text-white">RepoTale Guide</h1>
        <p id="header-desc" class="text-xs text-slate-400">Interactive Codebase Walkthrough</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span id="badge-lang" class="px-2.5 py-1 text-xs rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50"></span>
      <a href="https://repotale.com" target="_blank" class="text-xs text-indigo-400 hover:underline">Powered by RepoTale</a>
    </div>
  </header>

  <main class="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">
    <!-- Left Narrative Pane -->
    <div id="narrative-pane" class="lg:col-span-6 p-6 lg:p-10 space-y-12 overflow-y-auto max-h-[calc(100vh-65px)] border-r border-slate-800">
    </div>

    <!-- Right Flow / Diagram Canvas -->
    <div class="lg:col-span-6 p-6 lg:p-8 sticky top-[65px] h-[calc(100vh-65px)] bg-slate-900/40 flex flex-col justify-between overflow-hidden">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-400">Architecture Call Graph</h2>
        <span id="graph-hint" class="text-xs text-indigo-400">Synchronized with scroll</span>
      </div>
      <div id="mermaid-graph" class="mermaid flex-1 flex items-center justify-center p-4 overflow-auto">
      </div>
      <div id="active-nodes-pill" class="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span id="active-node-text">Scroll through chapters to explore active nodes</span>
      </div>
    </div>
  </main>

  <script>
    const STORY_DATA = {story_json_str};

    mermaid.initialize({{ startOnLoad: false, theme: 'dark', securityLevel: 'loose' }});

    document.getElementById('header-repo-name').innerText = STORY_DATA.meta.repoName;
    document.getElementById('header-desc').innerText = STORY_DATA.meta.description || 'Interactive Architecture Story';
    document.getElementById('badge-lang').innerText = STORY_DATA.meta.primaryLanguage;

    // Render Mermaid
    function renderMermaidGraph() {{
      let code = 'flowchart TD\n';
      (STORY_DATA.callGraph.nodes || []).forEach(n => {{
        const safeId = n.id.replace(/[:/.-]/g, '_');
        code += `  ${{safeId}}["${{n.label}}"]\n`;
      }});
      (STORY_DATA.callGraph.edges || []).forEach(e => {{
        const s = e.source.replace(/[:/.-]/g, '_');
        const t = e.target.replace(/[:/.-]/g, '_');
        code += `  ${{s}} --> ${{t}}\n`;
      }});
      const container = document.getElementById('mermaid-graph');
      container.innerHTML = code;
      mermaid.run({{ nodes: [container] }});
    }}

    // Render Chapters
    const narrativePane = document.getElementById('narrative-pane');
    (STORY_DATA.chapters || []).forEach((chap, idx) => {{
      const card = document.createElement('div');
      card.className = 'chapter-card border border-slate-800 bg-slate-900/60 rounded-xl p-6 transition-all duration-300';
      card.setAttribute('data-index', idx);

      let snippetsHtml = '';
      (chap.codeSnippets || []).forEach(s => {{
        snippetsHtml += `
          <div class="mt-4 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
            <div class="px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400 flex justify-between">
              <span>📄 ${{s.filePath}}:${{s.startLine}}-${{s.endLine}}</span>
              <span class="text-indigo-400">${{s.annotation || ''}}</span>
            </div>
            <pre class="p-4 text-xs font-mono text-indigo-200 overflow-x-auto"><code>${{escapeHtml(s.code)}}</code></pre>
          </div>
        `;
      }});

      card.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
          <span class="px-2 py-0.5 text-xs font-bold rounded bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">Chapter ${{chap.chapterNumber}}</span>
          <h3 class="text-xl font-bold text-white">${{chap.title}}</h3>
        </div>
        <p class="text-sm font-medium text-slate-300 mb-4">${{chap.summary}}</p>
        <p class="text-sm text-slate-400 leading-relaxed">${{chap.narrative}}</p>
        ${{snippetsHtml}}
      `;
      narrativePane.appendChild(card);
    }});

    function escapeHtml(str) {{
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }}

    // Scroll spy
    const observer = new IntersectionObserver((entries) => {{
      entries.forEach(entry => {{
        if (entry.isIntersecting) {{
          document.querySelectorAll('.chapter-card').forEach(c => c.classList.remove('active-card'));
          entry.target.classList.add('active-card');
          const idx = parseInt(entry.target.getAttribute('data-index'));
          const activeChap = STORY_DATA.chapters[idx];
          if (activeChap) {{
            document.getElementById('active-node-text').innerText = 'Active Focus: ' + (activeChap.activeNodes || []).join(', ');
          }}
        }}
      }});
    }}, {{ root: narrativePane, threshold: 0.5 }});

    document.querySelectorAll('.chapter-card').forEach(c => observer.observe(c));
    renderMermaidGraph();
  </script>
</body>
</html>"#)
}

pub fn export_all(payload: &ExportPayload) -> Result<ExportResult> {
    let target = Path::new(&payload.target_dir);
    if !target.exists() {
        return Err(anyhow!("Target repository directory does not exist"));
    }

    let github_user = payload.github_username.as_deref().unwrap_or("username");
    let repo_name = payload.repo_name.as_deref().unwrap_or("repository");

    // 1. Markdown README addition
    let readme_addition = generate_markdown_readme(&payload.story_json, github_user, repo_name)?;
    let repotale_md_path = target.join("REPOTALE.md");
    fs::write(&repotale_md_path, &readme_addition)?;

    // Update README.md in place
    if payload.update_readme.unwrap_or(true) {
        let readme_path = target.join("README.md");
        if readme_path.exists() {
            let current = fs::read_to_string(&readme_path).unwrap_or_default();
            if !current.contains("RepoTale Interactive Guide") {
                let updated = format!("{}\n\n---\n\n{}", current.trim_end(), readme_addition);
                let _ = fs::write(&readme_path, updated);
            }
        } else {
            let _ = fs::write(&readme_path, &readme_addition);
        }
    }

    // 2. Standalone static HTML into /docs/index.html
    let docs_dir = target.join("docs");
    fs::create_dir_all(&docs_dir)?;
    let static_html = payload
        .html_content
        .clone()
        .unwrap_or_else(|| generate_standalone_html(&payload.story_json));
    let html_path = docs_dir.join("index.html");
    fs::write(&html_path, &static_html)?;

    // 3. Git branch creation and remote push using repository git/SSH credentials
    let mut branch_created = false;
    let mut pushed_to_remote = false;
    let mut pr_url = None;

    if payload.create_git_branch {
        let branch = payload.branch_name.as_deref().unwrap_or("docs/repotale-guide");
        let _ = Command::new("git")
            .current_dir(target)
            .args(["checkout", "-B", branch])
            .status();

        let _ = Command::new("git")
            .current_dir(target)
            .args(["add", "README.md", "REPOTALE.md", "docs/index.html"])
            .status();

        let status = Command::new("git")
            .current_dir(target)
            .args(["commit", "-m", "docs: add RepoTale interactive walkthrough guide and static viewer"])
            .status();

        branch_created = status.map(|s| s.success()).unwrap_or(false);

        if payload.push_to_remote.unwrap_or(true) {
            let push_status = Command::new("git")
                .current_dir(target)
                .args(["push", "-u", "origin", branch])
                .status();
            pushed_to_remote = push_status.map(|s| s.success()).unwrap_or(false);
            if pushed_to_remote {
                pr_url = Some(format!("https://github.com/{}/{}/pull/new/{}", github_user, repo_name, branch));
            }
        }
    }

    Ok(ExportResult {
        readme_addition,
        static_html_path: html_path.to_string_lossy().to_string(),
        branch_created,
        pushed_to_remote,
        pr_url,
    })
}
