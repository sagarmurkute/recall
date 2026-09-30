use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WindowInfo {
    pub application: String,
    pub window_title: Option<String>,
    pub executable_path: Option<String>,
    pub clean_context: Option<String>,
    pub domain_or_tool: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SmartContext {
    pub title: Option<String>,
    pub category: String,
    pub category_or_domain: Option<String>,
    pub context_item: Option<String>,
    pub item_type: Option<String>,
    pub friendly_verb: String,
    pub friendly_summary: String,
    pub icon: &'static str,
}

/// Extract clean contextual domain/project/file and categories from raw window title
pub fn parse_smart_context(app_name: &str, raw_title: Option<&str>) -> SmartContext {
    let app_lower = app_name.to_lowercase();
    let title = match raw_title {
        Some(t) if !t.trim().is_empty() => t.trim(),
        _ => return SmartContext { 
            title: None, 
            category: "General".to_string(), 
            category_or_domain: None, 
            context_item: None,
            item_type: None,
            friendly_verb: "Using".to_string(),
            friendly_summary: format!("Using {}", app_name),
            icon: "💻",
        },
    };

    // 1. Web Browsers (Chrome, Edge, Brave, Firefox, Arc, Opera, Vivaldi)
    if app_lower.contains("chrome") || app_lower.contains("msedge") || app_lower.contains("brave") 
        || app_lower.contains("firefox") || app_lower.contains("arc") || app_lower.contains("opera") || app_lower.contains("vivaldi") {
        
        let title_lower = title.to_lowercase();
        let mut domain = None;
        let mut subcat = "Web Page";
        let mut verb = "Browsing";
        let mut icon = "🌐";

        if title_lower.contains("youtube") {
            domain = Some("youtube.com".to_string());
            subcat = "Video";
            verb = "Watching Video";
            icon = "🎬";
        } else if title_lower.contains("github") {
            domain = Some("github.com".to_string());
            subcat = "Code Repository";
            verb = "Viewing Code on GitHub";
            icon = "🐙";
        } else if title_lower.contains("chatgpt") || title_lower.contains("openai") || title_lower.contains("claude") || title_lower.contains("gemini") {
            domain = Some("ai-assistant".to_string());
            subcat = "AI Assistant";
            verb = "Chatting with AI";
            icon = "🤖";
        } else if title_lower.contains("docs.google") || title_lower.contains("google docs") {
            domain = Some("docs.google.com".to_string());
            subcat = "Document";
            verb = "Writing in Google Docs";
            icon = "📝";
        } else if title_lower.contains("sheets.google") || title_lower.contains("google sheets") {
            domain = Some("sheets.google.com".to_string());
            subcat = "Spreadsheet";
            verb = "Editing Google Sheet";
            icon = "📊";
        } else if title_lower.contains("notion") {
            domain = Some("notion.so".to_string());
            subcat = "Notes";
            verb = "Taking Notes in Notion";
            icon = "📓";
        } else if title_lower.contains("figma") {
            domain = Some("figma.com".to_string());
            subcat = "Design";
            verb = "Designing in Figma";
            icon = "🎨";
        } else if title_lower.contains("stackoverflow") || title_lower.contains("stack overflow") {
            domain = Some("stackoverflow.com".to_string());
            subcat = "Technical Q&A";
            verb = "Reading Solution on Stack Overflow";
            icon = "💡";
        } else if title_lower.contains("reddit") {
            domain = Some("reddit.com".to_string());
            subcat = "Discussion";
            verb = "Reading Reddit Post";
            icon = "💬";
        } else if title_lower.contains("twitter") || title_lower.contains("x.com") {
            domain = Some("x.com".to_string());
            subcat = "Social";
            verb = "Browsing X (Twitter)";
            icon = "🐦";
        } else if title_lower.contains("linkedin") {
            domain = Some("linkedin.com".to_string());
            subcat = "Professional";
            verb = "Browsing LinkedIn";
            icon = "💼";
        }

        let clean_title = title
            .trim_end_matches(" - Google Chrome")
            .trim_end_matches(" - Microsoft​ Edge")
            .trim_end_matches(" - Brave")
            .trim_end_matches(" — Mozilla Firefox")
            .trim();

        let parts: Vec<&str> = clean_title.split(|c| c == '-' || c == '—' || c == '|').map(|s| s.trim()).collect();
        let main_topic = if !parts.is_empty() { parts[0].to_string() } else { clean_title.to_string() };

        let summary = if let Some(ref d) = domain {
            format!("{} \"{}\" on {}", verb, main_topic, d)
        } else {
            format!("{} \"{}\"", verb, main_topic)
        };

        return SmartContext {
            title: Some(clean_title.to_string()),
            category: "Browsing".to_string(),
            category_or_domain: domain,
            context_item: Some(main_topic),
            item_type: Some(subcat.to_string()),
            friendly_verb: verb.to_string(),
            friendly_summary: summary,
            icon,
        };
    }

    // 2. Code Editors (VS Code, Cursor, Visual Studio, Sublime, JetBrains, RustRover, CLion, PyCharm)
    if app_lower.contains("code") || app_lower.contains("cursor") || app_lower.contains("devenv") 
        || app_lower.contains("idea") || app_lower.contains("sublime") || app_lower.contains("rustrover") || app_lower.contains("pycharm") {
        
        let clean = title.trim_start_matches("● ").trim();
        let parts: Vec<&str> = clean.split(|c| c == '—' || c == '-').map(|s| s.trim()).collect();
        
        let file_or_tab = if !parts.is_empty() { parts[0].to_string() } else { clean.to_string() };
        let workspace = if parts.len() > 1 { Some(parts[1].to_string()) } else { None };

        let (lang, icon) = if file_or_tab.ends_with(".rs") {
            (Some("Rust"), "🦀")
        } else if file_or_tab.ends_with(".ts") || file_or_tab.ends_with(".tsx") {
            (Some("TypeScript / React"), "⚛️")
        } else if file_or_tab.ends_with(".js") || file_or_tab.ends_with(".jsx") {
            (Some("JavaScript"), "🟨")
        } else if file_or_tab.ends_with(".py") {
            (Some("Python"), "🐍")
        } else if file_or_tab.ends_with(".go") {
            (Some("Go"), "🐹")
        } else if file_or_tab.ends_with(".cpp") || file_or_tab.ends_with(".c") || file_or_tab.ends_with(".h") {
            (Some("C/C++"), "⚙️")
        } else if file_or_tab.ends_with(".html") || file_or_tab.ends_with(".css") {
            (Some("HTML/CSS"), "🎨")
        } else if file_or_tab.ends_with(".json") || file_or_tab.ends_with(".toml") || file_or_tab.ends_with(".yaml") || file_or_tab.ends_with(".yml") {
            (Some("Config File"), "⚙️")
        } else if file_or_tab.ends_with(".md") {
            (Some("Markdown Notes"), "📝")
        } else if file_or_tab.ends_with(".sql") {
            (Some("SQL Database"), "🗄️")
        } else {
            (Some("Source Code"), "💻")
        };

        let summary = if let Some(ref ws) = workspace {
            format!("Editing \"{}\" in project {}", file_or_tab, ws)
        } else {
            format!("Editing file \"{}\"", file_or_tab)
        };

        return SmartContext {
            title: Some(clean.to_string()),
            category: "Development".to_string(),
            category_or_domain: workspace,
            context_item: Some(file_or_tab),
            item_type: lang.map(|s| s.to_string()),
            friendly_verb: "Coding".to_string(),
            friendly_summary: summary,
            icon,
        };
    }

    // 3. Command Line & Terminals
    if app_lower.contains("windowsterminal") || app_lower.contains("powershell") || app_lower.contains("cmd.exe") || app_lower.contains("bash") || app_lower.contains("mintty") {
        return SmartContext {
            title: Some(title.to_string()),
            category: "Terminal".to_string(),
            category_or_domain: Some("Terminal".to_string()),
            context_item: Some(title.to_string()),
            item_type: Some("Terminal".to_string()),
            friendly_verb: "Running Commands".to_string(),
            friendly_summary: format!("Terminal: {}", title),
            icon: "⚡",
        };
    }

    // 4. File Explorer
    if app_lower.contains("explorer") {
        return SmartContext {
            title: Some(title.to_string()),
            category: "Files".to_string(),
            category_or_domain: Some("Files".to_string()),
            context_item: Some(title.to_string()),
            item_type: Some("Folder".to_string()),
            friendly_verb: "Looking at Files".to_string(),
            friendly_summary: format!("Browsing \"{}\" folder", title),
            icon: "📁",
        };
    }

    // 5. Office & Documents (Word, Excel, PowerPoint, Acrobat, PDF)
    if app_lower.contains("winword") || app_lower.contains("excel") || app_lower.contains("powerpnt") || app_lower.contains("acrobat") || app_lower.contains("foxit") {
        return SmartContext {
            title: Some(title.to_string()),
            category: "Documents".to_string(),
            category_or_domain: Some("Document".to_string()),
            context_item: Some(title.to_string()),
            item_type: Some("Document".to_string()),
            friendly_verb: "Reading / Writing".to_string(),
            friendly_summary: format!("Working on document \"{}\"", title),
            icon: "📄",
        };
    }

    // 6. Communication (Slack, Discord, Teams, Telegram, WhatsApp)
    if app_lower.contains("slack") || app_lower.contains("discord") || app_lower.contains("teams") || app_lower.contains("telegram") || app_lower.contains("whatsapp") {
        return SmartContext {
            title: Some(title.to_string()),
            category: "Communication".to_string(),
            category_or_domain: Some(app_name.to_string()),
            context_item: Some(title.to_string()),
            item_type: Some("Chat".to_string()),
            friendly_verb: "Messaging".to_string(),
            friendly_summary: format!("Chatting in {}", title),
            icon: "💬",
        };
    }

    // 7. Media & Music (Spotify, VLC, Windows Media)
    if app_lower.contains("spotify") || app_lower.contains("vlc") {
        return SmartContext {
            title: Some(title.to_string()),
            category: "Media".to_string(),
            category_or_domain: Some(app_name.to_string()),
            context_item: Some(title.to_string()),
            item_type: Some("Music / Video".to_string()),
            friendly_verb: "Listening / Watching".to_string(),
            friendly_summary: format!("Playing \"{}\"", title),
            icon: "🎵",
        };
    }

    // Default
    SmartContext {
        title: Some(title.to_string()),
        category: "Productivity".to_string(),
        category_or_domain: None,
        context_item: Some(title.to_string()),
        item_type: None,
        friendly_verb: "Using".to_string(),
        friendly_summary: format!("Working in {}", title),
        icon: "💻",
    }
}

#[cfg(windows)]
pub fn get_idle_duration_secs() -> u32 {
    use std::mem::size_of;
    use windows_sys::Win32::System::SystemInformation::GetTickCount64;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    unsafe {
        let mut lii = LASTINPUTINFO {
            cbSize: size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };

        if GetLastInputInfo(&mut lii) != 0 {
            let tick_count = GetTickCount64();
            let last_input = lii.dwTime as u64;
            // Handle tick count wrapping
            let idle_ms = if tick_count >= last_input {
                tick_count - last_input
            } else {
                0
            };
            (idle_ms / 1000) as u32
        } else {
            0
        }
    }
}

#[cfg(not(windows))]
pub fn get_idle_duration_secs() -> u32 {
    0
}

#[cfg(windows)]
pub fn get_active_window() -> Option<WindowInfo> {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use windows_sys::Win32::Foundation::{CloseHandle, HWND, MAX_PATH};
    use windows_sys::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    };

    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.is_null() {
            return None;
        }

        // 1. Get window title text
        let title_len = GetWindowTextLengthW(hwnd);
        let window_title = if title_len > 0 {
            let mut title_buf: Vec<u16> = vec![0; (title_len + 1) as usize];
            let copied = GetWindowTextW(hwnd, title_buf.as_mut_ptr(), title_len + 1);
            if copied > 0 {
                let os_str = OsString::from_wide(&title_buf[..copied as usize]);
                let title = os_str.to_string_lossy().trim().to_string();
                if title.is_empty() {
                    None
                } else {
                    Some(title)
                }
            } else {
                None
            }
        } else {
            None
        };

        // 2. Get process ID and executable name
        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut process_id);
        if process_id == 0 {
            return None;
        }

        let process_handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, process_id);
        if process_handle.is_null() {
            return None;
        }

        let mut path_buf: Vec<u16> = vec![0; MAX_PATH as usize * 2];
        let mut size = path_buf.len() as u32;

        let success = QueryFullProcessImageNameW(
            process_handle,
            0,
            path_buf.as_mut_ptr(),
            &mut size,
        );

        CloseHandle(process_handle);

        let (app_name, full_path) = if success != 0 && size > 0 {
            let full_path_os = OsString::from_wide(&path_buf[..size as usize]);
            let full_path = full_path_os.to_string_lossy().to_string();
            let app = Path::new(&full_path)
                .file_name()
                .map(|f| f.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string());
            (app, Some(full_path))
        } else {
            ("Application".to_string(), None)
        };

        let smart = parse_smart_context(&app_name, window_title.as_deref());

        Some(WindowInfo {
            application: app_name,
            window_title,
            executable_path: full_path,
            clean_context: smart.context_item,
            domain_or_tool: smart.category_or_domain,
        })
    }
}

#[cfg(not(windows))]
pub fn get_active_window() -> Option<WindowInfo> {
    Some(WindowInfo {
        application: "Simulator.exe".to_string(),
        window_title: Some("Development Window".to_string()),
        executable_path: None,
        clean_context: Some("Development Window".to_string()),
        domain_or_tool: None,
    })
}
