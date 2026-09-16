use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;
use std::collections::HashSet;
use std::sync::LazyLock;
use walkdir::WalkDir;
use tree_sitter::{Language, Node, Parser, Query, QueryCursor, Tree};

static FALLBACK_CALL_RE: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r"([a-zA-Z0-9_]+)\(").unwrap()
});

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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cluster: Option<String>,
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
    go_parser: Parser,
    java_parser: Parser,
    csharp_parser: Parser,
}

impl RepoAstParser {
    pub fn new() -> Self {
        let mut ts_parser = Parser::new();
        let ts_lang: Language = tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into();
        let _ = ts_parser.set_language(&ts_lang);

        let mut python_parser = Parser::new();
        let py_lang: Language = tree_sitter_python::LANGUAGE.into();
        let _ = python_parser.set_language(&py_lang);

        let mut rust_parser = Parser::new();
        let rs_lang: Language = tree_sitter_rust::LANGUAGE.into();
        let _ = rust_parser.set_language(&rs_lang);

        let mut go_parser = Parser::new();
        let go_lang: Language = tree_sitter_go::LANGUAGE.into();
        let _ = go_parser.set_language(&go_lang);

        let mut java_parser = Parser::new();
        let java_lang: Language = tree_sitter_java::LANGUAGE.into();
        let _ = java_parser.set_language(&java_lang);

        let mut csharp_parser = Parser::new();
        let cs_lang: Language = tree_sitter_c_sharp::LANGUAGE.into();
        let _ = csharp_parser.set_language(&cs_lang);

        Self {
            ts_parser,
            python_parser,
            rust_parser,
            go_parser,
            java_parser,
            csharp_parser,
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
                        "go" => {
                            let file_symbols = self.parse_go_file(path, &rel_path);
                            symbols.extend(file_symbols);
                        }
                        "java" => {
                            let file_symbols = self.parse_java_file(path, &rel_path);
                            symbols.extend(file_symbols);
                        }
                        "cs" => {
                            let file_symbols = self.parse_cs_file(path, &rel_path);
                            symbols.extend(file_symbols);
                        }
                        _ => {}
                    }
                }
            }
        }

        // Convert symbols to nodes with semantic cluster grouping
        for sym in &symbols {
            let id = format!("{}:{}", sym.file_path, sym.name);
            let cluster = extract_module_cluster(&sym.file_path);
            nodes.push(AstNodeScaffold {
                id: id.clone(),
                label: sym.name.clone(),
                node_type: sym.node_type.clone(),
                file_path: sym.file_path.clone(),
                line_range: (sym.start_line, sym.end_line),
                description: format!("{} in {}", sym.kind, sym.file_path),
                cluster: Some(cluster),
            });
        }

        // Construct edges based on deterministic call relationships and import scopes
        let mut edge_count = 0;
        let mut created_edges = HashSet::new();

        for sym in &symbols {
            let source_id = format!("{}:{}", sym.file_path, sym.name);
            let source_dir = Path::new(&sym.file_path)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();

            for called_fn in &sym.calls {
                // Find potential target symbols matching called name
                let matching_targets: Vec<&AstSymbol> = symbols
                    .iter()
                    .filter(|s| &s.name == called_fn && s.file_path != sym.file_path)
                    .collect();

                if matching_targets.is_empty() {
                    continue;
                }

                // Resolve best candidate using imports and module proximity
                let best_target = matching_targets.iter().copied().find(|target| {
                    let target_file_no_ext = Path::new(&target.file_path)
                        .file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_default();

                    let target_dir = Path::new(&target.file_path)
                        .parent()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_default();

                    // 1. Direct import or namespace/package match
                    let imported = sym.imports.iter().any(|imp| {
                        let imp_last = imp.split(&['.', '/', ':']).last().unwrap_or(imp);
                        imp.contains(&target.file_path)
                            || imp.contains(&target_file_no_ext)
                            || imp.contains(&target.name)
                            || (!target_dir.is_empty() && (imp_last.eq_ignore_ascii_case(&target_dir) || imp.to_lowercase().contains(&target_dir.to_lowercase())))
                    });
                    if imported {
                        return true;
                    }

                    // 2. Same directory / package module proximity
                    if !source_dir.is_empty() && source_dir == target_dir {
                        return true;
                    }

                    false
                }).or_else(|| {
                    // 3. Fallback: only connect if target is unambiguous across repo
                    if matching_targets.len() == 1 {
                        let target = matching_targets[0];
                        let is_common_name = matches!(
                            called_fn.as_str(),
                            "new" | "get" | "set" | "run" | "init" | "handle" | "save" | "find" | "create" | "update" | "delete" | "validate"
                        );
                        if !is_common_name || target.node_type == "service" || target.node_type == "entry" {
                            return Some(target);
                        }
                    }
                    None
                });

                if let Some(target_sym) = best_target {
                    let target_id = format!("{}:{}", target_sym.file_path, target_sym.name);
                    let edge_key = (source_id.clone(), target_id.clone());
                    if !created_edges.contains(&edge_key) {
                        created_edges.insert(edge_key);
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
        }

        AstCallGraphScaffold {
            nodes,
            edges,
            file_symbols: symbols,
        }
    }

    fn parse_ts_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let tree = match self.ts_parser.parse(&content, None) {
            Some(t) => t,
            None => return Vec::new(),
        };

        let lang: Language = tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into();
        let imports = collect_query_texts(&lang, TS_IMPORT_QUERY, &tree, &content);

        let mut symbols = build_symbols(
            &lang,
            TS_SYMBOL_QUERY,
            Some(TS_CALL_QUERY),
            &tree,
            &content,
            rel_path,
            &imports,
            &|file_path, name, kind, _decorators| {
                if kind == "interface" || kind == "type" {
                    return "data".to_string();
                }
                classify_node_type(file_path, name)
            },
        );

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "ts");
        }

        symbols
    }

    fn parse_py_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let tree = match self.python_parser.parse(&content, None) {
            Some(t) => t,
            None => return Vec::new(),
        };

        let lang: Language = tree_sitter_python::LANGUAGE.into();
        let imports = collect_query_texts(&lang, PY_IMPORT_QUERY, &tree, &content);

        let mut symbols = build_symbols(
            &lang,
            PY_SYMBOL_QUERY,
            Some(PY_CALL_QUERY),
            &tree,
            &content,
            rel_path,
            &imports,
            &|file_path, name, _kind, _decorators| {
                classify_node_type(file_path, name)
            },
        );

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "py");
        }

        symbols
    }

    fn parse_rs_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let tree = match self.rust_parser.parse(&content, None) {
            Some(t) => t,
            None => return Vec::new(),
        };

        let lang: Language = tree_sitter_rust::LANGUAGE.into();
        let imports = collect_query_texts(&lang, RS_IMPORT_QUERY, &tree, &content);

        let mut symbols = build_symbols(
            &lang,
            RS_SYMBOL_QUERY,
            Some(RS_CALL_QUERY),
            &tree,
            &content,
            rel_path,
            &imports,
            &|file_path, name, kind, _decorators| {
                if kind == "struct" || kind == "enum" {
                    return "data".to_string();
                }
                if kind == "trait" {
                    return "service".to_string();
                }
                classify_node_type(file_path, name)
            },
        );

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "rs");
        }

        symbols
    }

    fn parse_go_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let tree = match self.go_parser.parse(&content, None) {
            Some(t) => t,
            None => return Vec::new(),
        };

        let lang: Language = tree_sitter_go::LANGUAGE.into();
        let package = collect_query_texts(&lang, GO_PACKAGE_QUERY, &tree, &content);
        let imports = collect_query_texts(&lang, GO_IMPORT_QUERY, &tree, &content)
            .into_iter()
            .map(|i| i.trim_matches('"').trim_matches('`').to_string())
            .collect::<Vec<String>>();
        let goroutines = collect_query_texts(&lang, GO_GOROUTINE_QUERY, &tree, &content);
        let is_main_package = package.iter().any(|p| p == "main");

        let mut symbols = build_symbols(
            &lang,
            GO_SYMBOL_QUERY,
            Some(GO_CALL_QUERY),
            &tree,
            &content,
            rel_path,
            &imports,
            &|file_path, name, kind, _decorators| {
                if goroutines.iter().any(|g| g == name) {
                    return "entry".to_string();
                }
                if is_main_package && (name == "main" || name == "init") {
                    return "entry".to_string();
                }
                if kind == "interface" {
                    return "service".to_string();
                }
                if kind == "struct" {
                    return "data".to_string();
                }
                classify_node_type(file_path, name)
            },
        );

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "go");
        }

        symbols
    }

    fn parse_java_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let tree = match self.java_parser.parse(&content, None) {
            Some(t) => t,
            None => return Vec::new(),
        };

        let lang: Language = tree_sitter_java::LANGUAGE.into();
        let imports = collect_query_texts(&lang, JAVA_IMPORT_QUERY, &tree, &content);

        let mut symbols = build_symbols(
            &lang,
            JAVA_SYMBOL_QUERY,
            Some(JAVA_CALL_QUERY),
            &tree,
            &content,
            rel_path,
            &imports,
            &|file_path, name, _kind, decorators| {
                if let Some(node_type) = classify_java_annotation(decorators) {
                    return node_type;
                }
                if name.ends_with("Repository") || name.ends_with("Entity") {
                    return "data".to_string();
                }
                if name.ends_with("Controller") {
                    return "entry".to_string();
                }
                if name.ends_with("Service") {
                    return "service".to_string();
                }
                classify_node_type(&strip_jvm_source_root(file_path), name)
            },
        );

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "java");
        }

        symbols
    }

    fn parse_cs_file(&mut self, full_path: &Path, rel_path: &str) -> Vec<AstSymbol> {
        let content = match fs::read_to_string(full_path) {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let tree = match self.csharp_parser.parse(&content, None) {
            Some(t) => t,
            None => return Vec::new(),
        };

        let lang: Language = tree_sitter_c_sharp::LANGUAGE.into();
        let imports = collect_query_texts(&lang, CSHARP_IMPORT_QUERY, &tree, &content);

        let mut symbols = build_symbols(
            &lang,
            CSHARP_SYMBOL_QUERY,
            Some(CSHARP_CALL_QUERY),
            &tree,
            &content,
            rel_path,
            &imports,
            &|file_path, name, _kind, decorators| {
                if let Some(node_type) = classify_csharp_attribute(decorators) {
                    return node_type;
                }
                if name.ends_with("Controller") {
                    return "entry".to_string();
                }
                if name.ends_with("Service") || name.ends_with("Handler") {
                    return "service".to_string();
                }
                if name.ends_with("Repository") || name.ends_with("DbContext") {
                    return "data".to_string();
                }
                classify_node_type(file_path, name)
            },
        );

        if symbols.is_empty() {
            symbols = fallback_extract_symbols(&content, rel_path, "cs");
        }

        symbols
    }
}

