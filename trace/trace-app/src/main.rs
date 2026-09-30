#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;

use app::TraceApp;
use eframe::egui::Vec2;

fn main() -> eframe::Result<()> {
    let native_options = eframe::NativeOptions {
        viewport: eframe::egui::ViewportBuilder::default()
            .with_title("Trace — Personal Activity Memory")
            .with_inner_size(Vec2::new(480.0, 680.0))
            .with_min_inner_size(Vec2::new(400.0, 520.0))
            .with_resizable(true),
        ..Default::default()
    };

    eframe::run_native(
        "Trace",
        native_options,
        Box::new(|cc| Ok(Box::new(TraceApp::new(cc)))),
    )
}
