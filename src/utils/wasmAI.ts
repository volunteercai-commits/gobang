import { PieceValue, Position } from '../types';

// WASM AI引擎 - 使用共享核心的Rust代码
export class WasmAIEngine {
  private wasmModule: any = null;
  private isInitialized = false;

  constructor() {
    this.initWasm();
  }

  // 初始化WASM模块
  private async initWasm() {
    try {
      // 动态导入WASM模块
      const wasmModule = await import('../wasm/wasm_lib.js');
      await wasmModule.default(); // 初始化WASM模块
      this.wasmModule = wasmModule;
      this.isInitialized = true;
      console.log('✅ WASM AI引擎初始化成功');
    } catch (error) {
      console.error('❌ WASM AI引擎初始化失败:', error);
      this.isInitialized = false;
    }
  }

  // 等待WASM模块初始化
  private async waitForInit(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 将二维数组转换为一维数组（WASM需要）
  private flattenBoard(board: PieceValue[][]): number[] {
    const flattened: number[] = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        flattened.push(board[row][col]);
      }
    }
    return flattened;
  }

  // 将一维数组转换为二维数组
  private unflattenBoard(flattened: number[]): PieceValue[][] {
    const board: PieceValue[][] = [];
    for (let row = 0; row < 15; row++) {
      board[row] = [];
      for (let col = 0; col < 15; col++) {
        board[row][col] = flattened[row * 15 + col] as PieceValue;
      }
    }
    return board;
  }

  // 获取最佳移动
  public async getBestMove(
    board: PieceValue[][], 
    aiPlayer: PieceValue, 
    humanPlayer: PieceValue
  ): Promise<Position | null> {
    await this.waitForInit();
    
    if (!this.wasmModule) {
      console.error('WASM模块未初始化');
      return null;
    }

    try {
      const flattenedBoard = this.flattenBoard(board);
      const result = this.wasmModule.get_best_move_wasm(flattenedBoard, aiPlayer, humanPlayer);
      
      if (result) {
        return { row: result.row, col: result.col };
      }
      return null;
    } catch (error) {
      console.error('WASM AI移动计算失败:', error);
      return null;
    }
  }

  // 检查获胜状态
  public async checkWin(board: PieceValue[][], row: number, col: number): Promise<boolean> {
    await this.waitForInit();
    
    if (!this.wasmModule) {
      return false;
    }

    try {
      const flattenedBoard = this.flattenBoard(board);
      return this.wasmModule.check_win_wasm(flattenedBoard, row, col);
    } catch (error) {
      console.error('WASM获胜检查失败:', error);
      return false;
    }
  }

  // 评估棋盘状态
  public async evaluateBoard(board: PieceValue[][], player: PieceValue): Promise<number> {
    await this.waitForInit();
    
    if (!this.wasmModule) {
      return 0;
    }

    try {
      const flattenedBoard = this.flattenBoard(board);
      return this.wasmModule.evaluate_board_wasm(flattenedBoard, player);
    } catch (error) {
      console.error('WASM棋盘评估失败:', error);
      return 0;
    }
  }

  // 获取可能的移动位置
  public async getPossibleMoves(board: PieceValue[][]): Promise<Position[]> {
    await this.waitForInit();
    
    if (!this.wasmModule) {
      return [];
    }

    try {
      const flattenedBoard = this.flattenBoard(board);
      const moves = this.wasmModule.get_possible_moves_wasm(flattenedBoard);
      return moves.map((move: any) => ({ row: move[0], col: move[1] }));
    } catch (error) {
      console.error('WASM获取可能移动失败:', error);
      return [];
    }
  }

  // 检查是否已初始化
  public isReady(): boolean {
    return this.isInitialized;
  }
}

// 创建全局WASM AI引擎实例
export const wasmAIEngine = new WasmAIEngine();