// Tree-sitter AST queries
const TS_SYMBOL_QUERY: &str = r#"
    (function_declaration name: (identifier) @function.name) @function.def
    (class_declaration name: (type_identifier) @class.name) @class.def
    (method_definition name: (property_identifier) @method.name) @method.def
    (export_statement declaration: (lexical_declaration (variable_declarator name: (identifier) @function.name value: [(arrow_function) (function_expression)]))) @function.def
    (export_statement declaration: (lexical_declaration (variable_declarator name: (identifier) @const.name))) @const.def
    (interface_declaration name: (type_identifier) @interface.name) @interface.def
    (type_alias_declaration name: (type_identifier) @type.name) @type.def
"#;

const TS_IMPORT_QUERY: &str = r#"
    (import_statement source: (string) @import.path)
    (import_clause (named_imports (import_specifier name: (identifier) @import.name)))
"#;

const TS_CALL_QUERY: &str = r#"
    (call_expression function: (identifier) @call.name)
    (call_expression function: (member_expression property: (property_identifier) @call.name))
"#;

const PY_SYMBOL_QUERY: &str = r#"
    (function_definition name: (identifier) @function.name) @function.def
    (class_definition name: (identifier) @class.name) @class.def
"#;

const PY_IMPORT_QUERY: &str = r#"
    (import_statement name: (dotted_name) @import.name)
    (import_from_statement module_name: (dotted_name) @import.name)
