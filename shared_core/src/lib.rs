// 共享核心库 - 五子棋AI引擎
// 平台无关的业务逻辑，可同时用于Tauri和WASM

use serde::{Deserialize, Serialize};

// 游戏常量
pub const BOARD_SIZE: usize = 15;
pub const WIN_LENGTH: usize = 5;
pub const MAX_DEPTH: i32 = 2;  // 进一步减少搜索深度，确保3秒内完成
pub const WIN_SCORE: i32 = 100000;
pub const LOSE_SCORE: i32 = -100000;
pub const MAX_MOVES: usize = 12;  // 进一步限制候选移动数量

// 方向向量
const DIRECTIONS: [(i32, i32); 4] = [
    (0, 1),   // 横向
    (1, 0),   // 纵向
    (1, 1),   // 主对角线
    (1, -1),  // 副对角线
];

// 游戏状态结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub board: Vec<Vec<i32>>,
    pub current_player: i32,
    pub ai_player: i32,
    pub human_player: i32,
}

// 移动结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveResult {
    pub row: usize,
    pub col: usize,
    pub score: i32,
}

// 检查位置是否有效
pub fn is_valid_position(row: i32, col: i32) -> bool {
    row >= 0 && row < BOARD_SIZE as i32 && col >= 0 && col < BOARD_SIZE as i32
}

// 检查是否获胜
pub fn check_win(board: &Vec<Vec<i32>>, row: usize, col: usize) -> bool {
    let player = board[row][col];
    if player == 0 {
        return false;
    }

    for (dx, dy) in DIRECTIONS.iter() {
        let mut count = 1;
        
        // 检查正方向
        for i in 1..WIN_LENGTH {
            let new_row = row as i32 + dx * i as i32;
            let new_col = col as i32 + dy * i as i32;
            if !is_valid_position(new_row, new_col) || 
               board[new_row as usize][new_col as usize] != player {
                break;
            }
            count += 1;
        }
        
        // 检查反方向
        for i in 1..WIN_LENGTH {
            let new_row = row as i32 - dx * i as i32;
            let new_col = col as i32 - dy * i as i32;
            if !is_valid_position(new_row, new_col) || 
               board[new_row as usize][new_col as usize] != player {
                break;
            }
            count += 1;
        }
        
        if count >= WIN_LENGTH {
            return true;
        }
    }
    
    false
}

// 评估位置分数
fn evaluate_position(board: &Vec<Vec<i32>>, row: usize, col: usize, player: i32) -> i32 {
    let mut score = 0;
    
    for (dx, dy) in DIRECTIONS.iter() {
        let mut count = 1;
        let mut blocked = 0;
        
        // 检查正方向
        for i in 1..WIN_LENGTH {
            let new_row = row as i32 + dx * i as i32;
            let new_col = col as i32 + dy * i as i32;
            if !is_valid_position(new_row, new_col) {
                blocked += 1;
                break;
            }
            let cell = board[new_row as usize][new_col as usize];
            if cell == player {
                count += 1;
            } else if cell == 0 {
                break;
            } else {
                blocked += 1;
                break;
            }
        }
        
        // 检查反方向
        for i in 1..WIN_LENGTH {
            let new_row = row as i32 - dx * i as i32;
            let new_col = col as i32 - dy * i as i32;
            if !is_valid_position(new_row, new_col) {
                blocked += 1;
                break;
            }
            let cell = board[new_row as usize][new_col as usize];
            if cell == player {
                count += 1;
            } else if cell == 0 {
                break;
            } else {
                blocked += 1;
                break;
            }
        }
        
        // 根据连子数量和阻塞情况评分
        if count >= WIN_LENGTH {
            score += WIN_SCORE;
        } else if count == WIN_LENGTH - 1 && blocked == 0 {
            score += 5000; // 活四
        } else if count == WIN_LENGTH - 1 && blocked == 1 {
            score += 1000; // 冲四
        } else if count == WIN_LENGTH - 2 && blocked == 0 {
            score += 500;  // 活三
        } else if count == WIN_LENGTH - 2 && blocked == 1 {
            score += 100;  // 眠三
        } else if count == WIN_LENGTH - 3 && blocked == 0 {
            score += 50;   // 活二
        } else if count == WIN_LENGTH - 3 && blocked == 1 {
            score += 10;   // 眠二
        }
    }
    
    score
}

// 评估整个棋盘
pub fn evaluate_board(board: &Vec<Vec<i32>>, player: i32) -> i32 {
    let mut score = 0;
    
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] == player {
                score += evaluate_position(board, row, col, player);
            } else if board[row][col] == -player {
                score -= evaluate_position(board, row, col, -player);
            }
        }
    }
    
    score
}

