import { PieceValue, Position, PieceColor, Direction, ThreatType } from '../types';

// 棋盘大小
export const BOARD_SIZE = 15;

// 初始化棋盘
export const initializeBoard = (): PieceValue[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
};

// 检查位置是否有效
export const isValidPosition = (row: number, col: number): boolean => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

// 检查是否是第一步
export const isFirstMove = (board: PieceValue[][]): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== 0) {
        return false;
      }
    }
  }
  return true;
};

// 获取当前步数
export const getMoveCount = (board: PieceValue[][]): number => {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== 0) {
        count++;
      }
    }
  }
  return count;
};

// 检查是否有五连子
export const checkWin = (board: PieceValue[][], row: number, col: number): boolean => {
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

      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== board[row][col]) {
        break;
      }
      count++;
    }

    // 检查反方向
    for (let i = 1; i < 5; i++) {
      const newRow = row - dir.dx * i;
      const newCol = col - dir.dy * i;

      if (!isValidPosition(newRow, newCol) || board[newRow][newCol] !== board[row][col]) {
        break;
      }
      count++;
    }

    if (count >= 5) {
      return true;
    }
  }

  return false;
};

// 判断是否在边角位置
export const isCornerOrEdge = (row: number, col: number): boolean => {
  const distance = Math.abs(row - 7) + Math.abs(col - 7);
  return distance >= 6;
};

// 获取中心附近的走法
export const getCenterNearMove = (centerRow: number, centerCol: number, board: PieceValue[][]): Position | null => {
  const directions = [
    { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
    { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
    { dr: 1, dc: 1 }, { dr: -1, dc: -1 },
    { dr: 1, dc: -1 }, { dr: -1, dc: 1 }
  ];
  
  for (const dir of directions) {
    const newRow = centerRow + dir.dr;
    const newCol = centerCol + dir.dc;
    if (isValidPosition(newRow, newCol) && board[newRow][newCol] === 0) {
      return { row: newRow, col: newCol };
    }
  }
  return null;
};
