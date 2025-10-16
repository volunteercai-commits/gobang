import { PieceValue, Position, PieceColor } from '../types';
import { 
  isValidPosition, 
  isFirstMove, 
  getMoveCount, 
  checkWin, 
  isCornerOrEdge, 
  getCenterNearMove 
} from './gameLogic';
import { TauriAIEngine, isTauriEnvironment } from './tauriAI';

// AI决策引擎 - 优先使用Rust AI引擎，回退到随机位置
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

  // 获取AI的最佳移动 - 优先使用Tauri AI引擎
  public async getBestMove(): Promise<Position | null> {
    const startTime = Date.now();
    
    // 检查超时
    const isTimeout = () => Date.now() - startTime > this.maxTime;

    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 AI决策开始 - 环境检测:', {
        isTauri: isTauriEnvironment(),
        aiPlayer: this.aiPlayer,
        humanPlayer: this.humanPlayer
      });
    }

    // 优先使用Tauri AI引擎（如果可用）
    if (isTauriEnvironment()) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 调用Tauri Rust AI引擎...');
        }
        
        const tauriMove = await TauriAIEngine.getBestMove(this.board, this.aiPlayer, this.humanPlayer);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Tauri AI返回结果:', tauriMove);
        }
        
        if (tauriMove && !isTimeout()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 使用Tauri Rust AI引擎成功');
          }
          return tauriMove;
        }
      } catch (error) {
        console.warn('❌ Tauri AI调用失败，回退到JavaScript AI:', error);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ 非Tauri环境，使用JavaScript AI');
      }
    }

    // 如果Tauri AI不可用，返回一个随机位置
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Tauri AI不可用，返回随机位置...');
    }
    
    const emptyPositions: Position[] = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (this.board[row][col] === 0) {
          emptyPositions.push({ row, col });
        }
      }
    }
    
    if (emptyPositions.length > 0) {
      const randomMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      if (process.env.NODE_ENV === 'development') {
        console.log('🎲 返回随机位置:', randomMove);
      }
      return randomMove;
    }

    return null;
  }
}