"#;

const PY_CALL_QUERY: &str = r#"
    (call function: (identifier) @call.name)
    (call function: (attribute attribute: (identifier) @call.name))
"#;

const RS_SYMBOL_QUERY: &str = r#"
    (function_item name: (identifier) @function.name) @function.def
    (struct_item name: (type_identifier) @struct.name) @struct.def
    (enum_item name: (type_identifier) @enum.name) @enum.def
    (trait_item name: (type_identifier) @trait.name) @trait.def
"#;

const RS_IMPORT_QUERY: &str = r#"
    (use_declaration argument: (scoped_identifier) @import.name)
    (use_declaration argument: (identifier) @import.name)
"#;

const RS_CALL_QUERY: &str = r#"
    (call_expression function: (identifier) @call.name)
    (call_expression function: (scoped_identifier name: (identifier) @call.name))
    (call_expression function: (field_expression field: (field_identifier) @call.name))
"#;

const GO_SYMBOL_QUERY: &str = r#"
    (function_declaration name: (identifier) @function.name) @function.def
    (method_declaration name: (field_identifier) @method.name) @method.def
    (type_declaration (type_spec name: (type_identifier) @struct.name type: (struct_type))) @struct.def
    (type_declaration (type_spec name: (type_identifier) @interface.name type: (interface_type))) @interface.def
