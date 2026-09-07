use std::path::PathBuf;
use std::process::Command;
use uuid::Uuid;
use anyhow::{anyhow, Result};

pub struct GitSandbox {
    pub id: String,
    pub path: PathBuf,
}

impl GitSandbox {
    pub fn new() -> Result<Self> {
        let id = Uuid::new_v4().to_string();
        let path = std::env::temp_dir().join("repotale").join(&id);
        std::fs::create_dir_all(&path)?;
        Ok(Self { id, path })
    }

    pub fn clone_repo(url: &str) -> Result<Self> {
        let sanitized_url = sanitize_git_url(url)?;
        let sandbox = Self::new()?;

        let status = Command::new("git")
            .arg("clone")
            .arg("--depth")
            .arg("1")
            .arg(&sanitized_url)
            .arg(&sandbox.path)
            .status()
            .map_err(|e| anyhow!("Failed to execute git command: {}. Make sure git is installed.", e))?;

        if !status.success() {
            let _ = sandbox.cleanup();
            return Err(anyhow!("Git clone failed with exit code: {:?}", status.code()));
        }

        Ok(sandbox)
    }

    pub fn cleanup(&self) -> Result<()> {
        if self.path.exists() {
            std::fs::remove_dir_all(&self.path)?;
        }
        Ok(())
    }
}

pub fn sanitize_git_url(url: &str) -> Result<String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err(anyhow!("Repository URL cannot be empty"));
    }

    // Guard against command injection
    if trimmed.contains(';') || trimmed.contains('&') || trimmed.contains('|') || trimmed.contains('`') || trimmed.contains('$') {
        return Err(anyhow!("Invalid characters detected in repository URL"));
    }

    if trimmed.starts_with("https://") || trimmed.starts_with("http://") || trimmed.starts_with("git@") {
        Ok(trimmed.to_string())
    } else if trimmed.contains('/') && !trimmed.contains(':') {
        // e.g. "facebook/react" shorthand
        Ok(format!("https://github.com/{}.git", trimmed))
    } else {
        Ok(trimmed.to_string())
    }
}

pub fn cleanup_all_sandboxes() -> Result<()> {
    let base_temp = std::env::temp_dir().join("repotale");
    if base_temp.exists() {
        std::fs::remove_dir_all(&base_temp)?;
    }
    Ok(())
}
