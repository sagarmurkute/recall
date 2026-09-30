use chrono::DateTime;
use eframe::egui::{self, Color32, RichText, Vec2};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use trace_core::{get_active_window, ActivityEvent, Database, PrivacyController, WindowInfo};

pub struct TraceApp {
    db: Database,
    privacy: Arc<Mutex<PrivacyController>>,
    is_recording: Arc<AtomicBool>,
    recent_events: Vec<ActivityEvent>,
    today_count: usize,
    current_window: Option<WindowInfo>,
    last_refresh: std::time::Instant,
}

impl TraceApp {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        // Set visual styling
        let mut visuals = egui::Visuals::light();
        visuals.window_rounding = 12.0.into();
        cc.egui_ctx.set_visuals(visuals);

        let db = Database::init(None).expect("Failed to initialize local SQLite database");
        let privacy = Arc::new(Mutex::new(PrivacyController::new()));
        let is_recording = Arc::new(AtomicBool::new(true));

        let initial_recent = db.get_recent_events(15).unwrap_or_default();
        let initial_today = db.get_today_count().unwrap_or(0);

        // Spawn background collector worker thread
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

                if let Some(active_win) = get_active_window() {
                    let privacy = privacy_clone.lock().unwrap();
                    let is_allowed = privacy.is_allowed(&active_win.application, active_win.window_title.as_deref());
                    drop(privacy);

                    if !is_allowed {
                        continue;
                    }

                    // Check if foreground window has changed
                    let has_changed = match &last_window {
                        Some(prev) => prev != &active_win,
                        None => true,
                    };

                    if has_changed {
                        // Update duration on previous event if present
                        if let Some(prev_id) = &current_event_id {
                            db_clone.update_duration(prev_id, active_seconds).ok();
                        }

                        // Create new event
                        let mut new_event = ActivityEvent::new_app_focus(
                            active_win.application.clone(),
                            active_win.window_title.clone(),
                            active_win.executable_path.clone(),
                        );
                        new_event.duration_seconds = 1;
                        active_seconds = 1;

                        if let Ok(()) = db_clone.insert_event(&new_event) {
                            current_event_id = Some(new_event.id);
                        }

                        last_window = Some(active_win);
                    } else {
                        // Same window is active: increment duration
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
            recent_events: initial_recent,
            today_count: initial_today,
            current_window: None,
            last_refresh: std::time::Instant::now(),
        }
    }

    fn refresh_data(&mut self) {
        if self.last_refresh.elapsed() > Duration::from_millis(800) {
            self.recent_events = self.db.get_recent_events(15).unwrap_or_default();
            self.today_count = self.db.get_today_count().unwrap_or(0);
            self.current_window = get_active_window();
            self.last_refresh = std::time::Instant::now();
        }
    }
}

