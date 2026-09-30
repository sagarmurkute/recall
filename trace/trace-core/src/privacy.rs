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
                "trace.exe".to_string(),
                "trace-app.exe".to_string(),
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

    pub fn add_excluded_app(&mut self, app: &str) {
        let app_clean = app.trim().to_lowercase();
        if !app_clean.is_empty() && !self.excluded_apps.iter().any(|a| a.to_lowercase() == app_clean) {
            self.excluded_apps.push(app_clean);
        }
    }

    pub fn remove_excluded_app(&mut self, app: &str) {
        let app_clean = app.trim().to_lowercase();
        self.excluded_apps.retain(|a| a.to_lowercase() != app_clean);
    }

    pub fn add_excluded_keyword(&mut self, kw: &str) {
        let kw_clean = kw.trim().to_lowercase();
        if !kw_clean.is_empty() && !self.excluded_keywords.iter().any(|k| k.to_lowercase() == kw_clean) {
            self.excluded_keywords.push(kw_clean);
        }
    }

    pub fn remove_excluded_keyword(&mut self, kw: &str) {
        let kw_clean = kw.trim().to_lowercase();
        self.excluded_keywords.retain(|k| k.to_lowercase() != kw_clean);
    }
}
