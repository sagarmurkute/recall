# TRACE — Windows Contextual Activity Agent Specification

---

## 1. Product Definition & Privacy Mandate

**TRACE** (`Trace.exe`) is a standalone, local-first Windows desktop companion for Recall. It observes the user's desktop context—active windows, browser tabs, opened files, and application switches—creating a searchable timeline of digital encounters.

### 🛡️ Non-Negotiable Privacy Mandates:
* **NOT Spyware or Surveillance:** Trace is completely visible, user-controlled, and designed for the individual's personal benefit.
* **Zero Keylogging / Form Scraping:** Trace **never** records keystrokes, passwords, clipboard contents, or form inputs.
* **Local-First Retention:** All activity events are initially stored in a local on-device SQLite database (`%APPDATA%/Trace/trace.db`).
* **Pausable at Will:** A global system-tray toggle allows the user to pause recording at any moment.
* **Deletable & Auditable:** Users can inspect, search, and delete any activity record or purge their entire history with one click.
* **Explicit Sync Controls:** Cloud synchronization to Recall is opt-in and configurable per application/domain.

---

## 2. Event Types & Capture Scope

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TRACE ACTIVITY COLLECTORS                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. APPLICATION       │ 2. BROWSER           │ 3. FILE ACCESS                │
│    EVENTS            │    EVENTS            │    EVENTS                     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ - Process name       │ - Active browser     │ - Document open event         │
│ - Window title text  │ - Tab page title     │ - File name & extension       │
│ - Timestamp          │ - Domain / URL       │ - Associated application      │
│ - Active duration    │ - Duration on page   │ - Timestamp                   │
│                      │                      │ - (NO content dumping)        │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### Detailed Event Schemas:

#### 1. Application Events (`app_focus`)
* **Trigger:** User switches active foreground window (`SetWinEventHook` / `GetForegroundWindow`).
* **Payload:**
  ```json
  {
    "event_type": "app_focus",
    "application": "Code.exe",
    "window_title": "Recall — src/services/searchService.ts - Visual Studio Code",
    "timestamp": "2026-09-30T10:28:00.000Z",
    "duration_seconds": 185
  }
  ```

#### 2. Browser Events (`browser_visit`)
* **Trigger:** User navigates or switches tabs in supported browsers (Chrome, Edge, Firefox, Brave via native accessibility API / lightweight companion extension).
* **Payload:**
  ```json
  {
    "event_type": "browser_visit",
    "application": "chrome.exe",
    "window_title": "Framer Motion — React Animation Library",
    "url": "https://framer.com/motion",
    "timestamp": "2026-09-30T09:15:30.000Z",
    "duration_seconds": 120
  }
  ```

#### 3. File Events (`file_open`)
* **Trigger:** User opens a local document or presentation.
* **Payload:**
  ```json
  {
    "event_type": "file_open",
    "application": "AcroRd32.exe",
    "window_title": "DBMS_Assignment_2.pdf - Adobe Acrobat Reader",
    "file_path": "C:\\Users\\Student\\Downloads\\DBMS_Assignment_2.pdf",
    "timestamp": "2026-09-30T08:45:10.000Z"
  }
  ```

---

## 3. Privacy Controls & Governance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TRACE PRIVACY GOVERNANCE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ [⏸️ PAUSE RECORDING]    Instantly pauses all event logging                  │
│ [🔒 EXCLUDE APPS]       Blacklist: 1Password, Bitwarden, Banking, Signal    │
│ [🌐 EXCLUDE DOMAINS]    Blacklist: accounts.google.com, mybank.com, health  │
│ [🗑️ PURGE HISTORY]      Delete last 1 hour / 24 hours / all local logs       │
│ [☁️ SYNC TOGGLE]        Enable/disable syncing to cloud Recall Supabase     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Default Excluded Categories:
* Incognito / Private Browsing windows.
* Password managers (1Password, Bitwarden, KeePass).
* Banking and financial domains.
* System configuration utilities (Windows Credential Manager, Regedit).

---

## 4. Local Data Model (`trace.db`)

```sql
CREATE TABLE local_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'app_focus', 'browser_visit', 'file_open'
    application TEXT NOT NULL,
    window_title TEXT,
    url TEXT,
    file_path TEXT,
    timestamp TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    metadata JSON,
    privacy_state TEXT DEFAULT 'normal', -- 'normal', 'excluded', 'synced'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_local_events_timestamp ON local_events(timestamp DESC);
CREATE INDEX idx_local_events_app ON local_events(application);
```

---

## 5. Trace-to-Recall Cloud Synchronization Bridge

1. **Batching:** Trace batches non-excluded events every 5 minutes.
2. **Sanitization:** Strips query parameters containing sensitive tokens (`token=`, `auth=`, `session=`).
3. **Payload Ingestion:** Sends authenticated batch to Supabase `activity_events` table under the user's `auth.uid()`.
4. **Offline Capability:** If offline, events queue locally in SQLite and synchronize when connectivity resumes.
