use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEvent {
    pub id: String,
    pub event_type: String,
    pub application: String,
    pub window_title: Option<String>,
    pub url: Option<String>,
    pub file_path: Option<String>,
    pub timestamp: String,
    pub duration_seconds: u32,
    pub metadata: serde_json::Value,
    pub privacy_state: String,
    pub created_at: String,
}

impl ActivityEvent {
    pub fn new_app_focus(
        application: String,
        window_title: Option<String>,
        file_path: Option<String>,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            event_type: "app_focus".to_string(),
            application,
            window_title,
            url: None,
            file_path,
            timestamp: now.clone(),
            duration_seconds: 0,
            metadata: serde_json::json!({}),
            privacy_state: "normal".to_string(),
            created_at: now,
        }
    }
}
