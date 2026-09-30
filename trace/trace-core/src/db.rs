use crate::models::ActivityEvent;
use chrono::Utc;
use directories::ProjectDirs;
use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
    pub db_path: PathBuf,
}

impl Database {
    pub fn default_path() -> PathBuf {
        if let Some(proj_dirs) = ProjectDirs::from("app", "Recall", "Trace") {
            let data_dir = proj_dirs.data_local_dir();
            fs::create_dir_all(data_dir).ok();
            data_dir.join("trace.db")
        } else {
            PathBuf::from("trace.db")
        }
    }

    pub fn init(path: Option<&Path>) -> Result<Self> {
        let db_path = match path {
            Some(p) => p.to_path_buf(),
            None => Self::default_path(),
        };

        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&db_path)?;

        // Initialize SQLite local activity schema
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS local_events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                application TEXT NOT NULL,
                window_title TEXT,
                url TEXT,
                file_path TEXT,
                timestamp TEXT NOT NULL,
                duration_seconds INTEGER DEFAULT 0,
                metadata TEXT DEFAULT '{}',
                privacy_state TEXT DEFAULT 'normal',
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_events_timestamp ON local_events(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_events_application ON local_events(application);
            CREATE INDEX IF NOT EXISTS idx_events_event_type ON local_events(event_type);
            ",
        )?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path,
        })
    }

    pub fn insert_event(&self, event: &ActivityEvent) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let metadata_str = serde_json::to_string(&event.metadata).unwrap_or_else(|_| "{}".to_string());

        conn.execute(
            "
            INSERT INTO local_events (
                id, event_type, application, window_title, url, file_path, 
                timestamp, duration_seconds, metadata, privacy_state, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ",
            params![
                event.id,
                event.event_type,
                event.application,
                event.window_title,
                event.url,
                event.file_path,
                event.timestamp,
                event.duration_seconds,
                metadata_str,
                event.privacy_state,
                event.created_at,
            ],
        )?;

        Ok(())
    }

    pub fn update_duration(&self, id: &str, duration_seconds: u32) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE local_events SET duration_seconds = ?1 WHERE id = ?2",
            params![duration_seconds, id],
        )?;
        Ok(())
    }

    pub fn get_recent_events(&self, limit: usize) -> Result<Vec<ActivityEvent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "
            SELECT id, event_type, application, window_title, url, file_path, 
                   timestamp, duration_seconds, metadata, privacy_state, created_at
            FROM local_events
            ORDER BY timestamp DESC
            LIMIT ?1
            ",
        )?;

        let rows = stmt.query_map(params![limit as i64], |row| {
            let meta_str: String = row.get(8)?;
            let metadata: serde_json::Value = serde_json::from_str(&meta_str).unwrap_or(serde_json::json!({}));

            Ok(ActivityEvent {
                id: row.get(0)?,
                event_type: row.get(1)?,
                application: row.get(2)?,
                window_title: row.get(3)?,
                url: row.get(4)?,
                file_path: row.get(5)?,
                timestamp: row.get(6)?,
                duration_seconds: row.get(7)?,
                metadata,
                privacy_state: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;

        let mut events = Vec::new();
        for row in rows {
            events.push(row?);
        }

        Ok(events)
    }

    pub fn get_today_count(&self) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        let today_prefix = Utc::now().format("%Y-%m-%d").to_string();

        let mut stmt = conn.prepare(
            "SELECT COUNT(*) FROM local_events WHERE timestamp LIKE ?1"
        )?;

        let count: i64 = stmt.query_row(params![format!("{}%", today_prefix)], |row| row.get(0))?;
        Ok(count as usize)
    }

    pub fn clear_all(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM local_events", [])?;
        conn.execute("VACUUM", [])?;
        Ok(())
    }
}
