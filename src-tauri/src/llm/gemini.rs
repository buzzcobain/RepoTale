use anyhow::{anyhow, Result};
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct GeminiClient {
    client: Client,
    api_key: String,
}

impl GeminiClient {
    pub fn new(api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .build()
            .unwrap_or_default();
        Self { client, api_key }
    }

    pub async fn generate_story(&self, model: &str, system_prompt: &str, user_prompt: &str) -> Result<String> {
        let model_id = if model.is_empty() { "gemini-2.0-flash" } else { model };
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model_id, self.api_key
        );

        let payload = json!({
            "system_instruction": {
                "parts": [{ "text": system_prompt }]
            },
            "contents": [{
                "parts": [{ "text": user_prompt }]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        });

        let res = self.client.post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow!("Gemini API request failed: {}", e))?;

        if !res.status().is_success() {
            let error_text = res.text().await.unwrap_or_default();
            return Err(anyhow!("Gemini API error: {}", error_text));
        }

        let body: Value = res.json().await?;
        let text = body["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Gemini returned empty or malformed candidate"))?;

        Ok(text.to_string())
    }
}