"#;

const GO_IMPORT_QUERY: &str = r#"
    (import_spec path: (interpreted_string_literal) @import.path)
"#;

const GO_PACKAGE_QUERY: &str = r#"
    (package_clause (package_identifier) @package.name)
"#;

const GO_GOROUTINE_QUERY: &str = r#"
    (go_statement (call_expression function: (identifier) @goroutine.name))
    (go_statement (call_expression function: (selector_expression field: (field_identifier) @goroutine.name)))
"#;

const GO_CALL_QUERY: &str = r#"
    (call_expression function: (identifier) @call.name)
    (call_expression function: (selector_expression field: (field_identifier) @call.name))
"#;

const JAVA_SYMBOL_QUERY: &str = r#"
    (class_declaration name: (identifier) @class.name) @class.def
    (interface_declaration name: (identifier) @interface.name) @interface.def
    (record_declaration name: (identifier) @record.name) @record.def
    (enum_declaration name: (identifier) @enum.name) @enum.def
    (method_declaration name: (identifier) @method.name) @method.def
"#;

const JAVA_IMPORT_QUERY: &str = r#"
    (import_declaration (scoped_identifier) @import.name)
"#;

const JAVA_CALL_QUERY: &str = r#"
    (method_invocation name: (identifier) @call.name)
    (object_creation_expression type: (type_identifier) @call.name)
"#;

const CSHARP_SYMBOL_QUERY: &str = r#"
    (class_declaration name: (identifier) @class.name) @class.def
    (record_declaration name: (identifier) @record.name) @record.def
    (struct_declaration name: (identifier) @struct.name) @struct.def
    (interface_declaration name: (identifier) @interface.name) @interface.def
    (method_declaration name: (identifier) @method.name) @method.def
"#;

const CSHARP_IMPORT_QUERY: &str = r#"
    (using_directive (qualified_name) @import.name)
    (using_directive (identifier) @import.name)
"#;

const CSHARP_CALL_QUERY: &str = r#"
    (invocation_expression expression: (identifier) @call.name)
    (invocation_expression expression: (member_access_expression name: (identifier) @call.name))
    (object_creation_expression type: (identifier) @call.name)
"#;

fn is_ignored(path: &Path) -> bool {
    let s = path.to_string_lossy();
    s.contains("/.git")
        || s.contains("/node_modules")
        || s.contains("/target")
        || s.contains("/dist")
        || s.contains("/build")
        || s.contains("/.venv")
        || s.contains("/__pycache__")
        || path.components().any(|component| {
            matches!(component.as_os_str().to_str(), Some("bin" | "obj"))
        })
}

