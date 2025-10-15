import { PieceValue, Position, PieceColor } from '../types';
import { 
  isValidPosition, 
  isFirstMove, 
  getMoveCount, 
  checkWin, 
  isCornerOrEdge, 
  getCenterNearMove 
} from './gameLogic';
import {
  hasDoubleFour,
  hasFourThree,
  hasLiveThree,
  hasDoubleThree,
  calculateDefenseValue,
  calculateColorBasedScore,
  evaluatePosition
} from './aiEngine';

// AI决策引擎
export class AIDecisionEngine {
  private board: PieceValue[][];
  private aiPlayer: PieceValue;
  private humanPlayer: PieceValue;
  private maxTime: number;

  constructor(board: PieceValue[][], aiPlayer: PieceValue, humanPlayer: PieceValue, maxTime: number = 2000) {
    this.board = board;
    this.aiPlayer = aiPlayer;
    this.humanPlayer = humanPlayer;
    this.maxTime = maxTime;
  }

  // 获取AI的最佳移动
  public getBestMove(): Position | null {
    const startTime = Date.now();
    
    // 检查超时
    const isTimeout = () => Date.now() - startTime > this.maxTime;

    // 0. 优化开局策略
    if (isFirstMove(this.board)) {
      return { row: 7, col: 7 }; // 天元 H8
    }
    
    // 开局模式识别和优化（前10步）
    const moveCount = getMoveCount(this.board);
    if (moveCount <= 10) {
      const openingMove = this.getOpeningMove(moveCount);
      if (openingMove) {
        return openingMove;
      }
    }

    // 1. 首先检查是否能获胜（最高优先级）
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.aiPlayer;
          if (checkWin(this.board, row, col)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 2. 检查是否需要阻止玩家获胜（第二优先级）
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.humanPlayer;
          if (checkWin(this.board, row, col)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 3. 检查是否需要阻止玩家形成活三（最高优先级防守！）
    let bestDefenseMove: Position | null = null;
    let bestDefenseScore = -1;
    
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.humanPlayer;
          if (hasLiveThree(this.board, row, col, this.humanPlayer)) {
            this.board[row][col] = 0;
            // 计算这个防守点的价值（既要防守又要对自己有利）
            const defenseScore = calculateDefenseValue(this.board, row, col, this.aiPlayer, this.humanPlayer);
            if (defenseScore > bestDefenseScore) {
              bestDefenseScore = defenseScore;
              bestDefenseMove = { row, col };
            }
          }
          this.board[row][col] = 0;
        }
      }
    }
    
    if (bestDefenseMove) {
      return bestDefenseMove;
    }

