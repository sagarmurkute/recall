pub mod collector;
pub mod db;
pub mod models;
pub mod privacy;

pub use collector::{get_active_window, WindowInfo};
pub use db::Database;
pub use models::ActivityEvent;
pub use privacy::PrivacyController;