// 获取可能的移动位置（优化版）
pub fn get_possible_moves(board: &Vec<Vec<i32>>) -> Vec<(usize, usize)> {
    let mut moves = Vec::new();
    
    // 检查是否为空棋盘
    let mut has_pieces = false;
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] != 0 {
                has_pieces = true;
                break;
            }
        }
        if has_pieces { break; }
    }
    
    // 如果棋盘为空，返回中心位置
    if !has_pieces {
        moves.push((7, 7));
        return moves;
    }
    
    // 找到所有已有棋子的位置
    let mut piece_positions = Vec::new();
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] != 0 {
                piece_positions.push((row, col));
            }
        }
    }
    
    // 为每个已有棋子周围的空位添加候选位置（缩小搜索范围）
    let mut candidate_positions = std::collections::HashSet::new();
    
    for (piece_row, piece_col) in piece_positions {
        // 只搜索周围1格范围内的位置，减少候选数量
        for dr in -1..=1 {
            for dc in -1..=1 {
                if dr == 0 && dc == 0 { continue; } // 跳过自己
                
                let new_row = piece_row as i32 + dr;
                let new_col = piece_col as i32 + dc;
                
                if is_valid_position(new_row, new_col) {
                    let row = new_row as usize;
                    let col = new_col as usize;
                    
                    if board[row][col] == 0 {
                        candidate_positions.insert((row, col));
                    }
                }
            }
        }
    }
    
    // 将候选位置添加到移动列表
    for (row, col) in candidate_positions {
        moves.push((row, col));
    }
    
    // 按重要性排序并限制数量
    if moves.len() > MAX_MOVES {
        // 按位置价值排序，优先选择更有价值的位置
        moves.sort_by_key(|&(row, col)| {
            let center = 7;
            let distance_from_center = (row as i32 - center).abs() + (col as i32 - center).abs();
            // 距离中心越近，价值越高（分数越小）
            distance_from_center
        });
        moves.truncate(MAX_MOVES);
    }
    
    // 如果没有找到任何移动，返回所有空位
    if moves.is_empty() {
        for row in 0..BOARD_SIZE {
            for col in 0..BOARD_SIZE {
                if board[row][col] == 0 {
                    moves.push((row, col));
                }
            }
        }
    }
    
    moves
}

// Minimax算法（优化版）
fn minimax(
    board: &mut Vec<Vec<i32>>,
    depth: i32,
    alpha: i32,
    beta: i32,
    is_maximizing: bool,
    player: i32,
    opponent: i32,
) -> i32 {
    if depth == 0 {
        return evaluate_board(board, player);
    }
    
    // 快速检查获胜（只检查关键位置）
    let moves = get_possible_moves(board);
    if moves.is_empty() {
        return evaluate_board(board, player);
    }
    
    // 限制搜索的移动数量，确保快速响应
    let search_moves = if moves.len() > 6 {
        &moves[..6]  // 只搜索前6个最佳候选位置
    } else {
        &moves
    };
    
    if is_maximizing {
        let mut max_eval = LOSE_SCORE;
        let mut alpha = alpha;
        for &(row, col) in search_moves {
            board[row][col] = player;
            
            // 快速获胜检查
            if check_win(board, row, col) {
                board[row][col] = 0;
                return WIN_SCORE;
            }
            
            let eval = minimax(board, depth - 1, alpha, beta, false, player, opponent);
            board[row][col] = 0;
            max_eval = max_eval.max(eval);
            alpha = alpha.max(eval);
            if beta <= alpha {
                break; // Alpha-Beta剪枝
            }
        }
        max_eval
    } else {
        let mut min_eval = WIN_SCORE;
        let mut beta = beta;
        for &(row, col) in search_moves {
            board[row][col] = opponent;
            
            // 快速获胜检查
            if check_win(board, row, col) {
                board[row][col] = 0;
                return LOSE_SCORE;
            }
            
            let eval = minimax(board, depth - 1, alpha, beta, true, player, opponent);
            board[row][col] = 0;
            min_eval = min_eval.min(eval);
            beta = beta.min(eval);
            if beta <= alpha {
                break; // Alpha-Beta剪枝
            }
        }
        min_eval
    }
}

// 获取最佳移动（优化版）
pub fn get_best_move(board: &Vec<Vec<i32>>, ai_player: i32, human_player: i32) -> Option<MoveResult> {
    // 检查AI立即获胜
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] == 0 {
                let mut test_board = board.clone();
                test_board[row][col] = ai_player;
                if check_win(&test_board, row, col) {
                    return Some(MoveResult {
                        row,
                        col,
                        score: WIN_SCORE,
                    });
                }
            }
        }
    }
    
    // 检查阻止对手立即获胜
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] == 0 {
                let mut test_board = board.clone();
                test_board[row][col] = human_player;
                if check_win(&test_board, row, col) {
                    return Some(MoveResult {
                        row,
                        col,
                        score: WIN_SCORE - 1,
                    });
                }
            }
        }
    }
    
    // 使用Minimax算法
    let moves = get_possible_moves(board);
    
    if moves.is_empty() {
        return None;
    }
    
    let mut best_move = None;
    let mut best_score = LOSE_SCORE;
    
    // 限制搜索的移动数量，确保3秒内完成
    let search_moves = if moves.len() > 8 {
        &moves[..8]  // 只搜索前8个最佳候选位置
    } else {
        &moves
    };
    
    for &(row, col) in search_moves {
        let mut test_board = board.clone();
        test_board[row][col] = ai_player;
        let score = minimax(&mut test_board, MAX_DEPTH, LOSE_SCORE, WIN_SCORE, false, ai_player, human_player);
        
        if score > best_score {
            best_score = score;
            best_move = Some(MoveResult {
                row,
                col,
                score,
            });
        }
    }
    
    best_move
}

// 创建新的游戏状态
pub fn create_game_state(ai_player: i32, human_player: i32) -> GameState {
    GameState {
        board: vec![vec![0; BOARD_SIZE]; BOARD_SIZE],
        current_player: human_player, // 人类先手
        ai_player,
        human_player,
    }
}

// 执行移动
pub fn make_move(game_state: &mut GameState, row: usize, col: usize) -> Result<bool, String> {
    if !is_valid_position(row as i32, col as i32) {
        return Err("无效的位置".to_string());
    }
    
    if game_state.board[row][col] != 0 {
        return Err("位置已被占用".to_string());
    }
    
    game_state.board[row][col] = game_state.current_player;
    
    // 检查是否获胜
    let won = check_win(&game_state.board, row, col);
    
    // 切换玩家
    game_state.current_player = if game_state.current_player == game_state.ai_player {
        game_state.human_player
    } else {
        game_state.ai_player
    };
    
    Ok(won)
}