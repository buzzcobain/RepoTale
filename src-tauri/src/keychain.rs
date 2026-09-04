use keyring::Entry;
use anyhow::{anyhow, Result};

const SERVICE_NAME: &str = "repotale";

pub fn save_key(provider: &str, api_key: &str) -> Result<()> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| anyhow!("Keyring error: {}", e))?;
    entry.set_password(api_key)
        .map_err(|e| anyhow!("Failed to write to OS keychain: {}", e))?;
    Ok(())
}

pub fn get_key(provider: &str) -> Result<String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| anyhow!("Keyring error: {}", e))?;
    let key = entry.get_password()
        .map_err(|e| anyhow!("Failed to read from OS keychain: {}", e))?;
    Ok(key)
}

pub fn delete_key(provider: &str) -> Result<()> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| anyhow!("Keyring error: {}", e))?;
    let _ = entry.delete_password();
    Ok(())
}
