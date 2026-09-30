use crate::models::ActivityEvent;
use chrono::{Duration, Utc};
use directories::ProjectDirs;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppUsageStat {
    pub application: String,
    pub event_count: usize,
    pub total_seconds: u32,
}

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

            CREATE TABLE IF NOT EXISTS privacy_rules (
                rule_type TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (rule_type, value)
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

    pub fn search_events(&self, query: &str, app_filter: Option<&str>, limit: usize) -> Result<Vec<ActivityEvent>> {
        let conn = self.conn.lock().unwrap();
        let query_pattern = format!("%{}%", query.trim().to_lowercase());

        let mut sql = String::from(
            "SELECT id, event_type, application, window_title, url, file_path, 
                    timestamp, duration_seconds, metadata, privacy_state, created_at
             FROM local_events
             WHERE (LOWER(application) LIKE ?1 OR LOWER(COALESCE(window_title, '')) LIKE ?1)"
        );

        if let Some(app) = app_filter {
            if !app.is_empty() && app != "All Apps" {
                sql.push_str(" AND application = '");
                sql.push_str(&app.replace('\'', "''"));
                sql.push('\'');
            }
        }

        sql.push_str(" ORDER BY timestamp DESC LIMIT ?2");

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(params![query_pattern, limit as i64], |row| {
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

    pub fn get_distinct_applications(&self) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT DISTINCT application FROM local_events ORDER BY application ASC"
        )?;
        let rows = stmt.query_map([], |row| row.get(0))?;
        let mut apps = Vec::new();
        for row in rows {
            apps.push(row?);
        }
        Ok(apps)
    }

    pub fn get_app_breakdown_today(&self) -> Result<Vec<AppUsageStat>> {
        let conn = self.conn.lock().unwrap();
        let today_prefix = Utc::now().format("%Y-%m-%d").to_string();

        let mut stmt = conn.prepare(
            "
            SELECT application, COUNT(*) as event_count, SUM(duration_seconds) as total_seconds
            FROM local_events
            WHERE timestamp LIKE ?1
            GROUP BY application
            ORDER BY total_seconds DESC, event_count DESC
            ",
        )?;

        let rows = stmt.query_map(params![format!("{}%", today_prefix)], |row| {
            let total_sec: Option<i64> = row.get(2)?;
            Ok(AppUsageStat {
                application: row.get(0)?,
                event_count: row.get(1)?,
                total_seconds: total_sec.unwrap_or(0) as u32,
            })
        })?;

        let mut stats = Vec::new();
        for row in rows {
            stats.push(row?);
        }
        Ok(stats)
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

    pub fn delete_event_by_id(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM local_events WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn delete_events_since(&self, seconds_ago: i64) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        let cutoff = (Utc::now() - Duration::seconds(seconds_ago)).to_rfc3339();
        let deleted = conn.execute(
            "DELETE FROM local_events WHERE timestamp >= ?1",
            params![cutoff],
        )?;
        Ok(deleted)
    }

    pub fn clear_all(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM local_events", [])?;
        conn.execute("VACUUM", [])?;
        Ok(())
    }

    pub fn export_events_json(&self) -> Result<String> {
        let events = self.get_recent_events(5000)?;
        serde_json::to_string_pretty(&events).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))
    }

    pub fn export_events_csv(&self) -> Result<String> {
        let events = self.get_recent_events(5000)?;
        let mut csv = String::from("id,event_type,application,window_title,url,timestamp,duration_seconds,created_at\n");
        for ev in events {
            let title = ev.window_title.unwrap_or_default().replace('"', "\"\"");
            let url = ev.url.unwrap_or_default().replace('"', "\"\"");
            csv.push_str(&format!(
                "\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",{},\"{}\"\n",
                ev.id, ev.event_type, ev.application, title, url, ev.timestamp, ev.duration_seconds, ev.created_at
            ));
        }
        Ok(csv)
    }

    // Privacy Rules Persistence
    pub fn load_privacy_rules(&self) -> Result<(Vec<String>, Vec<String>)> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT rule_type, value FROM privacy_rules")?;
        let rows = stmt.query_map([], |row| {
            let rtype: String = row.get(0)?;
            let val: String = row.get(1)?;
            Ok((rtype, val))
        })?;

        let mut apps = Vec::new();
        let mut keywords = Vec::new();

        for row in rows {
            let (rtype, val) = row?;
            if rtype == "app" {
                apps.push(val);
            } else if rtype == "keyword" {
                keywords.push(val);
            }
        }

        Ok((apps, keywords))
    }

    pub fn add_privacy_rule(&self, rule_type: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO privacy_rules (rule_type, value) VALUES (?1, ?2)",
            params![rule_type, value],
        )?;
        Ok(())
    }

    pub fn remove_privacy_rule(&self, rule_type: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM privacy_rules WHERE rule_type = ?1 AND value = ?2",
            params![rule_type, value],
        )?;
        Ok(())
    }
}
