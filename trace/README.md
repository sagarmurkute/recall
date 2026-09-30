# Trace (`Trace.exe`)

> **"What was I doing on my computer?"**

Trace is a lightweight, local-first native Windows desktop application that captures your contextual computer encounters (active applications, window titles, smart browser domains, code editor context, and active focus duration) without surveillance, keystroke logging, or background cloud sync.

---

## 🚀 Advanced Controls & Features

### 1. 🕒 Timeline & Search
- **Instant Search:** Search activities by keyword, window title, or application name.
- **Application Filtering:** Filter timeline by active apps (e.g. Chrome, VS Code, File Explorer, Figma).
- **Active Focus Pill:** Real-time preview of the currently focused window and application.
- **Granular Deletion:** Delete individual activity events, or quick-delete the last **15 minutes** or **1 hour**.

### 2. 📊 Screen Time & Analytics
- **Today's Active Focus Breakdown:** Visual bar breakdown showing total time spent per application today (e.g. `VS Code — 1h 45m (52.4%)`, `Chrome — 38m (19.2%)`).
- **Idle Detection:** Automatically pauses duration accumulation when you are AFK / away from the keyboard (> 2 minutes).

### 3. 🛡️ Privacy & Exclusion Manager
- **Custom Ignored Applications:** Add custom app executable names to never record (e.g. `slack.exe`, `telegram.exe`, `1password.exe`).
- **Custom Sensitive Keywords:** Add sensitive terms (e.g. `bank`, `payroll`, `inprivate`) that automatically trigger recording suppression.
- **Rule Persistence:** All exclusion rules are stored in your local SQLite database and persist across restarts.
- **Master Pause / Resume:** 1-click toggle to suspend/resume recording at any time.

### 4. 💾 Data Ownership & Export
- **JSON Export:** 1-click export of complete activity history to structured JSON format.
- **CSV Export:** 1-click export to CSV for spreadsheets and data analysis.
- **Wipe Database:** 1-click purge of all local history with SQLite `VACUUM`.

---

## 🛡️ Privacy & Safety Principles

* **100% Local-First:** All activity is recorded into an on-device SQLite database at `%APPDATA%/Recall/Trace/trace.db`.
* **Zero Keylogging / Form Scraping:** Trace **never** records keystrokes, clipboard content, passwords, private forms, microphone, or camera.
* **Zero Cloud Sync:** Operates completely offline with zero telemetry or cloud transmission.
* **Transparent:** Runs as a standard visible desktop GUI window with an active status badge.

---

## 📦 Project Architecture

```text
trace/
├── Cargo.toml            # Workspace manifest
├── README.md             # Trace documentation
├── trace-core/           # Independent activity collector library & SQLite engine
│   ├── Cargo.toml
│   └── src/
│       ├── collector.rs  # Win32 foreground window, idle detection & smart context parser
│       ├── db.rs         # SQLite storage, full search, analytics breakdown & export
│       ├── models.rs     # ActivityEvent domain model
│       └── privacy.rs    # Exclusion manager, blacklist filters & pause controller
└── trace-app/            # Native Windows GUI application (egui / eframe)
    ├── Cargo.toml
    └── src/
        ├── app.rs        # Multi-tab desktop GUI & collector worker thread
        └── main.rs       # Native window entry point
```

---

## 🔨 Building Trace

### Build & Run Locally
```bash
cargo run --manifest-path trace/Cargo.toml -p trace-app --target-dir trace/build_target
```

### Build Optimized Standalone Windows Executable (`Trace.exe`)
```bash
cargo build --release --manifest-path trace/Cargo.toml -p trace-app --target-dir trace/build_target
```

Executable output:
`trace/build_target/release/trace.exe` (or `trace/build_target/debug/trace.exe`)
