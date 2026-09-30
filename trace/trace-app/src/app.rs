use chrono::DateTime;
use eframe::egui::{self, Color32, RichText};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use trace_core::{
    get_active_window, get_idle_duration_secs, parse_smart_context, ActivityEvent, AppUsageStat,
    Database, PrivacyController, WindowInfo,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ActiveTab {
    Timeline,
    Analytics,
    Privacy,
    Export,
}

pub struct TraceApp {
    db: Database,
    privacy: Arc<Mutex<PrivacyController>>,
    is_recording: Arc<AtomicBool>,
    active_tab: ActiveTab,

    // Timeline & Search state
    search_query: String,
    selected_app_filter: String,
    available_apps: Vec<String>,
    events: Vec<ActivityEvent>,
    today_count: usize,
    current_window: Option<WindowInfo>,
    is_idle: bool,

    // Analytics state
    app_stats: Vec<AppUsageStat>,

    // Privacy inputs
    new_app_input: String,
    new_keyword_input: String,

    // Export feedback
    export_message: Option<String>,

    last_refresh: std::time::Instant,
}

impl TraceApp {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        let mut visuals = egui::Visuals::light();
        visuals.window_rounding = 10.0.into();
        cc.egui_ctx.set_visuals(visuals);

        let db = Database::init(None).expect("Failed to initialize local SQLite database");
        let mut privacy_controller = PrivacyController::new();

        // Load persisted privacy rules from SQLite
        if let Ok((apps, keywords)) = db.load_privacy_rules() {
            for app in apps {
                privacy_controller.add_excluded_app(&app);
            }
            for kw in keywords {
                privacy_controller.add_excluded_keyword(&kw);
            }
        }

        let privacy = Arc::new(Mutex::new(privacy_controller));
        let is_recording = Arc::new(AtomicBool::new(true));

        // Log session startup marker
        let mut startup_event = ActivityEvent::new_app_focus(
            "Trace".to_string(),
            Some("Trace Started Recording".to_string()),
            None,
        );
        startup_event.event_type = "session_lifecycle".to_string();
        startup_event.metadata = serde_json::json!({
            "category": "System",
            "item_type": "Session Lifecycle",
            "friendly_summary": "Trace started recording your activity memory",
            "icon": "🟢"
        });
        db.insert_event(&startup_event).ok();

        let initial_events = db.get_recent_events(40).unwrap_or_default();
        let initial_today = db.get_today_count().unwrap_or(0);
        let available_apps = db.get_distinct_applications().unwrap_or_default();
        let app_stats = db.get_app_breakdown_today().unwrap_or_default();

        // Background collector thread
        let db_clone = db.clone();
        let privacy_clone = privacy.clone();
        let is_recording_clone = is_recording.clone();

        thread::spawn(move || {
            let mut last_window: Option<WindowInfo> = None;
            let mut current_event_id: Option<String> = None;
            let mut active_seconds: u32 = 0;

            loop {
                thread::sleep(Duration::from_secs(1));

                if !is_recording_clone.load(Ordering::Relaxed) {
                    continue;
                }

                // Pause accumulation if AFK / idle > 2 minutes
                let idle_secs = get_idle_duration_secs();
                if idle_secs > 120 {
                    continue;
                }

                if let Some(active_win) = get_active_window() {
                    let privacy = privacy_clone.lock().unwrap();
                    let is_allowed = privacy.is_allowed(&active_win.application, active_win.window_title.as_deref());
                    drop(privacy);

                    if !is_allowed {
                        continue;
                    }

                    let has_changed = match &last_window {
                        Some(prev) => prev != &active_win,
                        None => true,
                    };

                    if has_changed {
                        // Update duration on prior event
                        if let Some(prev_id) = &current_event_id {
                            db_clone.update_duration(prev_id, active_seconds).ok();
                        }

                        let smart = parse_smart_context(&active_win.application, active_win.window_title.as_deref());

                        let mut new_event = ActivityEvent::new_app_focus(
                            active_win.application.clone(),
                            active_win.window_title.clone(),
                            active_win.executable_path.clone(),
                        );
                        new_event.duration_seconds = 1;
                        active_seconds = 1;

                        if let Some(ref domain) = smart.category_or_domain {
                            if domain.contains('.') {
                                new_event.url = Some(format!("https://{}", domain));
                            }
                        }

                        new_event.metadata = serde_json::json!({
                            "category": smart.category,
                            "context_item": smart.context_item,
                            "item_type": smart.item_type,
                            "domain_or_workspace": smart.category_or_domain,
                            "friendly_verb": smart.friendly_verb,
                            "friendly_summary": smart.friendly_summary,
                            "icon": smart.icon,
                        });

                        if let Ok(()) = db_clone.insert_event(&new_event) {
                            current_event_id = Some(new_event.id);
                        }

                        last_window = Some(active_win);
                    } else {
                        active_seconds += 1;
                        if let Some(event_id) = &current_event_id {
                            if active_seconds % 5 == 0 {
                                db_clone.update_duration(event_id, active_seconds).ok();
                            }
                        }
                    }
                }
            }
        });

        Self {
            db,
            privacy,
            is_recording,
            active_tab: ActiveTab::Timeline,
            search_query: String::new(),
            selected_app_filter: "All Apps".to_string(),
            available_apps,
            events: initial_events,
            today_count: initial_today,
            current_window: None,
            is_idle: false,
            app_stats,
            new_app_input: String::new(),
            new_keyword_input: String::new(),
            export_message: None,
            last_refresh: std::time::Instant::now(),
        }
    }

    fn refresh_data(&mut self) {
        if self.last_refresh.elapsed() > Duration::from_millis(800) {
            let filter = if self.selected_app_filter == "All Apps" {
                None
            } else {
                Some(self.selected_app_filter.as_str())
            };

            if self.search_query.trim().is_empty() && filter.is_none() {
                self.events = self.db.get_recent_events(50).unwrap_or_default();
            } else {
                self.events = self.db.search_events(&self.search_query, filter, 60).unwrap_or_default();
            }

            self.today_count = self.db.get_today_count().unwrap_or(0);
            self.current_window = get_active_window();
            self.is_idle = get_idle_duration_secs() > 120;
            self.available_apps = self.db.get_distinct_applications().unwrap_or_default();
            self.app_stats = self.db.get_app_breakdown_today().unwrap_or_default();
            self.last_refresh = std::time::Instant::now();
        }
    }

    fn format_duration(seconds: u32) -> String {
        if seconds < 60 {
            format!("{}s", seconds)
        } else if seconds < 3600 {
            format!("{}m {}s", seconds / 60, seconds % 60)
        } else {
            format!("{}h {}m", seconds / 3600, (seconds % 3600) / 60)
        }
    }

    fn format_relative_time(timestamp_str: &str) -> (String, String) {
        if let Ok(dt) = DateTime::parse_from_rfc3339(timestamp_str) {
            let now = chrono::Utc::now();
            let diff = now.signed_duration_since(dt.with_timezone(&chrono::Utc));
            let secs = diff.num_seconds();
            let exact = dt.format("%I:%M %p").to_string();

            let relative = if secs < 45 {
                "Just now".to_string()
            } else if secs < 3600 {
                format!("{}m ago", (secs / 60).max(1))
            } else if secs < 86400 {
                format!("{}h ago", secs / 3600)
            } else {
                dt.format("%b %d").to_string()
            };

            (relative, exact)
        } else {
            ("Recent".to_string(), timestamp_str.to_string())
        }
    }
}

