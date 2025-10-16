// 共享核心库 - 五子棋AI引擎
// 平台无关的业务逻辑，可同时用于Tauri和WASM

use serde::{Deserialize, Serialize};
use rayon::prelude::*;
use std::sync::{Arc, Mutex};

// 游戏常量
pub const BOARD_SIZE: usize = 15;
pub const WIN_LENGTH: usize = 5;
pub const WIN_SCORE: i32 = 100000;
pub const LOSE_SCORE: i32 = -100000;
pub const MAX_MOVES: usize = 15;
pub const MAX_DEPTH: i32 = 4;

// AI难度等级
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AIDifficulty {
    Easy,    // 简单：深度2，候选6，并行度1
    Medium,  // 中等：深度3，候选10，并行度2
    Hard,    // 困难：深度4，候选12，并行度4
}

impl AIDifficulty {
    pub fn get_max_depth(&self) -> i32 {
        match self {
            AIDifficulty::Easy => 0,    // 初级不用深度搜索
            AIDifficulty::Medium => 1,  // 中级1层
            AIDifficulty::Hard => 2,    // 高级2层
        }
    }
    
    pub fn get_max_moves(&self) -> usize {
        match self {
            AIDifficulty::Easy => 3,    // 初级只搜索3个位置
            AIDifficulty::Medium => 5,  // 中级5个
            AIDifficulty::Hard => 8,    // 高级8个
        }
    }
    
    pub fn get_parallel_threads(&self) -> usize {
        match self {
            AIDifficulty::Easy => 1,    // 初级单线程
            AIDifficulty::Medium => 1,  // 中级单线程
            AIDifficulty::Hard => 2,    // 高级2线程
        }
    }
    
    pub fn get_time_limit_ms(&self) -> u64 {
        match self {
            AIDifficulty::Easy => 0,     // 初级无时间限制
            AIDifficulty::Medium => 0,   // 中级无时间限制
            AIDifficulty::Hard => 0,     // 高级无时间限制
        }
    }
}

// 方向向量
const DIRECTIONS: [(i32, i32); 4] = [
    (0, 1),   // 横向
    (1, 0),   // 纵向
    (1, 1),   // 主对角线
    (1, -1),  // 副对角线
];

// 开局库已移除，使用智能评估逻辑

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

// 五子棋模式识别结构
#[derive(Debug, Clone)]
struct PatternInfo {
    count: usize,      // 连子数量
    blocked: usize,    // 被阻塞的方向数
    empty_ends: usize, // 空端数量
}

// 分析一个方向的模式
fn analyze_direction(board: &Vec<Vec<i32>>, row: usize, col: usize, dx: i32, dy: i32, player: i32) -> PatternInfo {
    let mut count = 1;
    let mut blocked = 0;
    let mut empty_ends = 0;
    
    // 检查正方向
    let mut pos = 1;
    loop {
        let new_row = row as i32 + dx * pos;
        let new_col = col as i32 + dy * pos;
        if !is_valid_position(new_row, new_col) {
            blocked += 1;
            break;
        }
        let cell = board[new_row as usize][new_col as usize];
        if cell == player {
            count += 1;
            pos += 1;
        } else if cell == 0 {
            empty_ends += 1;
            break;
        } else {
            blocked += 1;
            break;
        }
    }
    
    // 检查反方向
    pos = 1;
    loop {
        let new_row = row as i32 - dx * pos;
        let new_col = col as i32 - dy * pos;
        if !is_valid_position(new_row, new_col) {
            blocked += 1;
            break;
        }
        let cell = board[new_row as usize][new_col as usize];
        if cell == player {
            count += 1;
            pos += 1;
        } else if cell == 0 {
            empty_ends += 1;
            break;
        } else {
            blocked += 1;
            break;
        }
    }
    
    PatternInfo { count, blocked, empty_ends }
}

