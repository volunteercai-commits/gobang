// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use shared_core::*;

// AI下棋命令
#[tauri::command]
pub fn ai_move(board: Vec<Vec<i32>>, ai_player: i32, human_player: i32) -> Result<(usize, usize), String> {
    let best_move = get_best_move(&board, ai_player, human_player);
    match best_move {
        Some(move_result) => Ok((move_result.row, move_result.col)),
        None => Err("AI无法找到合适的移动".to_string()),
    }
}

// 检查游戏是否结束
#[tauri::command]
pub fn check_win(board: Vec<Vec<i32>>, row: usize, col: usize) -> bool {
    shared_core::check_win(&board, row, col)
}

// 评估棋盘状态
#[tauri::command]
pub fn evaluate_board(board: Vec<Vec<i32>>, player: i32) -> i32 {
    shared_core::evaluate_board(&board, player)
}

// 获取可能的移动位置
#[tauri::command]
pub fn get_possible_moves(board: Vec<Vec<i32>>) -> Vec<(usize, usize)> {
    shared_core::get_possible_moves(&board)
}

// 创建新的游戏状态
#[tauri::command]
pub fn create_game_state(ai_player: i32, human_player: i32) -> GameState {
    shared_core::create_game_state(ai_player, human_player)
}

// 执行移动
#[tauri::command]
pub fn make_move(
    board: Vec<Vec<i32>>,
    current_player: i32,
    ai_player: i32,
    human_player: i32,
    row: usize,
    col: usize,
) -> Result<(bool, GameState), String> {
    let mut game_state = GameState {
        board,
        current_player,
        ai_player,
        human_player,
    };
    
    match shared_core::make_move(&mut game_state, row, col) {
        Ok(won) => Ok((won, game_state)),
        Err(e) => Err(e),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ai_move, 
            check_win, 
            evaluate_board, 
            get_possible_moves, 
            create_game_state, 
            make_move
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
