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
    pub category_or_domain: Option<String>,
    pub context_item: Option<String>,
}

/// Extract clean contextual domain/project/file from raw window title
pub fn parse_smart_context(app_name: &str, raw_title: Option<&str>) -> SmartContext {
    let app_lower = app_name.to_lowercase();
    let title = match raw_title {
        Some(t) if !t.trim().is_empty() => t.trim(),
        _ => return SmartContext { title: None, category_or_domain: None, context_item: None },
    };

    // 1. Web Browsers (Chrome, Edge, Brave, Firefox, Arc, Opera)
    if app_lower.contains("chrome") || app_lower.contains("msedge") || app_lower.contains("brave") 
        || app_lower.contains("firefox") || app_lower.contains("arc") || app_lower.contains("opera") {
        
        // Split on standard browser title delimiters: " - ", " — ", " | "
        let parts: Vec<&str> = title.split(|c| c == '-' || c == '—' || c == '|').map(|s| s.trim()).collect();
        
        let mut domain_or_tool = None;
        let mut context_item = None;

        let title_lower = title.to_lowercase();
        if title_lower.contains("youtube") {
            domain_or_tool = Some("youtube.com".to_string());
        } else if title_lower.contains("github") {
            domain_or_tool = Some("github.com".to_string());
        } else if title_lower.contains("chatgpt") || title_lower.contains("openai") {
            domain_or_tool = Some("chatgpt.com".to_string());
        } else if title_lower.contains("google docs") || title_lower.contains("google sheets") {
            domain_or_tool = Some("docs.google.com".to_string());
        } else if title_lower.contains("notion") {
            domain_or_tool = Some("notion.so".to_string());
        } else if title_lower.contains("figma") {
            domain_or_tool = Some("figma.com".to_string());
        } else if title_lower.contains("stack overflow") {
            domain_or_tool = Some("stackoverflow.com".to_string());
        } else if title_lower.contains("reddit") {
            domain_or_tool = Some("reddit.com".to_string());
        }

        if !parts.is_empty() {
            context_item = Some(parts[0].to_string());
        }

        return SmartContext {
            title: Some(title.to_string()),
            category_or_domain: domain_or_tool,
            context_item,
        };
    }

    // 2. Code Editors (VS Code, Cursor, Visual Studio, Sublime, JetBrains)
    if app_lower.contains("code") || app_lower.contains("cursor") || app_lower.contains("devenv") || app_lower.contains("idea") || app_lower.contains("sublime") {
        // VS Code format: "● filename.ext — workspace_name — Visual Studio Code"
        let clean = title.trim_start_matches("● ").trim();
        let parts: Vec<&str> = clean.split(|c| c == '—' || c == '-').map(|s| s.trim()).collect();
        
        let file_or_proj = if !parts.is_empty() { Some(parts[0].to_string()) } else { None };
        let workspace = if parts.len() > 1 { Some(parts[1].to_string()) } else { None };

        return SmartContext {
            title: Some(title.to_string()),
            category_or_domain: workspace,
            context_item: file_or_proj,
        };
    }

    // 3. File Explorer
    if app_lower.contains("explorer") {
        return SmartContext {
            title: Some(title.to_string()),
            category_or_domain: Some("File System".to_string()),
            context_item: Some(title.to_string()),
        };
    }

    // Default
    SmartContext {
        title: Some(title.to_string()),
        category_or_domain: None,
        context_item: None,
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
