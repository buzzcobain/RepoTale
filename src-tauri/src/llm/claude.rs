use anyhow::{anyhow, Result};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct ClaudeClient {
    client: Client,
    api_key: String,
}

impl ClaudeClient {
    pub fn new(api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .build()
            .unwrap_or_default();
        Self { client, api_key }
    }

    pub async fn generate_story(&self, model: &str, system_prompt: &str, user_prompt: &str) -> Result<String> {
        let model_id = if model.is_empty() { "claude-3-5-sonnet-20241022" } else { model };
        let url = "https://api.anthropic.com/v1/messages";

        let payload = json!({
            "model": model_id,
            "max_tokens": 8192,
            "system": system_prompt,
            "messages": [
                { "role": "user", "content": user_prompt }
            ],
            "temperature": 0.2
        });

        let res = self.client.post(url)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow!("Claude API request failed: {}", e))?;

        if !res.status().is_success() {
            let error_text = res.text().await.unwrap_or_default();
            return Err(anyhow!("Claude API error: {}", error_text));
        }

        let body: Value = res.json().await?;
        let text = body["content"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Claude returned empty content block"))?;

        Ok(text.to_string())
    }
}