fn extract_module_cluster(file_path: &str) -> String {
    let clean = file_path
        .trim_start_matches("./")
        .trim_start_matches('/');
    
    let parts: Vec<&str> = clean.split('/').collect();
    if parts.len() > 1 {
        if parts[0] == "src" || parts[0] == "lib" || parts[0] == "internal" || parts[0] == "pkg" {
            if parts.len() > 2 {
                return format!("{}/{}", parts[0], parts[1]);
            }
            return parts[0].to_string();
        }
        return parts[0].to_string();
    }
    "root".to_string()
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

fn collect_query_texts(lang: &Language, query_str: &str, tree: &Tree, content: &str) -> Vec<String> {
    let mut results = Vec::new();
    let query = match Query::new(lang, query_str) {
        Ok(q) => q,
        Err(_) => return results,
    };

    let mut cursor = QueryCursor::new();
    let matches = cursor.matches(&query, tree.root_node(), content.as_bytes());
    for m in matches {
        for cap in m.captures {
            if let Ok(text) = cap.node.utf8_text(content.as_bytes()) {
                let value = text.to_string();
                if !value.is_empty() && !results.contains(&value) {
                    results.push(value);
                }
            }
        }
    }

    results
}

fn extract_calls_from_node(
    lang: &Language,
    call_query_str: &str,
    node: Node,
    content: &str,
) -> Vec<String> {
    let mut calls = Vec::new();
    let query = match Query::new(lang, call_query_str) {
        Ok(q) => q,
        Err(_) => return calls,
    };

    let mut cursor = QueryCursor::new();
    let matches = cursor.matches(&query, node, content.as_bytes());
    for m in matches {
        for cap in m.captures {
            if let Ok(text) = cap.node.utf8_text(content.as_bytes()) {
                let name = text.trim().to_string();
                if !name.is_empty()
                    && !calls.contains(&name)
                    && name != "if"
                    && name != "for"
                    && name != "while"
                    && name != "switch"
                    && name != "match"
                    && name != "catch"
                {
                    calls.push(name);
                }
            }
        }
    }

    calls
}

fn build_symbols(
    lang: &Language,
    query_str: &str,
    call_query_str: Option<&str>,
    tree: &Tree,
    content: &str,
    rel_path: &str,
    imports: &[String],
    classify: &dyn Fn(&str, &str, &str, &[String]) -> String,
) -> Vec<AstSymbol> {
    let mut symbols = Vec::new();
    let query = match Query::new(lang, query_str) {
        Ok(q) => q,
        Err(_) => return symbols,
    };

    let lines: Vec<&str> = content.lines().collect();
    let capture_names = query.capture_names();
    let mut cursor = QueryCursor::new();
    let matches = cursor.matches(&query, tree.root_node(), content.as_bytes());

    for m in matches {
        let mut kind = String::new();
        let mut name = String::new();
        let mut def_node: Option<Node> = None;

        for cap in m.captures {
            let capture_name = capture_names[cap.index as usize];
            if let Some(prefix) = capture_name.strip_suffix(".name") {
                kind = prefix.to_string();
                name = cap
                    .node
                    .utf8_text(content.as_bytes())
                    .unwrap_or("")
                    .to_string();
            } else if capture_name.ends_with(".def") {
                def_node = Some(cap.node);
            }
        }

        if name.is_empty() {
            continue;
        }

        let node = match def_node {
            Some(n) => n,
            None => continue,
        };

        let start_line = node.start_position().row + 1;
        let end_line = node.end_position().row + 1;
        let decorators = collect_decorators(node, content.as_bytes());
        let node_type = classify(rel_path, &name, &kind, &decorators);
        let snippet = get_snippet(&lines, start_line, end_line);

        let mut calls = if let Some(c_query) = call_query_str {
            extract_calls_from_node(lang, c_query, node, content)
        } else {
            Vec::new()
        };

        if calls.is_empty() {
            calls = extract_calls(content, start_line, end_line);
        }

        symbols.push(AstSymbol {
            name,
            kind,
            file_path: rel_path.to_string(),
            start_line,
            end_line,
            node_type,
            calls,
            imports: imports.to_vec(),
            snippet,
        });
    }

    symbols
}

fn collect_decorators(node: Node, source: &[u8]) -> Vec<String> {
    let mut decorators = extract_decorators(node, source);
    let mut current = node.parent();

    while let Some(parent) = current {
        if is_type_declaration(parent.kind()) {
            for decorator in extract_decorators(parent, source) {
                if !decorators.contains(&decorator) {
                    decorators.push(decorator);
                }
            }
        }
        current = parent.parent();
    }

    decorators
}

fn is_type_declaration(kind: &str) -> bool {
    matches!(
        kind,
        "class_declaration"
            | "interface_declaration"
            | "record_declaration"
            | "enum_declaration"
            | "struct_declaration"
    )
}

fn strip_jvm_source_root(file_path: &str) -> String {
    file_path
        .replace("src/main/java/", "")
        .replace("src/test/java/", "")
        .replace("src/main/kotlin/", "")
        .replace("src/test/kotlin/", "")
}

fn extract_decorators(node: Node, source: &[u8]) -> Vec<String> {
    static DECORATOR_RE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();

    let re = DECORATOR_RE.get_or_init(|| {
        regex::Regex::new(r"[@\[]\s*([A-Za-z_][A-Za-z0-9_]*)")
            .expect("decorator regex must be valid")
    });
    let mut decorators = Vec::new();
    let mut walker = node.walk();

    for child in node.children(&mut walker) {
        let child_kind = child.kind();
        if child_kind != "modifiers" && child_kind != "attribute_list" {
            continue;
        }

        let text = match child.utf8_text(source) {
            Ok(t) => t,
            Err(_) => continue,
        };

        for cap in re.captures_iter(text) {
            if let Some(m) = cap.get(1) {
                let value = m.as_str().to_string();
                if !decorators.contains(&value) {
                    decorators.push(value);
                }
            }
        }
    }

    decorators
}

fn classify_java_annotation(decorators: &[String]) -> Option<String> {
    for decorator in decorators {
        let node_type = match decorator.as_str() {
            "RestController" | "Controller" | "SpringBootApplication" => "entry",
            "Service" | "Component" | "Bean" => "service",
            "Repository" | "Entity" | "Table" | "Document" => "data",
            "Configuration" | "ControllerAdvice" | "Aspect" | "Order" => "middleware",
            _ => continue,
        };
        return Some(node_type.to_string());
    }
    None
}

fn classify_csharp_attribute(decorators: &[String]) -> Option<String> {
    for decorator in decorators {
        let node_type = match decorator.as_str() {
            "ApiController" | "Route" | "HttpGet" | "HttpPost" | "HttpPut" | "HttpDelete" => "entry",
            "Authorize" | "AllowAnonymous" | "ServiceFilter" => "middleware",
            "Table" | "Keyless" | "Owned" => "data",
            _ => continue,
        };
        return Some(node_type.to_string());
    }
    None
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
    let mut calls = Vec::new();
    for cap in FALLBACK_CALL_RE.captures_iter(&snippet) {
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
        "go" => regex::Regex::new(r"(?:func|type)\s+(?:\([^)]*\)\s*)?([a-zA-Z0-9_]+)").unwrap(),
        "java" => regex::Regex::new(r"(?:class|interface|record|enum)\s+([a-zA-Z0-9_]+)").unwrap(),
        "cs" => regex::Regex::new(r"(?:class|interface|record|struct)\s+([a-zA-Z0-9_]+)").unwrap(),
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

#[cfg(test)]
mod tests {
    use super::is_ignored;
    use std::path::Path;

    #[test]
    fn ignores_dotnet_build_directories_by_component() {
        assert!(is_ignored(Path::new("/repo/bin/Debug/Generated.cs")));
        assert!(is_ignored(Path::new("/repo/obj/Debug/net8.0/App.g.cs")));
        assert!(!is_ignored(Path::new("/repo/binary/Source.cs")));
        assert!(!is_ignored(Path::new("/repo/objects/Source.cs")));
    }
}
