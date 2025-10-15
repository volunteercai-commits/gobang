import { PieceValue, Position, PieceColor } from '../types';
import { 
  isValidPosition, 
  isFirstMove, 
  getMoveCount, 
  checkWin, 
  isCornerOrEdge, 
  getCenterNearMove 
} from './gameLogic';
import { AdvancedAIEngine } from './aiEngine';

// AI决策引擎 - 使用高级AI引擎
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

  // 获取AI的最佳移动 - 使用新的高级AI引擎
  public getBestMove(): Position | null {
    const startTime = Date.now();
    
    // 检查超时
    const isTimeout = () => Date.now() - startTime > this.maxTime;

    // 使用新的高级AI引擎
    const bestMove = AdvancedAIEngine.getBestMove(this.board, this.aiPlayer, this.humanPlayer);
    
    // 如果超时，返回一个随机位置
    if (isTimeout()) {
      const emptyPositions: Position[] = [];
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          if (this.board[row][col] === 0) {
            emptyPositions.push({ row, col });
          }
        }
      }
      if (emptyPositions.length > 0) {
        return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      }
    }

    return bestMove;
  }
}
