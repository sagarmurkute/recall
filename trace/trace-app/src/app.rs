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

    // Timeline state
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

        // Log clean session startup event
        let mut startup_event = ActivityEvent::new_app_focus(
            "Trace".to_string(),
            Some("Trace Session Started".to_string()),
            None,
        );
        startup_event.event_type = "session_lifecycle".to_string();
        startup_event.metadata = serde_json::json!({
            "category": "System",
            "item_type": "Session Lifecycle",
            "lifecycle": "start"
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

                // Check idle duration (pause accumulation if idle > 2 minutes)
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
}

impl Drop for TraceApp {
    fn drop(&mut self) {
        // Record session closed lifecycle event on exit
        let mut close_event = ActivityEvent::new_app_focus(
            "Trace".to_string(),
            Some("Trace Session Closed".to_string()),
            None,
        );
        close_event.event_type = "session_lifecycle".to_string();
        close_event.metadata = serde_json::json!({
            "category": "System",
            "item_type": "Session Lifecycle",
            "lifecycle": "stop"
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
                ui.label(RichText::new("v0.2.0").small().color(Color32::from_rgb(148, 163, 184)));

                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    let recording = self.is_recording.load(Ordering::Relaxed);
                    if !recording {
                        ui.label(RichText::new("⏸ Paused").color(Color32::from_rgb(217, 119, 6)).strong().size(13.0));
                    } else if self.is_idle {
                        ui.label(RichText::new("💤 Idle (AFK)").color(Color32::from_rgb(100, 116, 139)).strong().size(13.0));
                    } else {
                        ui.label(RichText::new("● Recording").color(Color32::from_rgb(22, 163, 74)).strong().size(13.0));
                    }
                });
            });

            ui.add_space(4.0);

            // Active Window Pill
            if let Some(curr) = &self.current_window {
                egui::Frame::none()
                    .fill(Color32::from_rgb(241, 245, 249))
                    .rounding(6.0)
                    .inner_margin(6.0)
                    .show(ui, |ui| {
                        ui.horizontal(|ui| {
                            ui.label(RichText::new("CURRENT FOCUS:").small().strong().color(Color32::from_rgb(100, 116, 139)));
                            ui.label(RichText::new(&curr.application).strong().small().color(Color32::from_rgb(37, 99, 235)));
                            if let Some(title) = &curr.window_title {
                                let clean = if title.len() > 45 { format!("{}...", &title[..42]) } else { title.clone() };
                                ui.label(RichText::new(format!("— {}", clean)).small().color(Color32::from_rgb(51, 65, 85)));
                            }
                        });
                    });
            }

            ui.add_space(6.0);

            // ==========================================
            // 2. NAVIGATION TABS & MASTER PAUSE CONTROL
            // ==========================================
            ui.horizontal(|ui| {
                let recording = self.is_recording.load(Ordering::Relaxed);
                let btn_text = if recording { "⏸ Pause" } else { "▶ Resume" };
                let btn_color = if recording { Color32::from_rgb(254, 242, 242) } else { Color32::from_rgb(240, 253, 244) };
                let text_color = if recording { Color32::from_rgb(185, 28, 28) } else { Color32::from_rgb(21, 128, 61) };

                if ui.add(egui::Button::new(RichText::new(btn_text).color(text_color).strong().size(12.0)).fill(btn_color)).clicked() {
                    let new_state = !recording;
                    self.is_recording.store(new_state, Ordering::Relaxed);
                    let mut priv_guard = self.privacy.lock().unwrap();
                    priv_guard.set_paused(!new_state);
                }

                ui.separator();

                ui.selectable_value(&mut self.active_tab, ActiveTab::Timeline, "🕒 Timeline");
                ui.selectable_value(&mut self.active_tab, ActiveTab::Analytics, "📊 Analytics");
                ui.selectable_value(&mut self.active_tab, ActiveTab::Privacy, "🛡 Privacy");
                ui.selectable_value(&mut self.active_tab, ActiveTab::Export, "💾 Data & Export");
            });

            ui.separator();
            ui.add_space(4.0);

            // ==========================================
            // 3. TAB VIEWS
            // ==========================================
            match self.active_tab {
                // ------------------------------------------
                // TAB 1: TIMELINE & SEARCH
                // ------------------------------------------
                ActiveTab::Timeline => {
                    // Search and Filter Bar
                    ui.horizontal(|ui| {
                        ui.label(RichText::new("🔍").size(13.0));
                        ui.add(egui::TextEdit::singleline(&mut self.search_query).hint_text("Search activities or titles...").desired_width(180.0));

                        egui::ComboBox::from_id_salt("app_filter")
                            .selected_text(&self.selected_app_filter)
                            .width(120.0)
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
                        ui.label(RichText::new(format!("Today: {} events", self.today_count)).small().color(Color32::from_rgb(71, 85, 105)));
                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            if ui.small_button(RichText::new("Clear All").color(Color32::from_rgb(220, 38, 38))).clicked() {
                                self.db.clear_all().ok();
                                self.events.clear();
                                self.today_count = 0;
                            }
                            if ui.small_button(RichText::new("Delete Last 1h").color(Color32::from_rgb(180, 83, 9))).clicked() {
                                self.db.delete_events_since(3600).ok();
                            }
                            if ui.small_button(RichText::new("Delete Last 15m").color(Color32::from_rgb(180, 83, 9))).clicked() {
                                self.db.delete_events_since(900).ok();
                            }
                        });
                    });

                    ui.add_space(4.0);

                    // Event Feed
                    egui::ScrollArea::vertical()
                        .auto_shrink([false, false])
                        .max_height(440.0)
                        .show(ui, |ui| {
                            if self.events.is_empty() {
                                ui.add_space(50.0);
                                ui.vertical_centered(|ui| {
                                    ui.label(RichText::new("No matching activities found").color(Color32::from_rgb(148, 163, 184)));
                                    ui.label(RichText::new("Switch windows or adjust filters").small().color(Color32::from_rgb(203, 213, 225)));
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
                                                    ui.label(RichText::new(format!("{} {}", icon, event.window_title.as_deref().unwrap_or("Session Event"))).small().strong().color(Color32::from_rgb(71, 85, 105)));

                                                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                                                        let time_str = DateTime::parse_from_rfc3339(&event.timestamp)
                                                            .map(|dt| dt.format("%I:%M %p").to_string())
                                                            .unwrap_or_else(|_| event.timestamp.clone());
                                                        ui.label(RichText::new(time_str).small().color(Color32::from_rgb(148, 163, 184)));
                                                    });
                                                });
                                            });
                                        ui.add_space(4.0);
                                        continue;
                                    }

                                    // Standard activity card
                                    let item_type = event.metadata.get("item_type").and_then(|v| v.as_str());
                                    let context_item = event.metadata.get("context_item").and_then(|v| v.as_str());
                                    let domain_or_ws = event.metadata.get("domain_or_workspace").and_then(|v| v.as_str());

                                    egui::Frame::none()
                                        .fill(Color32::WHITE)
                                        .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(241, 245, 249)))
                                        .rounding(6.0)
                                        .inner_margin(8.0)
                                        .show(ui, |ui| {
                                            ui.horizontal(|ui| {
                                                ui.label(RichText::new(&event.application).strong().size(12.0).color(Color32::from_rgb(37, 99, 235)));
                                                
                                                if let Some(t) = item_type {
                                                    ui.label(RichText::new(format!("[{}]", t)).small().color(Color32::from_rgb(124, 58, 237)));
                                                }

                                                if event.duration_seconds > 0 {
                                                    ui.label(RichText::new(format!("• {}", Self::format_duration(event.duration_seconds))).small().color(Color32::from_rgb(100, 116, 139)));
                                                }

                                                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                                                    if ui.small_button(RichText::new("×").color(Color32::from_rgb(156, 163, 175))).clicked() {
                                                        to_delete = Some(event.id.clone());
                                                    }

                                                    let time_str = DateTime::parse_from_rfc3339(&event.timestamp)
                                                        .map(|dt| dt.format("%I:%M %p").to_string())
                                                        .unwrap_or_else(|_| event.timestamp.clone());
                                                    ui.label(RichText::new(time_str).small().color(Color32::from_rgb(148, 163, 184)));
                                                });
                                            });

                                            // Main Context/File/Topic
                                            if let Some(item) = context_item {
                                                ui.add_space(2.0);
                                                ui.label(RichText::new(item).strong().size(11.0).color(Color32::from_rgb(30, 41, 59)));
                                            } else if let Some(title) = &event.window_title {
                                                ui.add_space(2.0);
                                                ui.label(RichText::new(title).size(11.0).color(Color32::from_rgb(71, 85, 105)));
                                            }

                                            // Subtitle / URL / Workspace
                                            if let Some(url) = &event.url {
                                                ui.horizontal(|ui| {
                                                    ui.label(RichText::new(format!("🌐 {}", url)).small().color(Color32::from_rgb(16, 185, 129)));
                                                });
                                            } else if let Some(ws) = domain_or_ws {
                                                ui.horizontal(|ui| {
                                                    ui.label(RichText::new(format!("📦 {}", ws)).small().color(Color32::from_rgb(100, 116, 139)));
                                                });
                                            }
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
                // TAB 2: APP USAGE ANALYTICS
                // ------------------------------------------
                ActiveTab::Analytics => {
                    ui.label(RichText::new("Today's Application Time Breakdown").strong().size(14.0).color(Color32::from_rgb(15, 23, 42)));
                    ui.label(RichText::new("Calculated from active foreground duration (idle time excluded)").small().color(Color32::from_rgb(100, 116, 139)));
                    ui.add_space(8.0);

                    let total_secs: u32 = self.app_stats.iter().map(|s| s.total_seconds).sum();

                    egui::Frame::none()
                        .fill(Color32::from_rgb(248, 250, 252))
                        .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(226, 232, 240)))
                        .rounding(8.0)
                        .inner_margin(10.0)
                        .show(ui, |ui| {
                            ui.horizontal(|ui| {
                                ui.label(RichText::new("Total Active Focus:").size(13.0).color(Color32::from_rgb(71, 85, 105)));
                                ui.label(RichText::new(Self::format_duration(total_secs)).strong().size(14.0).color(Color32::from_rgb(37, 99, 235)));
                            });
                        });

                    ui.add_space(8.0);

                    egui::ScrollArea::vertical()
                        .auto_shrink([false, false])
                        .max_height(380.0)
                        .show(ui, |ui| {
                            if self.app_stats.is_empty() {
                                ui.label("No statistics available yet today.");
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
                                            // Progress visual bar
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
                // TAB 3: PRIVACY & EXCLUSION RULES
                // ------------------------------------------
                ActiveTab::Privacy => {
                    ui.label(RichText::new("Exclusion Rules & Filters").strong().size(14.0).color(Color32::from_rgb(15, 23, 42)));
                    ui.label(RichText::new("Trace will never record or log activities matching these apps or titles.").small().color(Color32::from_rgb(100, 116, 139)));
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
                    ui.label(RichText::new("Local Data Ownership & Export").strong().size(14.0).color(Color32::from_rgb(15, 23, 42)));
                    ui.label(RichText::new("Your activity memory is stored entirely on your local machine in SQLite.").small().color(Color32::from_rgb(100, 116, 139)));
                    ui.add_space(8.0);

                    egui::Frame::none()
                        .fill(Color32::from_rgb(248, 250, 252))
                        .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(226, 232, 240)))
                        .rounding(8.0)
                        .inner_margin(10.0)
                        .show(ui, |ui| {
                            ui.label(RichText::new("SQLite Database Location:").strong().small().color(Color32::from_rgb(71, 85, 105)));
                            ui.label(RichText::new(self.db.db_path.to_string_lossy()).small().color(Color32::from_rgb(30, 41, 59)));
                            ui.add_space(4.0);
                            ui.label(RichText::new(format!("Total Recorded Events: {}", self.today_count)).small().color(Color32::from_rgb(100, 116, 139)));
                        });

                    ui.add_space(10.0);

                    ui.horizontal(|ui| {
                        if ui.button(RichText::new("📄 Export JSON").strong()).clicked() {
                            if let Ok(json) = self.db.export_events_json() {
                                let export_path = self.db.db_path.with_file_name("trace_export.json");
                                if std::fs::write(&export_path, json).is_ok() {
                                    self.export_message = Some(format!("Exported to: {}", export_path.display()));
                                }
                            }
                        }

                        if ui.button(RichText::new("📊 Export CSV").strong()).clicked() {
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

                    ui.label(RichText::new("Danger Zone").strong().color(Color32::from_rgb(220, 38, 38)));
                    if ui.button(RichText::new("🗑 Wipe All Local Memory Database").color(Color32::from_rgb(220, 38, 38))).clicked() {
                        self.db.clear_all().ok();
                        self.events.clear();
                        self.today_count = 0;
                        self.export_message = Some("All local activity memory wiped cleanly.".to_string());
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
                    ui.label(RichText::new("Zero Keystroke / Cloud Logging").small().color(Color32::from_rgb(148, 163, 184)));
                });
            });
        });
    }
}
