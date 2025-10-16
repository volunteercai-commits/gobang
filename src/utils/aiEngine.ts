import { PieceValue, Position, PieceColor, Direction, ThreatType } from '../types';
import { 
  isValidPosition, 
  isFirstMove, 
  getMoveCount, 
  checkWin, 
  isCornerOrEdge, 
  getCenterNearMove 
} from './gameLogic';

// 高级AI引擎 - 基于Minimax + Alpha-Beta剪枝
export class AdvancedAIEngine {
  private static readonly WIN_SCORE = 100000;
  private static readonly LOSE_SCORE = -100000;
  private static readonly MAX_DEPTH = 4;
  private static readonly SEARCH_RADIUS = 2;
  
  // 开局库 - 前几步的固定走法
  private static readonly OPENING_BOOK = new Map<string, Position[]>([
    // 天元开局
    ['7,7', [{ row: 6, col: 6 }, { row: 8, col: 8 }, { row: 6, col: 8 }, { row: 8, col: 6 }]],
    // 边角开局
    ['0,0', [{ row: 7, col: 7 }, { row: 6, col: 6 }, { row: 8, col: 8 }]],
    ['0,14', [{ row: 7, col: 7 }, { row: 6, col: 8 }, { row: 8, col: 6 }]],
    ['14,0', [{ row: 7, col: 7 }, { row: 8, col: 6 }, { row: 6, col: 8 }]],
    ['14,14', [{ row: 7, col: 7 }, { row: 8, col: 8 }, { row: 6, col: 6 }]]
  ]);

  // 威胁级别评估函数
  static getThreatLevel(board: PieceValue[][], row: number, col: number, player: PieceValue): number {
    let maxThreat = 0;
    const directions: Direction[] = [
      { dx: 0, dy: 1 },   // 横向
      { dx: 1, dy: 0 },   // 纵向
      { dx: 1, dy: 1 },   // 主对角线
      { dx: 1, dy: -1 }   // 副对角线
    ];

    for (const dir of directions) {
      let count = 1;
      
      // 检查正方向
      for (let i = 1; i < 5; i++) {
        const newRow = row + dir.dx * i;
        const newCol = col + dir.dy * i;
        if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== player) {
          break;
        }
        count++;
      }

      // 检查反方向
      for (let i = 1; i < 5; i++) {
        const newRow = row - dir.dx * i;
        const newCol = col - dir.dy * i;
        if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== player) {
          break;
        }
        count++;
      }