impl Drop for TraceApp {
    fn drop(&mut self) {
        // Record session closed lifecycle event on exit
        let mut close_event = ActivityEvent::new_app_focus(
            "Trace".to_string(),
            Some("Trace Stopped Recording".to_string()),
            None,
        );
        close_event.event_type = "session_lifecycle".to_string();
        close_event.metadata = serde_json::json!({
            "category": "System",
            "item_type": "Session Lifecycle",
            "friendly_summary": "Trace stopped recording",
            "icon": "🔴"
        });
        self.db.insert_event(&close_event).ok();
    }
}

impl eframe::App for TraceApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.refresh_data();
        ctx.request_repaint_after(Duration::from_millis(500));

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.add_space(6.0);

            // ==========================================
            // 1. TOP HEADER & STATUS BAR
            // ==========================================
            ui.horizontal(|ui| {
                ui.heading(RichText::new("TRACE").strong().size(22.0).color(Color32::from_rgb(15, 23, 42)));
                ui.label(RichText::new("Your Activity Memory").small().color(Color32::from_rgb(100, 116, 139)));

                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    let recording = self.is_recording.load(Ordering::Relaxed);
                    if !recording {
                        ui.label(RichText::new("⏸ Paused").color(Color32::from_rgb(217, 119, 6)).strong().size(13.0));
                    } else if self.is_idle {
                        ui.label(RichText::new("💤 Idle / Away").color(Color32::from_rgb(100, 116, 139)).strong().size(13.0));
                    } else {
                        ui.label(RichText::new("● Remembering").color(Color32::from_rgb(22, 163, 74)).strong().size(13.0));
                    }
                });
            });

            ui.add_space(4.0);

            // ==========================================
            // "WHERE YOU LEFT OFF" (MEMORY ANCHOR)
            // ==========================================
            if let Some(curr) = &self.current_window {
                let smart = parse_smart_context(&curr.application, curr.window_title.as_deref());
                egui::Frame::none()
                    .fill(Color32::from_rgb(238, 242, 255))
                    .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(199, 210, 254)))
                    .rounding(8.0)
                    .inner_margin(10.0)
                    .show(ui, |ui| {
                        ui.horizontal(|ui| {
                            ui.label(RichText::new(smart.icon).size(18.0));
                            ui.vertical(|ui| {
                                ui.label(RichText::new("WHERE YOU ARE RIGHT NOW:").small().strong().color(Color32::from_rgb(79, 70, 229)));
                                ui.label(RichText::new(&smart.friendly_summary).strong().size(13.0).color(Color32::from_rgb(30, 27, 75)));
                                ui.label(RichText::new(format!("In application: {}", curr.application)).small().color(Color32::from_rgb(100, 116, 139)));
                            });
                        });
                    });
            }

            ui.add_space(6.0);

            // ==========================================
            // 2. NAVIGATION TABS & MASTER PAUSE CONTROL
            // ==========================================
            ui.horizontal(|ui| {
                let recording = self.is_recording.load(Ordering::Relaxed);
                let btn_text = if recording { "⏸ Pause Memory" } else { "▶ Resume Memory" };
                let btn_color = if recording { Color32::from_rgb(254, 242, 242) } else { Color32::from_rgb(240, 253, 244) };
                let text_color = if recording { Color32::from_rgb(185, 28, 28) } else { Color32::from_rgb(21, 128, 61) };

                if ui.add(egui::Button::new(RichText::new(btn_text).color(text_color).strong().size(12.0)).fill(btn_color)).clicked() {
                    let new_state = !recording;
                    self.is_recording.store(new_state, Ordering::Relaxed);
                    let mut priv_guard = self.privacy.lock().unwrap();
                    priv_guard.set_paused(!new_state);
                }

                ui.separator();

                ui.selectable_value(&mut self.active_tab, ActiveTab::Timeline, "🕒 Activity Timeline");
                ui.selectable_value(&mut self.active_tab, ActiveTab::Analytics, "📊 Time Spent");
                ui.selectable_value(&mut self.active_tab, ActiveTab::Privacy, "🛡 Privacy");
                ui.selectable_value(&mut self.active_tab, ActiveTab::Export, "💾 Data");
            });

            ui.separator();
            ui.add_space(4.0);

            // ==========================================
            // 3. TAB VIEWS
            // ==========================================
            match self.active_tab {
                // ------------------------------------------
                // TAB 1: TIMELINE & SEARCH (MEMORY RECALL)
                // ------------------------------------------
                ActiveTab::Timeline => {
                    // Search and Filter Bar
                    ui.horizontal(|ui| {
                        ui.label(RichText::new("🔍").size(14.0));
                        ui.add(egui::TextEdit::singleline(&mut self.search_query)
                            .hint_text("Search what you remember (e.g. video, notes, code, pdf)...")
                            .desired_width(220.0));

                        egui::ComboBox::from_id_salt("app_filter")
                            .selected_text(&self.selected_app_filter)
                            .width(130.0)
                            .show_ui(ui, |ui| {
                                ui.selectable_value(&mut self.selected_app_filter, "All Apps".to_string(), "All Apps");
                                for app in &self.available_apps {
                                    ui.selectable_value(&mut self.selected_app_filter, app.clone(), app);
                                }
                            });
                    });

                    ui.add_space(4.0);

                    // Quick deletion toolbar
                    ui.horizontal(|ui| {
                        ui.label(RichText::new(format!("Today: {} memory encounters", self.today_count)).small().color(Color32::from_rgb(71, 85, 105)));
                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            if ui.small_button(RichText::new("Clear All").color(Color32::from_rgb(220, 38, 38))).clicked() {
                                self.db.clear_all().ok();
                                self.events.clear();
                                self.today_count = 0;
                            }
                            if ui.small_button(RichText::new("Forget Last 1 hour").color(Color32::from_rgb(180, 83, 9))).clicked() {
                                self.db.delete_events_since(3600).ok();
                            }
                            if ui.small_button(RichText::new("Forget Last 15 mins").color(Color32::from_rgb(180, 83, 9))).clicked() {
                                self.db.delete_events_since(900).ok();
                            }
                        });
                    });

                    ui.add_space(4.0);

                    // Event Feed
                    egui::ScrollArea::vertical()
                        .auto_shrink([false, false])
                        .max_height(410.0)
                        .show(ui, |ui| {
                            if self.events.is_empty() {
                                ui.add_space(40.0);
                                ui.vertical_centered(|ui| {
                                    ui.label(RichText::new("💡 No matching activities found").strong().color(Color32::from_rgb(100, 116, 139)));
                                    ui.label(RichText::new("Try typing a simpler word like 'youtube', 'notes', or clear your search").small().color(Color32::from_rgb(148, 163, 184)));
                                });
                            } else {
                                let mut to_delete = None;

                                for event in &self.events {
                                    let is_lifecycle = event.event_type == "session_lifecycle";

                                    if is_lifecycle {
                                        // Session start/stop pill
                                        egui::Frame::none()
                                            .fill(Color32::from_rgb(248, 250, 252))
                                            .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(226, 232, 240)))
                                            .rounding(6.0)
                                            .inner_margin(6.0)
                                            .show(ui, |ui| {
                                                ui.horizontal(|ui| {
                                                    let is_start = event.window_title.as_deref().unwrap_or("").contains("Started");
                                                    let icon = if is_start { "🟢" } else { "🔴" };
                                                    let title = event.window_title.as_deref().unwrap_or("Trace Session");
                                                    ui.label(RichText::new(format!("{} {}", icon, title)).small().strong().color(Color32::from_rgb(71, 85, 105)));

                                                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                                                        let (rel, exact) = Self::format_relative_time(&event.timestamp);
                                                        ui.label(RichText::new(format!("{} ({})", rel, exact)).small().color(Color32::from_rgb(148, 163, 184)));
                                                    });
                                                });
                                            });
                                        ui.add_space(4.0);
                                        continue;
                                    }

                                    // Extract friendly metadata
                                    let icon = event.metadata.get("icon").and_then(|v| v.as_str()).unwrap_or("💻");
                                    let summary = event.metadata.get("friendly_summary").and_then(|v| v.as_str())
                                        .unwrap_or_else(|| event.window_title.as_deref().unwrap_or(&event.application));
                                    let item_type = event.metadata.get("item_type").and_then(|v| v.as_str());
                                    let domain_or_ws = event.metadata.get("domain_or_workspace").and_then(|v| v.as_str());

                                    let (rel_time, exact_time) = Self::format_relative_time(&event.timestamp);

                                    egui::Frame::none()
                                        .fill(Color32::WHITE)
                                        .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(226, 232, 240)))
                                        .rounding(8.0)
                                        .inner_margin(10.0)
                                        .show(ui, |ui| {
                                            ui.horizontal(|ui| {
                                                ui.label(RichText::new(icon).size(16.0));
                                                
                                                ui.vertical(|ui| {
                                                    // Top line: Human friendly sentence
                                                    ui.horizontal(|ui| {
                                                        ui.label(RichText::new(summary).strong().size(12.5).color(Color32::from_rgb(15, 23, 42)));
                                                        
                                                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                                                            if ui.small_button(RichText::new("✕").color(Color32::from_rgb(156, 163, 175))).on_hover_text("Forget this event").clicked() {
                                                                to_delete = Some(event.id.clone());
                                                            }
                                                            ui.label(RichText::new(format!("{} ({})", rel_time, exact_time)).small().color(Color32::from_rgb(100, 116, 139)));
                                                        });
                                                    });

                                                    ui.add_space(2.0);

                                                    // Bottom line: App details, duration and badges
                                                    ui.horizontal(|ui| {
                                                        ui.label(RichText::new(format!("In {}", event.application)).small().color(Color32::from_rgb(71, 85, 105)));

                                                        if event.duration_seconds > 0 {
                                                            ui.label(RichText::new(format!("• Spent {}", Self::format_duration(event.duration_seconds))).small().color(Color32::from_rgb(37, 99, 235)));
                                                        }

                                                        if let Some(t) = item_type {
                                                            ui.label(RichText::new(format!("• [{}]", t)).small().color(Color32::from_rgb(124, 58, 237)));
                                                        }

                                                        if let Some(url) = &event.url {
                                                            ui.label(RichText::new(format!("• 🌐 {}", url)).small().color(Color32::from_rgb(16, 185, 129)));
                                                        } else if let Some(ws) = domain_or_ws {
                                                            ui.label(RichText::new(format!("• 📦 {}", ws)).small().color(Color32::from_rgb(79, 70, 229)));
                                                        }
                                                    });
                                                });
                                            });
                                        });
                                    ui.add_space(4.0);
                                }

                                if let Some(id) = to_delete {
                                    self.db.delete_event_by_id(&id).ok();
                                }
                            }
                        });
                }

                // ------------------------------------------
                // TAB 2: TIME SPENT & SUMMARY
                // ------------------------------------------
                ActiveTab::Analytics => {
                    ui.label(RichText::new("Today's Screen Time Summary").strong().size(14.0).color(Color32::from_rgb(15, 23, 42)));
                    ui.label(RichText::new("See how much time you spent in each application today (away/idle time is paused)").small().color(Color32::from_rgb(100, 116, 139)));
                    ui.add_space(8.0);

                    let total_secs: u32 = self.app_stats.iter().map(|s| s.total_seconds).sum();

                    egui::Frame::none()
                        .fill(Color32::from_rgb(248, 250, 252))
                        .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(226, 232, 240)))
                        .rounding(8.0)
                        .inner_margin(10.0)
                        .show(ui, |ui| {
                            ui.horizontal(|ui| {
                                ui.label(RichText::new("Total Active Time Today:").size(13.0).color(Color32::from_rgb(71, 85, 105)));
                                ui.label(RichText::new(Self::format_duration(total_secs)).strong().size(14.0).color(Color32::from_rgb(37, 99, 235)));
                            });
                        });

                    ui.add_space(8.0);

                    egui::ScrollArea::vertical()
                        .auto_shrink([false, false])
                        .max_height(380.0)
                        .show(ui, |ui| {
                            if self.app_stats.is_empty() {
                                ui.label("No activities recorded yet today.");
                            } else {
                                for stat in &self.app_stats {
                                    let pct = if total_secs > 0 { (stat.total_seconds as f32 / total_secs as f32) * 100.0 } else { 0.0 };

                                    egui::Frame::none()
                                        .fill(Color32::WHITE)
                                        .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(241, 245, 249)))
                                        .rounding(6.0)
                                        .inner_margin(8.0)
                                        .show(ui, |ui| {
                                            ui.horizontal(|ui| {
                                                ui.label(RichText::new(&stat.application).strong().size(12.0).color(Color32::from_rgb(30, 41, 59)));
                                                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                                                    ui.label(RichText::new(format!("{} ({:.1}%)", Self::format_duration(stat.total_seconds), pct)).strong().size(12.0).color(Color32::from_rgb(37, 99, 235)));
                                                });
                                            });

                                            ui.add_space(3.0);
                                            let bar = egui::ProgressBar::new(pct / 100.0)
                                                .show_percentage()
                                                .fill(Color32::from_rgb(59, 130, 246));
                                            ui.add(bar);
                                        });
                                    ui.add_space(4.0);
                                }
                            }
                        });
                }

                // ------------------------------------------
                // TAB 3: PRIVACY & EXCLUSIONS
                // ------------------------------------------
                ActiveTab::Privacy => {
                    ui.label(RichText::new("Privacy Rules & Ignored Apps").strong().size(14.0).color(Color32::from_rgb(15, 23, 42)));
                    ui.label(RichText::new("Trace will never log anything from these apps or matching titles.").small().color(Color32::from_rgb(100, 116, 139)));
                    ui.add_space(8.0);

                    // Add Excluded App
                    ui.horizontal(|ui| {
                        ui.label(RichText::new("Ignore App:").strong().small());
                        ui.add(egui::TextEdit::singleline(&mut self.new_app_input).hint_text("e.g. slack.exe or telegram.exe").desired_width(180.0));
                        if ui.button("Add App").clicked() && !self.new_app_input.trim().is_empty() {
                            let app_name = self.new_app_input.trim().to_string();
                            let mut priv_guard = self.privacy.lock().unwrap();
                            priv_guard.add_excluded_app(&app_name);
                            self.db.add_privacy_rule("app", &app_name).ok();
                            self.new_app_input.clear();
                        }
                    });

                    // Add Excluded Keyword
                    ui.horizontal(|ui| {
                        ui.label(RichText::new("Ignore Keyword:").strong().small());
                        ui.add(egui::TextEdit::singleline(&mut self.new_keyword_input).hint_text("e.g. bank or payroll").desired_width(180.0));
                        if ui.button("Add Keyword").clicked() && !self.new_keyword_input.trim().is_empty() {
                            let kw = self.new_keyword_input.trim().to_string();
                            let mut priv_guard = self.privacy.lock().unwrap();
                            priv_guard.add_excluded_keyword(&kw);
                            self.db.add_privacy_rule("keyword", &kw).ok();
                            self.new_keyword_input.clear();
                        }
                    });

                    ui.add_space(8.0);
                    ui.separator();
                    ui.add_space(4.0);

                    egui::ScrollArea::vertical()
                        .auto_shrink([false, false])
                        .max_height(320.0)
                        .show(ui, |ui| {
                            let (apps, keywords) = {
                                let priv_guard = self.privacy.lock().unwrap();
                                (priv_guard.excluded_apps.clone(), priv_guard.excluded_keywords.clone())
                            };

                            ui.label(RichText::new("Excluded Applications:").strong().small().color(Color32::from_rgb(71, 85, 105)));
                            let mut remove_app = None;
                            for app in &apps {
                                ui.horizontal(|ui| {
                                    ui.label(RichText::new(format!("🚫 {}", app)).size(11.0));
                                    if ui.small_button("remove").clicked() {
                                        remove_app = Some(app.clone());
                                    }
                                });
                            }

                            if let Some(a) = remove_app {
                                let mut priv_guard = self.privacy.lock().unwrap();
                                priv_guard.remove_excluded_app(&a);
                                self.db.remove_privacy_rule("app", &a).ok();
                            }

                            ui.add_space(8.0);
                            ui.label(RichText::new("Excluded Window Keywords:").strong().small().color(Color32::from_rgb(71, 85, 105)));
                            let mut remove_kw = None;
                            for kw in &keywords {
                                ui.horizontal(|ui| {
                                    ui.label(RichText::new(format!("🔒 \"{}\"", kw)).size(11.0));
                                    if ui.small_button("remove").clicked() {
                                        remove_kw = Some(kw.clone());
                                    }
                                });
                            }

                            if let Some(k) = remove_kw {
                                let mut priv_guard = self.privacy.lock().unwrap();
                                priv_guard.remove_excluded_keyword(&k);
                                self.db.remove_privacy_rule("keyword", &k).ok();
                            }
                        });
                }

                // ------------------------------------------
                // TAB 4: DATA & EXPORT
                // ------------------------------------------
                ActiveTab::Export => {
                    ui.label(RichText::new("Your Data Stays On Your Computer").strong().size(14.0).color(Color32::from_rgb(15, 23, 42)));
                    ui.label(RichText::new("All memory is stored on your local disk in a private SQLite database.").small().color(Color32::from_rgb(100, 116, 139)));
                    ui.add_space(8.0);

                    egui::Frame::none()
                        .fill(Color32::from_rgb(248, 250, 252))
                        .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(226, 232, 240)))
                        .rounding(8.0)
                        .inner_margin(10.0)
                        .show(ui, |ui| {
                            ui.label(RichText::new("Database Location:").strong().small().color(Color32::from_rgb(71, 85, 105)));
                            ui.label(RichText::new(self.db.db_path.to_string_lossy()).small().color(Color32::from_rgb(30, 41, 59)));
                            ui.add_space(4.0);
                            ui.label(RichText::new(format!("Total Memories Stored: {}", self.today_count)).small().color(Color32::from_rgb(100, 116, 139)));
                        });

                    ui.add_space(10.0);

                    ui.horizontal(|ui| {
                        if ui.button(RichText::new("📄 Export to JSON").strong()).clicked() {
                            if let Ok(json) = self.db.export_events_json() {
                                let export_path = self.db.db_path.with_file_name("trace_export.json");
                                if std::fs::write(&export_path, json).is_ok() {
                                    self.export_message = Some(format!("Exported to: {}", export_path.display()));
                                }
                            }
                        }

                        if ui.button(RichText::new("📊 Export to CSV (Spreadsheet)").strong()).clicked() {
                            if let Ok(csv) = self.db.export_events_csv() {
                                let export_path = self.db.db_path.with_file_name("trace_export.csv");
                                if std::fs::write(&export_path, csv).is_ok() {
                                    self.export_message = Some(format!("Exported to: {}", export_path.display()));
                                }
                            }
                        }
                    });

                    if let Some(msg) = &self.export_message {
                        ui.add_space(6.0);
                        ui.label(RichText::new(msg).small().color(Color32::from_rgb(22, 163, 74)));
                    }

                    ui.add_space(16.0);
                    ui.separator();
                    ui.add_space(8.0);

                    ui.label(RichText::new("Erase All Data").strong().color(Color32::from_rgb(220, 38, 38)));
                    if ui.button(RichText::new("🗑 Erase All Activity Memories").color(Color32::from_rgb(220, 38, 38))).clicked() {
                        self.db.clear_all().ok();
                        self.events.clear();
                        self.today_count = 0;
                        self.export_message = Some("All memory history has been completely erased.".to_string());
                    }
                }
            }

            ui.add_space(6.0);
            ui.separator();
            ui.add_space(4.0);

            // ==========================================
            // 4. FOOTER PRIVACY PILL
            // ==========================================
            ui.horizontal(|ui| {
                ui.label(RichText::new("🛡 100% Local-First").small().color(Color32::from_rgb(148, 163, 184)));
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    ui.label(RichText::new("Zero Keystrokes • Zero Cloud Uploads").small().color(Color32::from_rgb(148, 163, 184)));
                });
            });
        });
    }
}
