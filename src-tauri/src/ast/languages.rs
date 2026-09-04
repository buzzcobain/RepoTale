use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestInfo {
    pub repo_name: String,
    pub description: String,
    pub primary_language: String,
    pub frameworks: Vec<String>,
    pub entry_point: String,
}

pub fn sniff_manifest(repo_dir: &Path) -> ManifestInfo {
    let repo_name = repo_dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown-repo")
        .to_string();

    let mut primary_language = "Generic".to_string();
    let mut frameworks = Vec::new();
    let mut description = "An open-source repository analyzed with RepoTale.".to_string();
    let mut entry_point = "index".to_string();

    // 1. Check package.json (Node/TS/JS)
    let package_json_path = repo_dir.join("package.json");
    if package_json_path.exists() {
        primary_language = "TypeScript".to_string();
        if let Ok(content) = fs::read_to_string(&package_json_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(name) = json.get("name").and_then(|v| v.as_str()) {
                    // ignore if default placeholder
                    if name != "repo" {
                        // keep detected
                    }
                }
                if let Some(desc) = json.get("description").and_then(|v| v.as_str()) {
                    description = desc.to_string();
                }
                if let Some(main) = json.get("main").and_then(|v| v.as_str()) {
                    entry_point = main.to_string();
                }

                let deps = json.get("dependencies").and_then(|v| v.as_object());
                let dev_deps = json.get("devDependencies").and_then(|v| v.as_object());

                let mut check_dep = |name: &str, framework_name: &str| {
                    if (deps.map_or(false, |d| d.contains_key(name)))
                        || (dev_deps.map_or(false, |d| d.contains_key(name)))
                    {
                        frameworks.push(framework_name.to_string());
                    }
                };

                check_dep("react", "React");
                check_dep("next", "Next.js");
                check_dep("vue", "Vue.js");
                check_dep("express", "Express");
                check_dep("fastify", "Fastify");
                check_dep("tailwindcss", "Tailwind CSS");
                check_dep("@tauri-apps/api", "Tauri");
            }
        }
    }

    // 2. Check Cargo.toml (Rust)
    let cargo_toml_path = repo_dir.join("Cargo.toml");
    if cargo_toml_path.exists() {
        primary_language = "Rust".to_string();
        if repo_dir.join("src/main.rs").exists() {
            entry_point = "src/main.rs".to_string();
        } else if repo_dir.join("src/lib.rs").exists() {
            entry_point = "src/lib.rs".to_string();
        }

        if let Ok(content) = fs::read_to_string(&cargo_toml_path) {
            if content.contains("actix-web") {
                frameworks.push("Actix Web".to_string());
            }
            if content.contains("axum") {
                frameworks.push("Axum".to_string());
            }
            if content.contains("tokio") {
                frameworks.push("Tokio".to_string());
            }
            if content.contains("tauri") {
                frameworks.push("Tauri".to_string());
            }
        }
    }

    // 3. Check pyproject.toml / requirements.txt / setup.py (Python)
    let pyproject_path = repo_dir.join("pyproject.toml");
    let reqs_path = repo_dir.join("requirements.txt");
    if pyproject_path.exists() || reqs_path.exists() || repo_dir.join("setup.py").exists() {
        primary_language = "Python".to_string();
        if repo_dir.join("main.py").exists() {
            entry_point = "main.py".to_string();
        } else if repo_dir.join("app.py").exists() {
            entry_point = "app.py".to_string();
        }

        let py_text = fs::read_to_string(&pyproject_path)
            .unwrap_or_default()
            + &fs::read_to_string(&reqs_path).unwrap_or_default();
        if py_text.contains("fastapi") {
            frameworks.push("FastAPI".to_string());
        }
        if py_text.contains("django") {
            frameworks.push("Django".to_string());
        }
        if py_text.contains("flask") {
            frameworks.push("Flask".to_string());
        }
        if py_text.contains("torch") || py_text.contains("pytorch") {
            frameworks.push("PyTorch".to_string());
        }
    }

    // 4. Check go.mod (Go)
    let go_mod_path = repo_dir.join("go.mod");
    if go_mod_path.exists() {
        primary_language = "Go".to_string();
        entry_point = "main.go".to_string();
        if let Ok(content) = fs::read_to_string(&go_mod_path) {
            if content.contains("gin-gonic/gin") {
                frameworks.push("Gin".to_string());
            }
            if content.contains("gofiber/fiber") {
                frameworks.push("Fiber".to_string());
            }
        }
    }

    // Fallback search for common entrypoints if still default
    if entry_point == "index" {
        let candidates = ["src/index.ts", "src/index.js", "src/main.ts", "src/main.tsx", "src/App.tsx", "index.ts", "index.js", "src/main.rs", "main.py"];
        for c in candidates {
            if repo_dir.join(c).exists() {
                entry_point = c.to_string();
                break;
            }
        }
    }

    ManifestInfo {
        repo_name,
        description,
        primary_language,
        frameworks,
        entry_point,
    }
}
