use anyhow::{anyhow, Result};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct OllamaClient {
    client: Client,
    base_url: String,
}

impl OllamaClient {
    pub fn new(base_url: Option<String>) -> Self {
        let base_url = base_url.unwrap_or_else(|| "http://localhost:11434".to_string());
        let client = Client::builder()
            .timeout(Duration::from_secs(180))
            .build()
            .unwrap_or_default();
        Self { client, base_url }
    }

    pub async fn check_health(&self) -> Result<Vec<String>> {
        let url = format!("{}/api/tags", self.base_url);
        let res = self.client.get(&url)
            .timeout(Duration::from_secs(3))
            .send()
            .await
            .map_err(|e| anyhow!("Failed to connect to Ollama at {}: {}", self.base_url, e))?;

        if !res.status().is_success() {
            return Err(anyhow!("Ollama returned status: {}", res.status()));
        }

        let json: Value = res.json().await?;
        let mut models = Vec::new();
        if let Some(models_arr) = json.get("models").and_then(|v| v.as_array()) {
            for m in models_arr {
                if let Some(name) = m.get("name").and_then(|v| v.as_str()) {
                    models.push(name.to_string());
                }
            }
        }
        Ok(models)
    }

    pub async fn generate_story(&self, model: &str, system_prompt: &str, user_prompt: &str) -> Result<String> {
        let url = format!("{}/api/generate", self.base_url);
        let payload = json!({
            "model": model,
            "system": system_prompt,
            "prompt": user_prompt,
            "format": "json",
            "stream": false,
            "options": {
                "temperature": 0.2,
                "num_ctx": 8192
            }
        });

        let res = self.client.post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow!("Ollama generate request failed: {}", e))?;

        if !res.status().is_success() {
            let error_text = res.text().await.unwrap_or_default();
            return Err(anyhow!("Ollama API error: {}", error_text));
        }

        let body: Value = res.json().await?;
        let response_text = body.get("response")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow!("Invalid response structure from Ollama"))?;

        Ok(response_text.to_string())
    }
}