    // 4. 检查AI是否能形成44威胁（双四）
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.aiPlayer;
          if (hasDoubleFour(this.board, row, col, this.aiPlayer)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 5. 检查是否需要阻止玩家形成44威胁
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.humanPlayer;
          if (hasDoubleFour(this.board, row, col, this.humanPlayer)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 6. 检查AI是否能形成43威胁（四三）
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.aiPlayer;
          if (hasFourThree(this.board, row, col, this.aiPlayer)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 7. 检查是否需要阻止玩家形成43威胁
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.humanPlayer;
          if (hasFourThree(this.board, row, col, this.humanPlayer)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 8. 检查AI是否能形成活三
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.aiPlayer;
          if (hasLiveThree(this.board, row, col, this.aiPlayer)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 9. 检查AI是否能形成33威胁（双三）
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.aiPlayer;
          if (hasDoubleThree(this.board, row, col, this.aiPlayer)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 10. 检查是否需要阻止玩家形成33威胁
    for (let row = 0; row < 15; row++) {
      if (isTimeout()) break;
      for (let col = 0; col < 15; col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          this.board[row][col] = this.humanPlayer;
          if (hasDoubleThree(this.board, row, col, this.humanPlayer)) {
            this.board[row][col] = 0;
            return { row, col };
          }
          this.board[row][col] = 0;
        }
      }
    }

    // 11. 使用评分系统选择最佳位置
    const isAIBlack = this.aiPlayer === 1; // AI执黑
    const searchRadius = isAIBlack ? 4 : 3; // 执黑时扩大搜索范围
    const centerRow = 7;
    const centerCol = 7;
    
    let bestPosition: Position | null = null;
    let maxScore = -Infinity;
    
    for (let row = Math.max(0, centerRow - searchRadius); row <= Math.min(14, centerRow + searchRadius); row++) {
      if (isTimeout()) break;
      for (let col = Math.max(0, centerCol - searchRadius); col <= Math.min(14, centerCol + searchRadius); col++) {
        if (isTimeout()) break;
        if (this.board[row][col] === 0) {
          const score = calculateColorBasedScore(this.board, row, col, this.aiPlayer, this.humanPlayer, isAIBlack);
          if (score > maxScore || !bestPosition) {
            maxScore = score;
            bestPosition = { row, col };
          }
        }
      }
    }
    
    // 如果中心区域没找到好位置，随机选择一个空位
    if (!bestPosition) {
      const emptyPositions: Position[] = [];
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (this.board[row][col] === 0) {
            emptyPositions.push({ row, col });
          }
        }
      }
      if (emptyPositions.length > 0) {
        bestPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      }
    }

    return bestPosition;
  }

  // 开局模式识别和优化走法
  private getOpeningMove(moveCount: number): Position | null {
    // 获取所有已下棋子的位置
    const aiMoves: Position[] = [];
    const humanMoves: Position[] = [];
    
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (this.board[row][col] === this.aiPlayer) {
          aiMoves.push({ row, col });
        } else if (this.board[row][col] === this.humanPlayer) {
          humanMoves.push({ row, col });
        }
      }
    }
    
    // AI先手时的开局策略
    if (aiMoves.length === 1 && humanMoves.length === 1) {
      // 第二步：根据对手的回应选择策略
      const aiFirst = aiMoves[0];
      const humanFirst = humanMoves[0];
      
      // 如果对手下在边角，AI选择中心附近
      if (isCornerOrEdge(humanFirst.row, humanFirst.col)) {
        return getCenterNearMove(aiFirst.row, aiFirst.col, this.board);
      }
      // 如果对手下在中心附近，AI选择形成攻击性布局
      else {
        return this.getAggressiveMove(aiFirst.row, aiFirst.col, humanFirst.row, humanFirst.col);
      }
    }
    
    // 第三步及以后：寻找最佳攻击位置
    if (moveCount >= 3) {
      return this.findBestOpeningPosition();
    }
    
    return null;
  }

  // 获取攻击性走法
  private getAggressiveMove(aiRow: number, aiCol: number, humanRow: number, humanCol: number): Position | null {
    // 优先选择能形成威胁的位置
    const candidates: { position: Position; score: number }[] = [];
    
    // 在AI棋子附近寻找好位置
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const newRow = aiRow + dr;
        const newCol = aiCol + dc;
        if (isValidPosition(newRow, newCol) && this.board[newRow][newCol] === 0) {
          const score = evaluatePosition(this.board, newRow, newCol, this.aiPlayer);
          if (score > 0) {
            candidates.push({ position: { row: newRow, col: newCol }, score });
          }
        }
      }
    }
    
    // 按评分排序，选择最佳位置
    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].position : null;
  }

  // 寻找最佳开局位置
  private findBestOpeningPosition(): Position | null {
    let bestScore = -1;
    let bestMove: Position | null = null;
    
    // 搜索中心区域
    for (let row = 5; row <= 9; row++) {
      for (let col = 5; col <= 9; col++) {
        if (this.board[row][col] === 0) {
          const score = evaluatePosition(this.board, row, col, this.aiPlayer);
          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }
    
    return bestMove;
  }
}
