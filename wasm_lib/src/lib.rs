// WASM适配层 - 将共享核心暴露给Web应用
use wasm_bindgen::prelude::*;
use shared_core::*;

// 当wasm_bindgen被调用时，初始化console_error_panic_hook
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

// 将共享核心的AI移动函数暴露给JavaScript
#[wasm_bindgen]
pub fn get_best_move_wasm(board: &[i32], ai_player: i32, human_player: i32) -> Result<JsValue, JsValue> {
    // 将一维数组转换为二维数组
    let mut board_2d = vec![vec![0; BOARD_SIZE]; BOARD_SIZE];
    for i in 0..board.len() {
        let row = i / BOARD_SIZE;
        let col = i % BOARD_SIZE;
        board_2d[row][col] = board[i];
    }
    
    match get_best_move(&board_2d, ai_player, human_player) {
        Some(move_result) => {
            let js_value = serde_wasm_bindgen::to_value(&move_result)
                .map_err(|e| JsValue::from_str(&format!("序列化错误: {}", e)))?;
            Ok(js_value)
        }
        None => Err(JsValue::from_str("AI无法找到合适的移动")),
    }
}

// 支持难度等级的AI移动函数
#[wasm_bindgen]
pub fn get_best_move_with_difficulty_wasm(board: &[i32], ai_player: i32, human_player: i32, difficulty: &str) -> Result<JsValue, JsValue> {
    // 将一维数组转换为二维数组
    let mut board_2d = vec![vec![0; BOARD_SIZE]; BOARD_SIZE];
    for i in 0..board.len() {
        let row = i / BOARD_SIZE;
        let col = i % BOARD_SIZE;
        board_2d[row][col] = board[i];
    }
    
    // 解析难度等级
    let ai_difficulty = match difficulty {
        "easy" => AIDifficulty::Easy,
        "medium" => AIDifficulty::Medium,
        "hard" => AIDifficulty::Hard,
        _ => AIDifficulty::Easy, // 默认简单
    };
    
    match get_best_move_with_difficulty(&board_2d, ai_player, human_player, ai_difficulty) {
        Some(move_result) => {
            let js_value = serde_wasm_bindgen::to_value(&move_result)
                .map_err(|e| JsValue::from_str(&format!("序列化错误: {}", e)))?;
            Ok(js_value)
        }
        None => Err(JsValue::from_str("AI无法找到合适的移动")),
    }
}

// 检查获胜状态
#[wasm_bindgen]
pub fn check_win_wasm(board: &[i32], row: usize, col: usize) -> bool {
    let mut board_2d = vec![vec![0; BOARD_SIZE]; BOARD_SIZE];
    for i in 0..board.len() {
        let r = i / BOARD_SIZE;
        let c = i % BOARD_SIZE;
        board_2d[r][c] = board[i];
    }
    
    check_win(&board_2d, row, col)
}

// 评估棋盘状态
#[wasm_bindgen]
pub fn evaluate_board_wasm(board: &[i32], player: i32) -> i32 {
    let mut board_2d = vec![vec![0; BOARD_SIZE]; BOARD_SIZE];
    for i in 0..board.len() {
        let r = i / BOARD_SIZE;
        let c = i % BOARD_SIZE;
        board_2d[r][c] = board[i];
    }
    
    evaluate_board(&board_2d, player)
}

// 获取可能的移动位置
#[wasm_bindgen]
pub fn get_possible_moves_wasm(board: &[i32]) -> Result<JsValue, JsValue> {
    let mut board_2d = vec![vec![0; BOARD_SIZE]; BOARD_SIZE];
    for i in 0..board.len() {
        let r = i / BOARD_SIZE;
        let c = i % BOARD_SIZE;
        board_2d[r][c] = board[i];
    }
    
    let moves = get_possible_moves(&board_2d);
    let js_value = serde_wasm_bindgen::to_value(&moves)
        .map_err(|e| JsValue::from_str(&format!("序列化错误: {}", e)))?;
    Ok(js_value)
}

// 创建新的游戏状态
#[wasm_bindgen]
pub fn create_game_state_wasm(ai_player: i32, human_player: i32) -> Result<JsValue, JsValue> {
    let game_state = create_game_state(ai_player, human_player);
    let js_value = serde_wasm_bindgen::to_value(&game_state)
        .map_err(|e| JsValue::from_str(&format!("序列化错误: {}", e)))?;
    Ok(js_value)
}

// 执行移动
#[wasm_bindgen]
pub fn make_move_wasm(
    board: &[i32],
    current_player: i32,
    ai_player: i32,
    human_player: i32,
    row: usize,
    col: usize,
) -> Result<JsValue, JsValue> {
    let mut board_2d = vec![vec![0; BOARD_SIZE]; BOARD_SIZE];
    for i in 0..board.len() {
        let r = i / BOARD_SIZE;
        let c = i % BOARD_SIZE;
        board_2d[r][c] = board[i];
    }
    
    let mut game_state = GameState {
        board: board_2d,
        current_player,
        ai_player,
        human_player,
    };
    
    match make_move(&mut game_state, row, col) {
        Ok(won) => {
            let result = serde_wasm_bindgen::to_value(&(won, game_state))
                .map_err(|e| JsValue::from_str(&format!("序列化错误: {}", e)))?;
            Ok(result)
        }
        Err(e) => Err(JsValue::from_str(&e)),
    }
}