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
import { wasmAIEngine } from './wasmAI';

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

  // 获取AI的最佳移动 - 严格按照环境选择Rust AI引擎
  public async getBestMove(): Promise<Position | null> {
    const startTime = Date.now();
    
    // 检查超时
    const isTimeout = () => Date.now() - startTime > this.maxTime;

    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 AI决策开始 - 环境检测:', {
        isTauri: isTauriEnvironment(),
        isWasmReady: wasmAIEngine.isReady(),
        aiPlayer: this.aiPlayer,
        humanPlayer: this.humanPlayer
      });
    }

    // 严格按环境选择：Tauri环境用Tauri调用Rust，Web环境用WASM调用Rust
    if (isTauriEnvironment()) {
      // 桌面应用：使用Tauri调用Rust AI引擎
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🖥️ 桌面应用 - 调用Tauri Rust AI引擎...');
        }
        
        const tauriMove = await TauriAIEngine.getBestMove(this.board, this.aiPlayer, this.humanPlayer);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🖥️ Tauri Rust AI返回结果:', tauriMove);
        }
        
        if (tauriMove && !isTimeout()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 桌面应用使用Tauri Rust AI成功');
          }
          return tauriMove;
        }
      } catch (error) {
        console.error('❌ 桌面应用Tauri Rust AI调用失败:', error);
        return null;
      }
    } else {
      // Web应用：使用WASM调用Rust AI引擎
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🌐 Web应用 - 调用WASM Rust AI引擎...');
        }
        
        // 等待WASM初始化
        if (!wasmAIEngine.isReady()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('⏳ 等待WASM Rust AI引擎初始化...');
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (wasmAIEngine.isReady()) {
          const wasmMove = await wasmAIEngine.getBestMove(this.board, this.aiPlayer, this.humanPlayer);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🌐 WASM Rust AI返回结果:', wasmMove);
          }
          
          if (wasmMove && !isTimeout()) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Web应用使用WASM Rust AI成功');
            }
            return wasmMove;
          }
        } else {
          console.warn('⚠️ WASM Rust AI引擎初始化超时');
        }
      } catch (error) {
        console.error('❌ Web应用WASM Rust AI调用失败:', error);
      }
    }
    
    // 如果所有AI都失败，返回null
    return null;
  }
}
