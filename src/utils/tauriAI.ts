import { invoke } from '@tauri-apps/api/core';
import { AIDifficulty } from '../types';

// Tauri AI引擎接口
export class TauriAIEngine {
  // 调用Rust AI引擎获取最佳移动
  static async getBestMove(board: number[][], aiPlayer: number, humanPlayer: number, difficulty: AIDifficulty = 'hard'): Promise<{row: number, col: number} | null> {
    try {
      const result = await invoke<{row: number, col: number}>('ai_move', {
        board: board,
        aiPlayer: aiPlayer,
        humanPlayer: humanPlayer,
        difficulty: difficulty
      });
      return result;
    } catch (error) {
      console.error('Tauri AI调用失败:', error);
      return null;
    }
  }

  // 检查是否获胜
  static async checkWin(board: number[][], row: number, col: number): Promise<boolean> {
    try {
      const result = await invoke<boolean>('check_win', {
        board: board,
        row: row,
        col: col
      });
      return result;
    } catch (error) {
      console.error('Tauri checkWin调用失败:', error);
      return false;
    }
  }

  // 评估棋盘状态
  static async evaluateBoard(board: number[][], player: number): Promise<number> {
    try {
      const result = await invoke<number>('evaluate_board', {
        board: board,
        player: player
      });
      return result;
    } catch (error) {
      console.error('Tauri evaluateBoard调用失败:', error);
      return 0;
    }
  }
}

// 检测是否在Tauri环境中
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
}
