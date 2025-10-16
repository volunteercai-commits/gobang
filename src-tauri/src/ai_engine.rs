// AI引擎 - Rust实现
// 高性能的五子棋AI算法

const BOARD_SIZE: usize = 15;
const WIN_LENGTH: usize = 5;
const MAX_DEPTH: i32 = 4;
const WIN_SCORE: i32 = 100000;
const LOSE_SCORE: i32 = -100000;

// 方向向量
const DIRECTIONS: [(i32, i32); 4] = [
    (0, 1),   // 横向
    (1, 0),   // 纵向
    (1, 1),   // 主对角线
    (1, -1),  // 副对角线
];

// 检查位置是否有效
fn is_valid_position(row: i32, col: i32) -> bool {
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

// 获取可能的移动位置
fn get_possible_moves(board: &Vec<Vec<i32>>) -> Vec<(usize, usize)> {
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
    
    // 为每个已有棋子周围的空位添加候选位置
    let mut candidate_positions = std::collections::HashSet::new();
    
    for (piece_row, piece_col) in piece_positions {
        for dr in -2..=2 {
            for dc in -2..=2 {
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

// Minimax算法
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
    
    // 检查获胜
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] == 0 {
                board[row][col] = if is_maximizing { player } else { opponent };
                if check_win(board, row, col) {
                    board[row][col] = 0;
                    return if is_maximizing { WIN_SCORE } else { LOSE_SCORE };
                }
                board[row][col] = 0;
            }
        }
    }
    
    let moves = get_possible_moves(board);
    if moves.is_empty() {
        return evaluate_board(board, player);
    }
    
    if is_maximizing {
        let mut max_eval = LOSE_SCORE;
        let mut alpha = alpha;
        for (row, col) in moves {
            board[row][col] = player;
            let eval = minimax(board, depth - 1, alpha, beta, false, player, opponent);
            board[row][col] = 0;
            max_eval = max_eval.max(eval);
            alpha = alpha.max(eval);
            if beta <= alpha {
                break;
            }
        }
        max_eval
    } else {
        let mut min_eval = WIN_SCORE;
        let mut beta = beta;
        for (row, col) in moves {
            board[row][col] = opponent;
            let eval = minimax(board, depth - 1, alpha, beta, true, player, opponent);
            board[row][col] = 0;
            min_eval = min_eval.min(eval);
            beta = beta.min(eval);
            if beta <= alpha {
                break;
            }
        }
        min_eval
    }
}

// 获取最佳移动
pub fn get_best_move(board: &Vec<Vec<i32>>, ai_player: i32, human_player: i32) -> Option<(usize, usize)> {
    println!("🤖 Rust AI开始思考... ai_player: {}, human_player: {}", ai_player, human_player);
    
    // 检查AI立即获胜
    for row in 0..BOARD_SIZE {
        for col in 0..BOARD_SIZE {
            if board[row][col] == 0 {
                let mut test_board = board.clone();
                test_board[row][col] = ai_player;
                if check_win(&test_board, row, col) {
                    println!("🎯 AI立即获胜: ({}, {})", row, col);
                    return Some((row, col));
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
                    println!("🛡️ 阻止对手获胜: ({}, {})", row, col);
                    return Some((row, col));
                }
            }
        }
    }
    
    // 使用Minimax算法
    let moves = get_possible_moves(board);
    println!("📋 候选移动数量: {}", moves.len());
    
    if moves.is_empty() {
        println!("⚠️ 没有可用移动");
        return None;
    }
    
    let mut best_move = None;
    let mut best_score = LOSE_SCORE;
    
    for (row, col) in moves {
        let mut test_board = board.clone();
        test_board[row][col] = ai_player;
        let score = minimax(&mut test_board, MAX_DEPTH, LOSE_SCORE, WIN_SCORE, false, ai_player, human_player);
        
        println!("📍 位置 ({}, {}) 得分: {}", row, col, score);
        
        if score > best_score {
            best_score = score;
            best_move = Some((row, col));
        }
    }
    
    if let Some((row, col)) = best_move {
        println!("✅ 最佳移动: ({}, {}) 得分: {}", row, col, best_score);
    }
    
    best_move
}
