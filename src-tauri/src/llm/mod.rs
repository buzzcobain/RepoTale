pub mod prompt;
pub mod ollama;
pub mod gemini;
pub mod claude;
pub mod openai;

use anyhow::{anyhow, Result};
use crate::ast::{AstCallGraphScaffold, ManifestInfo};
use crate::keychain::get_key;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub provider: String, // "ollama", "gemini", "claude", "openai"
    pub model: String,
    pub ollama_url: Option<String>,
    pub custom_api_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceEstimate {
    pub estimated_prompt_tokens: usize,
    pub estimated_cost_usd: f64,
}

pub fn estimate_inference_cost(provider: &str, model: &str, prompt_len: usize) -> InferenceEstimate {
    let tokens = prompt::estimate_tokens(&prompt_len.to_string()) + (prompt_len / 4);
    let cost = match provider {
        "ollama" => 0.0,
        "gemini" => (tokens as f64 / 1_000_000.0) * 0.075, // Gemini 2.0 Flash approx
        "claude" => (tokens as f64 / 1_000_000.0) * 3.0,   // Claude 3.5 Sonnet
        "openai" => (tokens as f64 / 1_000_000.0) * 2.5,   // GPT-4o
        _ => 0.0,
    };

    InferenceEstimate {
        estimated_prompt_tokens: tokens,
        estimated_cost_usd: cost,
    }
}

pub async fn execute_story_inference(
    req: &InferenceRequest,
    manifest: &ManifestInfo,
    scaffold: &AstCallGraphScaffold,
) -> Result<String> {
    let system_prompt = prompt::build_system_prompt();
    let user_prompt = prompt::build_user_prompt(manifest, scaffold);

    match req.provider.as_str() {
        "ollama" => {
            let client = ollama::OllamaClient::new(req.ollama_url.clone());
            client.generate_story(&req.model, system_prompt, &user_prompt).await
        }
        "gemini" => {
            let key = req.custom_api_key.clone()
                .or_else(|| get_key("gemini").ok())
                .ok_or_else(|| anyhow!("Google Gemini API key not found in keychain or request"))?;
            let client = gemini::GeminiClient::new(key);
            client.generate_story(&req.model, system_prompt, &user_prompt).await
        }
        "claude" => {
            let key = req.custom_api_key.clone()
                .or_else(|| get_key("claude").ok())
                .ok_or_else(|| anyhow!("Anthropic Claude API key not found in keychain or request"))?;
            let client = claude::ClaudeClient::new(key);
            client.generate_story(&req.model, system_prompt, &user_prompt).await
        }
        "openai" => {
            let key = req.custom_api_key.clone()
                .or_else(|| get_key("openai").ok())
                .ok_or_else(|| anyhow!("OpenAI API key not found in keychain or request"))?;
            let client = openai::OpenAIClient::new(key);
            client.generate_story(&req.model, system_prompt, &user_prompt).await
        }
        other => Err(anyhow!("Unsupported inference provider: {}", other)),
    }
}
