#[derive(Debug, Clone)]
pub struct PrivacyController {
    pub is_paused: bool,
    pub excluded_apps: Vec<String>,
    pub excluded_keywords: Vec<String>,
}

impl Default for PrivacyController {
    fn default() -> Self {
        Self {
            is_paused: false,
            excluded_apps: vec![
                "1password.exe".to_string(),
                "bitwarden.exe".to_string(),
                "keepass.exe".to_string(),
                "credentialuibroker.exe".to_string(),
                "lockapp.exe".to_string(),
            ],
            excluded_keywords: vec![
                "incognito".to_string(),
                "private browsing".to_string(),
                "inprivate".to_string(),
                "password manager".to_string(),
            ],
        }
    }
}

impl PrivacyController {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn is_allowed(&self, app_name: &str, window_title: Option<&str>) -> bool {
        if self.is_paused {
            return false;
        }

        let app_lower = app_name.to_lowercase();
        for excluded in &self.excluded_apps {
            if app_lower == excluded.to_lowercase() {
                return false;
            }
        }

        if let Some(title) = window_title {
            let title_lower = title.to_lowercase();
            for keyword in &self.excluded_keywords {
                if title_lower.contains(keyword) {
                    return false;
                }
            }
        }

        true
    }

    pub fn toggle_pause(&mut self) -> bool {
        self.is_paused = !self.is_paused;
        self.is_paused
    }

    pub fn set_paused(&mut self, paused: bool) {
        self.is_paused = paused;
    }

    pub fn is_paused(&self) -> bool {
        self.is_paused
    }
}
