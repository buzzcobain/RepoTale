use anyhow::{anyhow, Result};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct OpenAIClient {
    client: Client,
    api_key: String,
}

impl OpenAIClient {
    pub fn new(api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .build()
            .unwrap_or_default();
        Self { client, api_key }
    }

    pub async fn generate_story(&self, model: &str, system_prompt: &str, user_prompt: &str) -> Result<String> {
        let model_id = if model.is_empty() { "gpt-4o" } else { model };
        let url = "https://api.openai.com/v1/chat/completions";

        let payload = json!({
            "model": model_id,
            "response_format": { "type": "json_object" },
            "messages": [
                { "role": "system", "content": system_prompt },
                { "role": "user", "content": user_prompt }
            ],
            "temperature": 0.2
        });

        let res = self.client.post(url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow!("OpenAI API request failed: {}", e))?;

        if !res.status().is_success() {
            let error_text = res.text().await.unwrap_or_default();
            return Err(anyhow!("OpenAI API error: {}", error_text));
        }

        let body: Value = res.json().await?;
        let text = body["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| anyhow!("OpenAI returned empty message content"))?;

        Ok(text.to_string())
    }
}