      maxThreat = Math.max(maxThreat, count);
    }

    return maxThreat;
  }

  // 评估特定方向的威胁
  static evaluateDirection(board: PieceValue[][], row: number, col: number, dir: Direction, player: PieceValue): number {
    let score = 0;
    let consecutive = 1;
    let blocked = 0;

    // 检查正方向
    for (let i = 1; i < 5; i++) {
      const newRow = row + dir.dx * i;
      const newCol = col + dir.dy * i;
      
      if (!isValidPosition(newRow, newCol)) {
        blocked++;
        break;
      }
      
      if (board[newRow][newCol] === player) {
        consecutive++;
      } else if (board[newRow][newCol] === 0) {
        break;
      } else {
        blocked++;
        break;
      }
    }

    // 检查反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - dir.dx * i;
      const newCol = col - dir.dy * i;
      
      if (!isValidPosition(newRow, newCol)) {
        blocked++;
        break;
      }
      
      if (board[newRow][newCol] === player) {
        consecutive++;
      } else if (board[newRow][newCol] === 0) {
        break;
      } else {
        blocked++;
        break;
      }
    }

    // 根据连子数和阻挡情况评分
    if (consecutive >= 5) score += 10000;
    else if (consecutive === 4 && blocked === 0) score += 1000; // 活四
    else if (consecutive === 4 && blocked === 1) score += 100;  // 冲四
    else if (consecutive === 3 && blocked === 0) score += 100;  // 活三
    else if (consecutive === 3 && blocked === 1) score += 10;   // 眠三
    else if (consecutive === 2 && blocked === 0) score += 10;   // 活二
    else if (consecutive === 2 && blocked === 1) score += 1;    // 眠二

    return score;
  }

  // 检查是否有双四威胁（44）
  static hasDoubleFour(board: PieceValue[][], row: number, col: number, player: PieceValue): boolean {
    let fourCount = 0;
    const directions: Direction[] = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
    ];
    
    for (const dir of directions) {
      if (this.evaluateDirection(board, row, col, dir, player) >= 1000) { // 活四
        fourCount++;
      }
    }
    
    return fourCount >= 2;
  }

  // 检查是否有四三威胁（43）
  static hasFourThree(board: PieceValue[][], row: number, col: number, player: PieceValue): boolean {
    let fourCount = 0;
    let threeCount = 0;
    const directions: Direction[] = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
    ];
    
    for (const dir of directions) {
      const score = this.evaluateDirection(board, row, col, dir, player);
      if (score >= 1000) { // 活四
        fourCount++;
      } else if (score >= 100) { // 活三
        threeCount++;
      }
    }
    
    return fourCount >= 1 && threeCount >= 1;
  }

  // 检查是否有活三
  static hasLiveThree(board: PieceValue[][], row: number, col: number, player: PieceValue): boolean {
    const directions: Direction[] = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
    ];
    
    for (const dir of directions) {
      if (this.evaluateDirection(board, row, col, dir, player) >= 100) { // 活三
        return true;
      }
    }
    
    return false;
  }

  // 检查是否有双三威胁（33）
  static hasDoubleThree(board: PieceValue[][], row: number, col: number, player: PieceValue): boolean {
    let threeCount = 0;
    const directions: Direction[] = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
    ];
    
    for (const dir of directions) {
      if (this.evaluateDirection(board, row, col, dir, player) >= 100) { // 活三
        threeCount++;
      }
    }
    
    return threeCount >= 2;
  }

  // 评估位置价值
  static evaluatePosition(board: PieceValue[][], row: number, col: number, player: PieceValue): number {
    let score = 0;
    const directions: Direction[] = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
    ];
    
    for (const dir of directions) {
      score += this.evaluateDirection(board, row, col, dir, player);
    }
    
    return score;
  }

  // 获取所有可能的移动位置
  static getPossibleMoves(board: PieceValue[][], centerRow: number = 7, centerCol: number = 7): Position[] {
    const moves: Position[] = [];
    const radius = this.SEARCH_RADIUS;
    
    for (let row = Math.max(0, centerRow - radius); row <= Math.min(14, centerRow + radius); row++) {
      for (let col = Math.max(0, centerCol - radius); col <= Math.min(14, centerCol + radius); col++) {
        if (board[row][col] === 0) {
          // 检查周围是否有棋子
          let hasNeighbor = false;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (isValidPosition(newRow, newCol) && board[newRow][newCol] !== 0) {
                hasNeighbor = true;
                break;
              }
            }
            if (hasNeighbor) break;
          }
          if (hasNeighbor) {
            moves.push({ row, col });
          }
        }
      }
    }
    
    return moves;
  }

  // 评估棋盘状态
  static evaluateBoard(board: PieceValue[][], player: PieceValue): number {
    let score = 0;
    
    // 遍历所有位置，评估每个位置的威胁
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] === player) {
          score += this.evaluatePosition(board, row, col, player);
        } else if (board[row][col] === (-player as PieceValue)) {
          score -= this.evaluatePosition(board, row, col, (-player as PieceValue));
        }
      }
    }
    
    return score;
  }

  // Minimax算法配合Alpha-Beta剪枝
  static minimax(
    board: PieceValue[][], 
    depth: number, 
    alpha: number, 
    beta: number, 
    isMaximizing: boolean, 
    player: PieceValue,
    opponent: PieceValue
  ): number {
    // 检查游戏结束条件
    if (depth === 0) {
      return this.evaluateBoard(board, player);
    }

    // 检查是否有获胜
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] === 0) {
          board[row][col] = isMaximizing ? player : opponent;
          if (checkWin(board, row, col)) {
            board[row][col] = 0;
            return isMaximizing ? this.WIN_SCORE : this.LOSE_SCORE;
          }
          board[row][col] = 0;
        }
      }
    }

    const moves = this.getPossibleMoves(board);
    if (moves.length === 0) {
      return this.evaluateBoard(board, player);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        board[move.row][move.col] = player;
        const evaluation = this.minimax(board, depth - 1, alpha, beta, false, player, opponent);
        board[move.row][move.col] = 0;
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha-Beta剪枝
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        board[move.row][move.col] = opponent;
        const evaluation = this.minimax(board, depth - 1, alpha, beta, true, player, opponent);
        board[move.row][move.col] = 0;
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Alpha-Beta剪枝
      }
      return minEval;
    }
  }

  // 检查威胁级别 - 新增威胁检测函数
  static checkThreatLevel(board: PieceValue[][], row: number, col: number, player: PieceValue): number {
    const directions: Direction[] = [
      { dx: 0, dy: 1 },   // 横向
      { dx: 1, dy: 0 },   // 纵向
      { dx: 1, dy: 1 },   // 主对角线
      { dx: 1, dy: -1 }   // 副对角线
    ];

    let maxThreat = 0;
    for (const dir of directions) {
      let count = 1;
      let blocked = 0;
      
      // 检查正方向
      for (let i = 1; i < 5; i++) {
        const newRow = row + dir.dx * i;
        const newCol = col + dir.dy * i;
        if (!isValidPosition(newRow, newCol)) {
          blocked++;
          break;
        }
        if (board[newRow][newCol] === player) {
          count++;
        } else if (board[newRow][newCol] === 0) {
          break;
        } else {
          blocked++;
          break;
        }
      }

      // 检查反方向
      for (let i = 1; i < 5; i++) {
        const newRow = row - dir.dx * i;
        const newCol = col - dir.dy * i;
        if (!isValidPosition(newRow, newCol)) {
          blocked++;
          break;
        }
        if (board[newRow][newCol] === player) {
          count++;
        } else if (board[newRow][newCol] === 0) {
          break;
        } else {
          blocked++;
          break;
        }
      }

      // 威胁评分：连子数越多，威胁越大
      if (count >= 5) maxThreat = Math.max(maxThreat, 10000); // 五连
      else if (count === 4 && blocked === 0) maxThreat = Math.max(maxThreat, 5000); // 活四
      else if (count === 4 && blocked === 1) maxThreat = Math.max(maxThreat, 1000); // 冲四
      else if (count === 3 && blocked === 0) maxThreat = Math.max(maxThreat, 500);  // 活三
      else if (count === 3 && blocked === 1) maxThreat = Math.max(maxThreat, 100);  // 眠三
      else if (count === 2 && blocked === 0) maxThreat = Math.max(maxThreat, 50);   // 活二
    }

    return maxThreat;
  }

  // 获取所有威胁位置
  static getThreatPositions(board: PieceValue[][], player: PieceValue): Position[] {
    const threats: Position[] = [];
    
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] === 0) {
          const threatLevel = this.checkThreatLevel(board, row, col, player);
          if (threatLevel >= 100) { // 只考虑活三以上的威胁
            threats.push({ row, col, threatLevel } as Position & { threatLevel: number });
          }
        }
      }
    }
    
    // 按威胁级别排序
    return threats.sort((a, b) => (b as any).threatLevel - (a as any).threatLevel);
  }

  // 获取最佳移动
  static getBestMove(board: PieceValue[][], aiPlayer: PieceValue, humanPlayer: PieceValue): Position | null {
    // 检查开局库
    const moveCount = getMoveCount(board);
    if (moveCount <= 4) {
      const openingMove = this.getOpeningMove(board, aiPlayer, humanPlayer);
      if (openingMove) {
        return openingMove;
      }
    }

    // 1. 优先检查AI立即获胜
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] === 0) {
          board[row][col] = aiPlayer;
          if (checkWin(board, row, col)) {
            board[row][col] = 0;
            return { row, col };
          }
          board[row][col] = 0;
        }
      }
    }

    // 2. 优先检查阻止对手立即获胜
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] === 0) {
          board[row][col] = humanPlayer;
          if (checkWin(board, row, col)) {
            board[row][col] = 0;
            return { row, col };
          }
          board[row][col] = 0;
        }
      }
    }

    // 3. 优势权衡：评估攻击和防守的优先级
    const aiThreats = this.getThreatPositions(board, aiPlayer);
    const humanThreats = this.getThreatPositions(board, humanPlayer);
    
    // 计算双方威胁强度
    const aiThreatStrength = this.calculateThreatStrength(aiThreats);
    const humanThreatStrength = this.calculateThreatStrength(humanThreats);
    
    // 计算当前局面优势
    const currentAdvantage = this.calculateCurrentAdvantage(board, aiPlayer, humanPlayer);
    
    // 决策逻辑：权衡攻击和防守
    const shouldAttack = this.shouldPrioritizeAttack(aiThreatStrength, humanThreatStrength, currentAdvantage);
    
    // 只在开发环境下输出调试日志
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 AI决策分析:', {
        aiThreats: aiThreats.length,
        humanThreats: humanThreats.length,
        aiThreatStrength,
        humanThreatStrength,
        currentAdvantage,
        shouldAttack
      });
    }
    
    if (shouldAttack && aiThreats.length > 0) {
      // 优先进攻：我方威胁大于敌方威胁，或者我方有明显优势
      if (process.env.NODE_ENV === 'development') {
        console.log('⚔️ 选择进攻策略');
      }
      return aiThreats[0];
    } else if (humanThreats.length > 0) {
      // 优先防守：敌方威胁较大，或者我方优势不明显
      if (process.env.NODE_ENV === 'development') {
        console.log('🛡️ 选择防守策略');
      }
      return humanThreats[0];
    }

    // 4. 使用Minimax算法进行深度搜索
    const moves = this.getPossibleMoves(board);
    let bestMove: Position | null = null;
    let bestScore = -Infinity;

    for (const move of moves) {
      board[move.row][move.col] = aiPlayer;
      const score = this.minimax(board, this.MAX_DEPTH, -Infinity, Infinity, false, aiPlayer, humanPlayer);
      board[move.row][move.col] = 0;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // 计算威胁强度
  private static calculateThreatStrength(threats: Position[]): number {
    if (threats.length === 0) return 0;
    
    let totalStrength = 0;
    for (const threat of threats) {
      // 根据威胁级别计算强度
      const threatLevel = (threat as any).threatLevel || 0;
      totalStrength += threatLevel;
    }
    
    return totalStrength;
  }

  // 计算当前局面优势
  private static calculateCurrentAdvantage(board: PieceValue[][], aiPlayer: PieceValue, humanPlayer: PieceValue): number {
    let aiScore = 0;
    let humanScore = 0;
    
    // 评估每个位置的威胁
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] === aiPlayer) {
          aiScore += this.evaluatePosition(board, row, col, aiPlayer);
        } else if (board[row][col] === humanPlayer) {
          humanScore += this.evaluatePosition(board, row, col, humanPlayer);
        }
      }
    }
    
    return aiScore - humanScore;
  }

  // 判断是否应该优先进攻
  private static shouldPrioritizeAttack(aiThreatStrength: number, humanThreatStrength: number, currentAdvantage: number): boolean {
    // 如果我方威胁明显大于敌方威胁，优先进攻
    if (aiThreatStrength > humanThreatStrength * 1.5) {
      return true;
    }
    
    // 如果我方有明显优势（分数差大于1000），优先进攻
    if (currentAdvantage > 1000) {
      return true;
    }
    
    // 如果敌方威胁很小（小于500），优先进攻
    if (humanThreatStrength < 500) {
      return true;
    }
    
    // 如果双方威胁相当，但我方优势大于500，优先进攻
    if (Math.abs(aiThreatStrength - humanThreatStrength) < 200 && currentAdvantage > 500) {
      return true;
    }
    
    // 其他情况优先防守
    return false;
  }

  // 获取开局移动
  private static getOpeningMove(board: PieceValue[][], aiPlayer: PieceValue, humanPlayer: PieceValue): Position | null {
    const moveCount = getMoveCount(board);
    
    if (moveCount === 0) {
      return { row: 7, col: 7 }; // 天元
    }
    
    if (moveCount === 1) {
      // 找到对手的第一步
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (board[row][col] === humanPlayer) {
            const key = `${row},${col}`;
            const responses = this.OPENING_BOOK.get(key);
            if (responses && responses.length > 0) {
              return responses[0];
            }
          }
        }
      }
    }
    
    return null;
  }
}

// 为了保持向后兼容，导出原有的函数
export const getThreatLevel = AdvancedAIEngine.getThreatLevel;
export const evaluateDirection = AdvancedAIEngine.evaluateDirection;
export const hasDoubleFour = AdvancedAIEngine.hasDoubleFour;
export const hasFourThree = AdvancedAIEngine.hasFourThree;
export const hasLiveThree = AdvancedAIEngine.hasLiveThree;
export const hasDoubleThree = AdvancedAIEngine.hasDoubleThree;
export const evaluatePosition = AdvancedAIEngine.evaluatePosition;
