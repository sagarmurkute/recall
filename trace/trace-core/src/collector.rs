use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WindowInfo {
    pub application: String,
    pub window_title: Option<String>,
    pub executable_path: Option<String>,
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

        if success != 0 && size > 0 {
            let full_path_os = OsString::from_wide(&path_buf[..size as usize]);
            let full_path = full_path_os.to_string_lossy().to_string();
            let app_name = Path::new(&full_path)
                .file_name()
                .map(|f| f.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string());

            Some(WindowInfo {
                application: app_name,
                window_title,
                executable_path: Some(full_path),
            })
        } else {
            Some(WindowInfo {
                application: "Application".to_string(),
                window_title,
                executable_path: None,
            })
        }
    }
}

#[cfg(not(windows))]
pub fn get_active_window() -> Option<WindowInfo> {
    Some(WindowInfo {
        application: "Simulator.exe".to_string(),
        window_title: Some("Development Window".to_string()),
        executable_path: None,
    })
}
