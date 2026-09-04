use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;
use walkdir::WalkDir;
use tree_sitter::{Parser, Query, QueryCursor};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstSymbol {
    pub name: String,
    pub kind: String, // "function", "class", "struct", "interface", "method"
    pub file_path: String,
    pub start_line: usize,
    pub end_line: usize,
    pub node_type: String, // "entry", "middleware", "service", "data", "utility"
    pub calls: Vec<String>,
    pub imports: Vec<String>,
    pub snippet: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstCallGraphScaffold {
    pub nodes: Vec<AstNodeScaffold>,
    pub edges: Vec<AstEdgeScaffold>,
    pub file_symbols: Vec<AstSymbol>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstNodeScaffold {
    pub id: String,
    pub label: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub file_path: String,
    pub line_range: (usize, usize),
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstEdgeScaffold {
    pub id: String,
    pub source: String,
    pub target: String,
    pub label: Option<String>,
}

pub struct RepoAstParser {
    ts_parser: Parser,
    python_parser: Parser,
    rust_parser: Parser,
}

impl RepoAstParser {
    pub fn new() -> Self {
        let mut ts_parser = Parser::new();
        let _ = ts_parser.set_language(&tree_sitter_typescript::language_typescript());

        let mut python_parser = Parser::new();
        let _ = python_parser.set_language(&tree_sitter_python::language());

        let mut rust_parser = Parser::new();
        let _ = rust_parser.set_language(&tree_sitter_rust::language());

        Self {
            ts_parser,
            python_parser,
            rust_parser,
        }
    }

    pub fn parse_repository(&mut self, repo_dir: &Path) -> AstCallGraphScaffold {
        let mut symbols = Vec::new();
        let mut nodes = Vec::new();
        let mut edges = Vec::new();

        for entry in WalkDir::new(repo_dir)
            .max_depth(6)
            .into_iter()
            .filter_entry(|e| !is_ignored(e.path()))
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file() {
                let rel_path = path.strip_prefix(repo_dir)
                    .unwrap_or(path)
                    .to_string_lossy()
                    .replace('\\', "/");

                if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                    match ext {
                        "ts" | "tsx" | "js" | "jsx" => {
                            let file_symbols = self.parse_ts_file(path, &rel_path);
                            symbols.extend(file_symbols);
                        }
                        "py" => {
                            let file_symbols = self.parse_py_file(path, &rel_path);
                            symbols.extend(file_symbols);
                        }
                        "rs" => {
                            let file_symbols = self.parse_rs_file(path, &rel_path);
                            symbols.extend(file_symbols);
                        }
                        _ => {}
                    }
                }
            }
        }

        // Convert symbols to nodes
        for sym in &symbols {
            let id = format!("{}:{}", sym.file_path, sym.name);
            nodes.push(AstNodeScaffold {
                id: id.clone(),
                label: sym.name.clone(),
                node_type: sym.node_type.clone(),
                file_path: sym.file_path.clone(),
                line_range: (sym.start_line, sym.end_line),
                description: format!("{} in {}", sym.kind, sym.file_path),
            });
        }

        // Construct edges based on call relationships and file imports
        let mut edge_count = 0;
        for sym in &symbols {
            let source_id = format!("{}:{}", sym.file_path, sym.name);
            for called_fn in &sym.calls {
                // Find matching target symbol
                if let Some(target_sym) = symbols.iter().find(|s| &s.name == called_fn && s.file_path != sym.file_path) {
                    let target_id = format!("{}:{}", target_sym.file_path, target_sym.name);
                    edge_count += 1;
                    edges.push(AstEdgeScaffold {
                        id: format!("e{}", edge_count),
                        source: source_id.clone(),
                        target: target_id,
                        label: Some("calls".to_string()),
                    });
                }
            }
        }

        AstCallGraphScaffold {
            nodes,
            edges,
            file_symbols: symbols,
        }
    }

    fn parse_ts_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let mut symbols = Vec::new();
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return symbols,
        };

        let tree = match self.ts_parser.parse(&content, None) {
            Some(t) => t,
            None => return symbols,
        };

        let lines: Vec<&str> = content.lines().collect();
        let query_str = r#"
            (function_declaration name: (identifier) @fn.name) @fn.def
            (class_declaration name: (type_identifier) @class.name) @class.def
            (method_definition name: (property_identifier) @method.name) @method.def
            (export_statement declaration: (lexical_declaration (variable_declarator name: (identifier) @var.name))) @var.def
        "#;

        if let Ok(query) = Query::new(&tree_sitter_typescript::language_typescript(), query_str) {
            let mut cursor = QueryCursor::new();
            let matches = cursor.matches(&query, tree.root_node(), content.as_bytes());

            for m in matches {
                for cap in m.captures {
                    let node = cap.node;
                    let text = node.utf8_text(content.as_bytes()).unwrap_or("").to_string();
                    let start_line = node.start_position().row + 1;
                    let end_line = node.end_position().row + 1;

                    let (kind, name) = if cap.index == 0 || cap.index == 1 {
                        ("function", text)
                    } else if cap.index == 2 || cap.index == 3 {
                        ("class", text)
                    } else {
                        ("service", text)
                    };

                    let node_type = classify_node_type(rel_path, &name);
                    let snippet = get_snippet(&lines, start_line, end_line);

                    symbols.push(AstSymbol {
                        name,
                        kind: kind.to_string(),
                        file_path: rel_path.to_string(),
                        start_line,
                        end_line,
                        node_type,
                        calls: extract_calls(&content, start_line, end_line),
                        imports: Vec::new(),
                        snippet,
                    });
                }
            }
        }

        // Fallback simple regex extraction if tree-sitter returned empty
        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "ts");
        }

        symbols
    }

    fn parse_py_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let mut symbols = Vec::new();
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return symbols,
        };

        let tree = match self.python_parser.parse(&content, None) {
            Some(t) => t,
            None => return symbols,
        };

        let lines: Vec<&str> = content.lines().collect();
        let query_str = r#"
            (function_definition name: (identifier) @fn.name) @fn.def
            (class_definition name: (identifier) @class.name) @class.def
        "#;

        if let Ok(query) = Query::new(&tree_sitter_python::language(), query_str) {
            let mut cursor = QueryCursor::new();
            let matches = cursor.matches(&query, tree.root_node(), content.as_bytes());

            for m in matches {
                for cap in m.captures {
                    let node = cap.node;
                    let name = node.utf8_text(content.as_bytes()).unwrap_or("").to_string();
                    let start_line = node.start_position().row + 1;
                    let end_line = node.end_position().row + 1;
                    let kind = if cap.index == 0 { "function" } else { "class" };
                    let node_type = classify_node_type(rel_path, &name);
                    let snippet = get_snippet(&lines, start_line, end_line);

                    symbols.push(AstSymbol {
                        name,
                        kind: kind.to_string(),
                        file_path: rel_path.to_string(),
                        start_line,
                        end_line,
                        node_type,
                        calls: extract_calls(&content, start_line, end_line),
                        imports: Vec::new(),
                        snippet,
                    });
                }
            }
        }

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "py");
        }

        symbols
    }

    fn parse_rs_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let mut symbols = Vec::new();
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return symbols,
        };

        let tree = match self.rust_parser.parse(&content, None) {
            Some(t) => t,
            None => return symbols,
        };

        let lines: Vec<&str> = content.lines().collect();
        let query_str = r#"
            (function_item name: (identifier) @fn.name) @fn.def
            (struct_item name: (type_identifier) @struct.name) @struct.def
            (enum_item name: (type_identifier) @enum.name) @enum.def
        "#;

        if let Ok(query) = Query::new(&tree_sitter_rust::language(), query_str) {
            let mut cursor = QueryCursor::new();
            let matches = cursor.matches(&query, tree.root_node(), content.as_bytes());

            for m in matches {
                for cap in m.captures {
                    let node = cap.node;
                    let name = node.utf8_text(content.as_bytes()).unwrap_or("").to_string();
                    let start_line = node.start_position().row + 1;
                    let end_line = node.end_position().row + 1;
                    let kind = if cap.index == 0 { "function" } else { "struct" };
                    let node_type = classify_node_type(rel_path, &name);
                    let snippet = get_snippet(&lines, start_line, end_line);

                    symbols.push(AstSymbol {
                        name,
                        kind: kind.to_string(),
                        file_path: rel_path.to_string(),
                        start_line,
                        end_line,
                        node_type,
                        calls: extract_calls(&content, start_line, end_line),
                        imports: Vec::new(),
                        snippet,
                    });
                }
            }
        }

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "rs");
        }

        symbols
    }
}

