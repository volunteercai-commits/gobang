// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// AI引擎模块
mod ai_engine;

// AI下棋命令
#[tauri::command]
fn ai_move(board: Vec<Vec<i32>>, ai_player: i32, human_player: i32) -> Result<(usize, usize), String> {
    let best_move = ai_engine::get_best_move(&board, ai_player, human_player);
    match best_move {
        Some((row, col)) => Ok((row, col)),
        None => Err("AI无法找到合适的移动".to_string()),
    }
}

// 检查游戏是否结束
#[tauri::command]
fn check_win(board: Vec<Vec<i32>>, row: usize, col: usize) -> bool {
    ai_engine::check_win(&board, row, col)
}

// 评估棋盘状态
#[tauri::command]
fn evaluate_board(board: Vec<Vec<i32>>, player: i32) -> i32 {
    ai_engine::evaluate_board(&board, player)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ai_move, check_win, evaluate_board])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
