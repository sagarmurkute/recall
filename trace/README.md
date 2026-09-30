# Trace (`Trace.exe`)

> **"What was I doing on my computer?"**

Trace is a lightweight, local-first Windows desktop application that captures your contextual computer encounters (active applications, window titles, and duration) without surveillance, keystroke logging, or background cloud snooping.

---

## 🛡️ Privacy & Safety Principles

* **100% Local-First:** All activity is recorded into an on-device SQLite database at `%APPDATA%/Recall/Trace/trace.db`.
* **Zero Keylogging / Form Scraping:** Trace **never** records keystrokes, clipboard content, passwords, private forms, microphone, or camera.
* **Pause & Resume Controls:** Instantly toggle recording via the Pause button.
* **History Purge:** 1-click `Clear History` deletes all local activity from SQLite immediately.
* **No Stealth Operation:** Trace runs as a standard visible desktop application with an active window and status indicator.

---

## 📦 Project Architecture

```
trace/
├── Cargo.toml            # Workspace manifest
├── README.md             # Trace documentation
├── trace-core/           # Independent activity collector library
│   ├── Cargo.toml
│   └── src/
│       ├── collector.rs  # Windows Win32 foreground window & process inspection
│       ├── db.rs         # SQLite local storage and index management
│       ├── models.rs     # ActivityEvent domain model
│       └── privacy.rs    # Blacklist filters, incognito exclusion, and pause logic
└── trace-app/            # Native Windows GUI application
    ├── Cargo.toml
    └── src/
        ├── app.rs        # eframe/egui desktop interface & collector thread
        └── main.rs       # Native window entry point
```

---

## 🔨 Building Trace

### Prerequisites
* Rust 1.80+ (`cargo` and `rustc`)
* Windows 10/11

### Build & Run Locally
```bash
cd trace
cargo run -p trace-app
```

### Build Optimized Standalone Windows Executable (`Trace.exe`)
```bash
cd trace
cargo build --release -p trace-app
```

The compiled standalone executable will be generated at:
`trace/target/release/trace.exe`
