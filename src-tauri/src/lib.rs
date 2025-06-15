#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Register filesystem plugin
      app.handle().plugin(tauri_plugin_fs::init())?;
      
      // Register dialog plugin
      app.handle().plugin(tauri_plugin_dialog::init())?;
      
      // Register shell plugin
      app.handle().plugin(tauri_plugin_shell::init())?;
      
      // Register OS plugin for system paths
      app.handle().plugin(tauri_plugin_os::init())?;
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