fn is_ignored(path: &Path) -> bool {
    let s = path.to_string_lossy();
    s.contains("/.git")
        || s.contains("/node_modules")
        || s.contains("/target")
        || s.contains("/dist")
        || s.contains("/build")
        || s.contains("/.venv")
        || s.contains("/__pycache__")
}

fn classify_node_type(file_path: &str, symbol_name: &str) -> String {
    let lower_path = file_path.to_lowercase();
    let lower_name = symbol_name.to_lowercase();

    if lower_path.contains("main") || lower_path.contains("index") || lower_path.contains("app") || lower_name == "main" || lower_name == "run" {
        "entry".to_string()
    } else if lower_path.contains("middleware") || lower_path.contains("auth") || lower_path.contains("guard") || lower_name.contains("middleware") {
        "middleware".to_string()
    } else if lower_path.contains("service") || lower_path.contains("controller") || lower_path.contains("api") || lower_path.contains("manager") || lower_name.contains("service") {
        "service".to_string()
    } else if lower_path.contains("model") || lower_path.contains("schema") || lower_path.contains("db") || lower_path.contains("store") || lower_path.contains("repo") {
        "data".to_string()
    } else {
        "utility".to_string()
    }
}

fn get_snippet(lines: &[&str], start: usize, end: usize) -> String {
    if start == 0 || start > lines.len() {
        return "".to_string();
    }
    let s = start - 1;
    let e = end.min(lines.len());
    lines[s..e].join("\n")
}