impl eframe::App for TraceApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.refresh_data();
        ctx.request_repaint_after(Duration::from_millis(500));

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.add_space(8.0);

            // 1. Header & Title Bar
            ui.horizontal(|ui| {
                ui.heading(RichText::new("TRACE").strong().size(22.0).color(Color32::from_rgb(15, 23, 42)));
                ui.label(RichText::new("v0.1.0").small().color(Color32::from_rgb(148, 163, 184)));

                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    let recording = self.is_recording.load(Ordering::Relaxed);
                    if recording {
                        ui.label(RichText::new("● Recording").color(Color32::from_rgb(22, 163, 74)).strong().size(13.0));
                    } else {
                        ui.label(RichText::new("⏸ Paused").color(Color32::from_rgb(217, 119, 6)).strong().size(13.0));
                    }
                });
            });

            ui.add_space(6.0);
            ui.separator();
            ui.add_space(10.0);

            // 2. Control Bar: Pause / Resume Button
            ui.horizontal(|ui| {
                let recording = self.is_recording.load(Ordering::Relaxed);
                let btn_text = if recording { "⏸  Pause Recording" } else { "▶  Resume Recording" };
                let btn_color = if recording { Color32::from_rgb(239, 246, 255) } else { Color32::from_rgb(240, 253, 244) };

                if ui.add_sized(Vec2::new(ui.available_width() - 8.0, 36.0), egui::Button::new(RichText::new(btn_text).strong().size(13.0)).fill(btn_color)).clicked() {
                    let new_state = !recording;
                    self.is_recording.store(new_state, Ordering::Relaxed);
                    let mut priv_guard = self.privacy.lock().unwrap();
                    priv_guard.set_paused(!new_state);
                }
            });

            ui.add_space(12.0);

            // 3. Stats Block: Today's Total
            egui::Frame::none()
                .fill(Color32::from_rgb(248, 250, 252))
                .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(226, 232, 240)))
                .rounding(10.0)
                .inner_margin(12.0)
                .show(ui, |ui| {
                    ui.horizontal(|ui| {
                        ui.label(RichText::new("Today's Activity:").size(13.0).color(Color32::from_rgb(71, 85, 105)));
                        ui.label(RichText::new(format!("{} events", self.today_count)).strong().size(13.0).color(Color32::from_rgb(37, 99, 235)));

                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            ui.label(RichText::new("Local SQLite").small().color(Color32::from_rgb(148, 163, 184)));
                        });
                    });

                    if let Some(curr) = &self.current_window {
                        ui.add_space(6.0);
                        ui.horizontal(|ui| {
                            ui.label(RichText::new("Active:").small().strong().color(Color32::from_rgb(100, 116, 139)));
                            let title_preview = curr.window_title.as_deref().unwrap_or(&curr.application);
                            ui.label(RichText::new(format!("{} — {}", curr.application, title_preview)).small().color(Color32::from_rgb(30, 41, 59)));
                        });
                    }
                });

            ui.add_space(14.0);

            // 4. Section: Recent Activity Stream
            ui.horizontal(|ui| {
                ui.label(RichText::new("Recent Activity").strong().size(14.0).color(Color32::from_rgb(15, 23, 42)));
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if ui.small_button(RichText::new("Clear History").color(Color32::from_rgb(220, 38, 38))).clicked() {
                        self.db.clear_all().ok();
                        self.recent_events.clear();
                        self.today_count = 0;
                    }
                });
            });

            ui.add_space(6.0);

            // 5. Scrollable Event List
            egui::ScrollArea::vertical()
                .auto_shrink([false, false])
                .max_height(340.0)
                .show(ui, |ui| {
                    if self.recent_events.is_empty() {
                        ui.add_space(40.0);
                        ui.vertical_centered(|ui| {
                            ui.label(RichText::new("No activity recorded yet").color(Color32::from_rgb(148, 163, 184)));
                            ui.label(RichText::new("Switch windows or open apps to start recording").small().color(Color32::from_rgb(203, 213, 225)));
                        });
                    } else {
                        for event in &self.recent_events {
                            egui::Frame::none()
                                .fill(Color32::WHITE)
                                .stroke(egui::Stroke::new(1.0_f32, Color32::from_rgb(241, 245, 249)))
                                .rounding(8.0)
                                .inner_margin(8.0)
                                .show(ui, |ui| {
                                    ui.horizontal(|ui| {
                                        ui.label(RichText::new(&event.application).strong().size(12.0).color(Color32::from_rgb(37, 99, 235)));
                                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                                            // Format timestamp
                                            let time_str = DateTime::parse_from_rfc3339(&event.timestamp)
                                                .map(|dt| dt.format("%I:%M %p").to_string())
                                                .unwrap_or_else(|_| event.timestamp.clone());
                                            ui.label(RichText::new(time_str).small().color(Color32::from_rgb(148, 163, 184)));
                                        });
                                    });

                                    if let Some(title) = &event.window_title {
                                        ui.add_space(2.0);
                                        ui.label(RichText::new(title).size(11.0).color(Color32::from_rgb(71, 85, 105)));
                                    }
                                });
                            ui.add_space(4.0);
                        }
                    }
                });

            ui.add_space(8.0);
            ui.separator();
            ui.add_space(4.0);

            // 6. Footer Privacy Disclaimer
            ui.horizontal(|ui| {
                ui.label(RichText::new("🛡 100% Local-first & Private").small().color(Color32::from_rgb(148, 163, 184)));
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    ui.label(RichText::new("Zero Keystroke / Cloud Logging").small().color(Color32::from_rgb(148, 163, 184)));
                });
            });
        });
    }
}