// 评估位置分数（改进版）
fn evaluate_position(board: &Vec<Vec<i32>>, row: usize, col: usize, player: i32) -> i32 {
    let mut score = 0;
    let mut patterns = Vec::new();
    
    // 分析四个方向的模式
    for (dx, dy) in DIRECTIONS.iter() {
        let pattern = analyze_direction(board, row, col, *dx, *dy, player);
        patterns.push(pattern);
    }
    
    // 根据模式组合评分
    for pattern in &patterns {
        match pattern.count {
            5 => score += WIN_SCORE, // 五连
            4 => {
                if pattern.blocked == 0 {
                    score += 50000; // 活四
                } else if pattern.blocked == 1 {
                    score += 10000; // 冲四
                }
            },
            3 => {
                if pattern.blocked == 0 {
                    score += 5000; // 活三
                } else if pattern.blocked == 1 {
                    score += 1000; // 眠三
                }
            },
            2 => {
                if pattern.blocked == 0 {
                    score += 500; // 活二
                } else if pattern.blocked == 1 {
                    score += 100; // 眠二
                }
            },
            1 => {
                if pattern.blocked == 0 {
                    score += 50; // 活一
                }
            },
            _ => {}
        }
    }
    
    // 特别关注3连和4连的威胁
    let live_fours = patterns.iter().filter(|p| p.count == 4 && p.blocked == 0).count();
    let live_threes = patterns.iter().filter(|p| p.count == 3 && p.blocked == 0).count();
    let sleep_fours = patterns.iter().filter(|p| p.count == 4 && p.blocked == 1).count();
    let sleep_threes = patterns.iter().filter(|p| p.count == 3 && p.blocked == 1).count();
    
    // 3连威胁加分
    if live_threes > 0 {
        score += live_threes as i32 * 8000; // 活三威胁
    }
    if sleep_threes > 0 {
        score += sleep_threes as i32 * 2000; // 眠三威胁
    }
    
    // 4连威胁加分
    if live_fours > 0 {
        score += live_fours as i32 * 60000; // 活四威胁
    }
    if sleep_fours > 0 {
        score += sleep_fours as i32 * 15000; // 冲四威胁
    }
    
    // 特殊模式加分
    let live_fours = patterns.iter().filter(|p| p.count == 4 && p.blocked == 0).count();
    let live_threes = patterns.iter().filter(|p| p.count == 3 && p.blocked == 0).count();
    let live_twos = patterns.iter().filter(|p| p.count == 2 && p.blocked == 0).count();
    
    // 双活三、双活四等组合模式
    if live_fours >= 2 {
        score += 100000; // 双活四
    } else if live_fours >= 1 && live_threes >= 1 {
        score += 80000; // 活四+活三
    } else if live_threes >= 2 {
        score += 30000; // 双活三
    } else if live_threes >= 1 && live_twos >= 2 {
        score += 15000; // 活三+双活二
    }
    
    // 中心位置加分
    let center = 7;
    let distance_from_center = (row as i32 - center).abs() + (col as i32 - center).abs();
    if distance_from_center <= 2 {
        score += 100; // 中心区域加分
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

// 获取可能的移动位置（智能版）
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
    
    // 为每个已有棋子周围的空位添加候选位置（扩大搜索范围）
    let mut candidate_positions = std::collections::HashSet::new();
    
    for (piece_row, piece_col) in piece_positions {
        // 搜索周围2格范围内的位置，增加候选数量
        for dr in -2..=2 {
            for dc in -2..=2 {
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
    
    // 按位置价值排序
    moves.sort_by_key(|&(row, col)| {
        // 计算位置价值：考虑中心距离和周围棋子密度
        let center = 7;
        let distance_from_center = (row as i32 - center).abs() + (col as i32 - center).abs();
        
        // 计算周围棋子密度
        let mut neighbor_count = 0;
        for dr in -1..=1 {
            for dc in -1..=1 {
                if dr == 0 && dc == 0 { continue; }
                let new_row = row as i32 + dr;
                let new_col = col as i32 + dc;
                if is_valid_position(new_row, new_col) && board[new_row as usize][new_col as usize] != 0 {
                    neighbor_count += 1;
                }
            }
        }
        
        // 优先选择：距离中心近且周围有棋子的位置
        // 对于相同价值的位置，优先选择更靠近中心的位置
        (distance_from_center, -neighbor_count, row.abs_diff(center as usize), col.abs_diff(center as usize))
    });
    
    // 限制数量但保留更多候选
    if moves.len() > MAX_MOVES {
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

// Minimax算法（智能版）
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
    
    // 获取可能的移动
    let moves = get_possible_moves(board);
    if moves.is_empty() {
        return evaluate_board(board, player);
    }
    
    // 动态调整搜索的移动数量
    let search_moves = if moves.len() > 12 {
        &moves[..12]  // 搜索前12个最佳候选位置
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

// 并行Minimax算法（高性能版）
fn parallel_minimax(
    board: &Vec<Vec<i32>>,
    depth: i32,
    alpha: i32,
    beta: i32,
    is_maximizing: bool,
    player: i32,
    opponent: i32,
    difficulty: AIDifficulty,
) -> i32 {
    if depth == 0 {
        return evaluate_board(board, player);
    }
    
    // 获取可能的移动
    let moves = get_possible_moves(board);
    if moves.is_empty() {
        return evaluate_board(board, player);
    }
    
    // 根据难度调整搜索的移动数量
    let max_moves = difficulty.get_max_moves();
    let search_moves = if moves.len() > max_moves {
        &moves[..max_moves]
    } else {
        &moves
    };
    
    if is_maximizing {
        let mut max_eval = LOSE_SCORE;
        let mut alpha = alpha;
        
        // 并行处理移动
        let results: Vec<(usize, usize, i32)> = search_moves
            .par_iter()
            .map(|&(row, col)| {
                let mut test_board = board.clone();
                test_board[row][col] = player;
                
                // 快速获胜检查
                if check_win(&test_board, row, col) {
                    return (row, col, WIN_SCORE);
                }
                
                let eval = parallel_minimax(&test_board, depth - 1, alpha, beta, false, player, opponent, difficulty);
                (row, col, eval)
            })
            .collect();
        
        // 按分数排序并应用Alpha-Beta剪枝
        for (row, col, eval) in results {
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
        
        // 并行处理移动
        let results: Vec<(usize, usize, i32)> = search_moves
            .par_iter()
            .map(|&(row, col)| {
                let mut test_board = board.clone();
                test_board[row][col] = opponent;
                
                // 快速获胜检查
                if check_win(&test_board, row, col) {
                    return (row, col, LOSE_SCORE);
                }
                
                let eval = parallel_minimax(&test_board, depth - 1, alpha, beta, true, player, opponent, difficulty);
                (row, col, eval)
            })
            .collect();
        
        // 按分数排序并应用Alpha-Beta剪枝
        for (row, col, eval) in results {
            min_eval = min_eval.min(eval);
            beta = beta.min(eval);
            if beta <= alpha {
                break; // Alpha-Beta剪枝
            }
        }
        
        min_eval
    }
}

// 获取最佳移动（智能版）
pub fn get_best_move(board: &Vec<Vec<i32>>, ai_player: i32, human_player: i32) -> Option<MoveResult> {
    get_best_move_with_difficulty(board, ai_player, human_player, AIDifficulty::Hard)
}

// 根据难度等级获取最佳移动（高性能并行版）
pub fn get_best_move_with_difficulty(board: &Vec<Vec<i32>>, ai_player: i32, human_player: i32, difficulty: AIDifficulty) -> Option<MoveResult> {
    
    // 0. AI先手必须下天元（中心位置）
    let move_count = count_moves(board);
    if move_count == 0 {
        // 第一步：AI先手必须下天元
        if board[7][7] == 0 {
            return Some(MoveResult {
                row: 7,
                col: 7,
                score: 10000, // 天元位置的高分
            });
        }
    }
    
    // 0.5. AI后手第二步：在人类棋子的八个方向中选择一个
    if move_count == 1 {
        // 找到人类棋子的位置
        let mut human_pos = None;
        for row in 0..BOARD_SIZE {
            for col in 0..BOARD_SIZE {
                if board[row][col] != 0 {
                    human_pos = Some((row, col));
                    break;
                }
            }
            if human_pos.is_some() { break; }
        }
        
        if let Some((h_row, h_col)) = human_pos {
            // 八个方向：上下左右和四个对角线
            let directions = [
                (-1, -1), (-1, 0), (-1, 1),  // 上左、上、上右
                (0, -1),           (0, 1),   // 左、右
                (1, -1),  (1, 0),  (1, 1),   // 下左、下、下右
            ];
            
            // 按优先级选择方向：优先选择中心方向
            let center = 7;
            let mut best_direction = None;
            let mut best_distance = 100;
            
            for &(dr, dc) in &directions {
                let new_row = h_row as i32 + dr;
                let new_col = h_col as i32 + dc;
                
                if is_valid_position(new_row, new_col) {
                    let row = new_row as usize;
                    let col = new_col as usize;
                    
                    if board[row][col] == 0 {
                        // 计算这个位置到中心的距离
                        let distance = (row as i32 - center).abs() + (col as i32 - center).abs();
                        if distance < best_distance {
                            best_distance = distance;
                            best_direction = Some((row, col));
                        }
                    }
                }
            }
            
            if let Some((row, col)) = best_direction {
                return Some(MoveResult {
                    row,
                    col,
                    score: 8000, // 八个方向位置的高分
                });
            }
        }
    }
    
    // 1. 检查AI立即获胜（最高优先级）
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
    
    // 2. 检查对手立即获胜（必须防守）
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
    
    // 3. 评估当前威胁情况
    let mut ai_threats = Vec::new();
    let mut human_threats = Vec::new();
    
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] == 0 {
                // 评估AI在这个位置的威胁
                let mut test_board = board.clone();
                test_board[row][col] = ai_player;
                let ai_score = evaluate_board(&test_board, ai_player);
                
                // 评估对手在这个位置的威胁
                let mut test_board2 = board.clone();
                test_board2[row][col] = human_player;
                let human_score = evaluate_board(&test_board2, human_player);
                
                ai_threats.push((row, col, ai_score));
                human_threats.push((row, col, human_score));
            }
        }
    }
    
    // 4. 智能决策：根据威胁程度决定进攻还是防守
    let max_human_threat = human_threats.iter().map(|(_, _, score)| *score).max().unwrap_or(0);
    let max_ai_threat = ai_threats.iter().map(|(_, _, score)| *score).max().unwrap_or(0);
    
    // 决策逻辑：
    // - 如果对手有高威胁（活三、活四），必须防守
    // - 如果AI有高威胁且对手威胁较低，优先进攻
    // - 如果双方威胁相当，选择威胁最大的位置
    
    if max_human_threat > 5000 {
        // 对手有高威胁，必须防守
        let best_defense = human_threats.iter()
            .max_by_key(|(_, _, score)| *score)
            .unwrap();
        return Some(MoveResult {
            row: best_defense.0,
            col: best_defense.1,
            score: best_defense.2,
        });
    } else if max_ai_threat > 1000 && max_ai_threat > max_human_threat {
        // AI有优势，优先进攻
        let best_attack = ai_threats.iter()
            .max_by_key(|(_, _, score)| *score)
            .unwrap();
        return Some(MoveResult {
            row: best_attack.0,
            col: best_attack.1,
            score: best_attack.2,
        });
    } else {
        // 双方威胁相当，选择综合评分最高的位置
        let mut best_move = None;
        let mut best_score = LOSE_SCORE;
        
        for i in 0..ai_threats.len() {
            let ai_score = ai_threats[i].2;
            let human_score = human_threats[i].2;
            let combined_score = ai_score - human_score; // 进攻分数减去防守分数
            
            if combined_score > best_score {
                best_score = combined_score;
                best_move = Some(MoveResult {
                    row: ai_threats[i].0,
                    col: ai_threats[i].1,
                    score: combined_score,
                });
            }
        }
        
        if let Some(move_result) = best_move {
            return Some(move_result);
        }
    }
    
    
    // 使用简化的AI算法
    let moves = get_possible_moves(board);
    
    if moves.is_empty() {
        return None;
    }
    
    // 根据难度等级调整搜索的移动数量
    let max_moves = difficulty.get_max_moves();
    let search_moves = if moves.len() > max_moves {
        &moves[..max_moves]
    } else {
        &moves
    };
    
    // 简单评估所有候选位置
    let mut best_move = None;
    let mut best_score = LOSE_SCORE;
    
    for &(row, col) in search_moves {
        let mut test_board = board.clone();
        test_board[row][col] = ai_player;
        let mut score = evaluate_board(&test_board, ai_player);
        
        // 如果是中高级难度，进行简单的1层搜索
        if difficulty != AIDifficulty::Easy {
            score = simple_minimax(&test_board, difficulty.get_max_depth(), ai_player, human_player);
        }
        
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

// 简化的Minimax算法（快速版）
fn simple_minimax(board: &Vec<Vec<i32>>, depth: i32, ai_player: i32, human_player: i32) -> i32 {
    if depth == 0 {
        return evaluate_board(board, ai_player);
    }
    
    let moves = get_possible_moves(board);
    if moves.is_empty() {
        return evaluate_board(board, ai_player);
    }
    
    // 只搜索前3个最佳位置
    let search_moves = if moves.len() > 3 {
        &moves[..3]
    } else {
        &moves
    };
    
    let mut best_score = LOSE_SCORE;
    
    for &(row, col) in search_moves {
        let mut test_board = board.clone();
        test_board[row][col] = human_player; // 对手的回合
        
        // 快速获胜检查
        if check_win(&test_board, row, col) {
            return LOSE_SCORE; // 对手获胜
        }
        
        let score = -simple_minimax(&test_board, depth - 1, ai_player, human_player);
        best_score = best_score.max(score);
    }
    
    best_score
}

// 计算棋盘上的棋子数量
fn count_moves(board: &Vec<Vec<i32>>) -> usize {
    let mut count = 0;
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] != 0 {
                count += 1;
            }
        }
    }
    count
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