fn extract_calls(content: &str, start_line: usize, end_line: usize) -> Vec<String> {
    let lines: Vec<&str> = content.lines().collect();
    if start_line == 0 || start_line > lines.len() {
        return Vec::new();
    }
    let snippet = lines[(start_line - 1)..end_line.min(lines.len())].join("\n");
    let re = regex::Regex::new(r"([a-zA-Z0-9_]+)\(").unwrap();
    let mut calls = Vec::new();
    for cap in re.captures_iter(&snippet) {
        if let Some(m) = cap.get(1) {
            let name = m.as_str().to_string();
            if !calls.contains(&name) && name != "if" && name != "for" && name != "while" && name != "switch" {
                calls.push(name);
            }
        }
    }
    calls
}

fn fallback_extract_symbols(content: &str, file_path: &str, ext: &str) -> Vec<AstSymbol> {
    let mut symbols = Vec::new();
    let lines: Vec<&str> = content.lines().collect();

    let re = match ext {
        "ts" | "js" => regex::Regex::new(r"(?:export\s+)?(?:async\s+)?(?:function|class|const)\s+([a-zA-Z0-9_]+)").unwrap(),
        "py" => regex::Regex::new(r"(?:def|class)\s+([a-zA-Z0-9_]+)").unwrap(),
        "rs" => regex::Regex::new(r"(?:pub\s+)?(?:fn|struct|enum|trait)\s+([a-zA-Z0-9_]+)").unwrap(),
        _ => return symbols,
    };

    for (idx, line) in lines.iter().enumerate() {
        if let Some(cap) = re.captures(line) {
            if let Some(name_match) = cap.get(1) {
                let name = name_match.as_str().to_string();
                let start_line = idx + 1;
                let end_line = (start_line + 15).min(lines.len());
                let node_type = classify_node_type(file_path, &name);
                let snippet = get_snippet(&lines, start_line, end_line);

                symbols.push(AstSymbol {
                    name: name.clone(),
                    kind: "symbol".to_string(),
                    file_path: file_path.to_string(),
                    start_line,
                    end_line,
                    node_type,
                    calls: extract_calls(content, start_line, end_line),
                    imports: Vec::new(),
                    snippet,
                });
            }
        }
    }
    symbols
}
