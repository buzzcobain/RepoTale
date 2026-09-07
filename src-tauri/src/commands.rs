use std::path::Path;
use serde::{Deserialize, Serialize};
use crate::git::{self, GitSandbox};
use crate::ast::{sniff_manifest, AstCallGraphScaffold, ManifestInfo, RepoAstParser};
use crate::keychain;
use crate::llm::{self, estimate_inference_cost, execute_story_inference, InferenceEstimate, InferenceRequest};
use crate::export::{export_all, ExportPayload, ExportResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloneResponse {
    pub sandbox_id: String,
    pub path: String,
    pub manifest: ManifestInfo,
    pub scaffold: AstCallGraphScaffold,
}

#[tauri::command]
pub async fn clone_repository(url: String) -> Result<CloneResponse, String> {
    let sandbox = GitSandbox::clone_repo(&url)
        .map_err(|e| format!("Clone error: {}", e))?;

    let manifest = sniff_manifest(&sandbox.path);
    let mut parser = RepoAstParser::new();
    let scaffold = parser.parse_repository(&sandbox.path);

    Ok(CloneResponse {
        sandbox_id: sandbox.id,
        path: sandbox.path.to_string_lossy().to_string(),
        manifest,
        scaffold,
    })
}

#[tauri::command]
pub async fn parse_local_repository(path: String) -> Result<CloneResponse, String> {
    let repo_path = Path::new(&path);
    if !repo_path.exists() {
        return Err("Local repository path does not exist".to_string());
    }

    let manifest = sniff_manifest(repo_path);
    let mut parser = RepoAstParser::new();
    let scaffold = parser.parse_repository(repo_path);

    Ok(CloneResponse {
        sandbox_id: "local".to_string(),
        path: path.clone(),
        manifest,
        scaffold,
    })
}

#[tauri::command]
pub fn save_api_key(provider: String, api_key: String) -> Result<(), String> {
    keychain::save_key(&provider, &api_key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_api_key(provider: String) -> Result<String, String> {
    keychain::get_key(&provider).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), String> {
    keychain::delete_key(&provider).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_ollama(base_url: Option<String>) -> Result<Vec<String>, String> {
    let client = llm::ollama::OllamaClient::new(base_url);
    client.check_health().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn estimate_tokens_and_cost(provider: String, model: String, prompt_len: usize) -> Result<InferenceEstimate, String> {
    Ok(estimate_inference_cost(&provider, &model, prompt_len))
}

#[tauri::command]
pub async fn run_inference(
    req: InferenceRequest,
    manifest: ManifestInfo,
    scaffold: AstCallGraphScaffold,
) -> Result<String, String> {
    execute_story_inference(&req, &manifest, &scaffold)
        .await
        .map_err(|e| format!("Inference error: {}", e))
}

#[tauri::command]
pub fn export_docs(payload: ExportPayload) -> Result<ExportResult, String> {
    export_all(&payload).map_err(|e| format!("Export error: {}", e))
}

#[tauri::command]
pub fn cleanup_sandboxes() -> Result<(), String> {
    git::cleanup_all_sandboxes().map_err(|e| e.to_string())
}
