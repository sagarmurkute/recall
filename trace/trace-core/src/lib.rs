pub mod collector;
pub mod db;
pub mod models;
pub mod privacy;

pub use collector::{get_active_window, get_idle_duration_secs, parse_smart_context, SmartContext, WindowInfo};
pub use db::{AppUsageStat, Database};
pub use models::ActivityEvent;
pub use privacy::PrivacyController;
