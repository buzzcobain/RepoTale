pub mod git;
pub mod ast;
pub mod keychain;
pub mod llm;
pub mod export;
pub mod commands;

pub use commands::CloneResponse;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::clone_repository,
            commands::parse_local_repository,
            commands::save_api_key,
            commands::get_api_key,
            commands::delete_api_key,
            commands::check_ollama,
            commands::estimate_tokens_and_cost,
            commands::run_inference,
            commands::export_docs,
            commands::cleanup_sandboxes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running repotale application");
}
