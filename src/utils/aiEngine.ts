import { PieceValue, Position, PieceColor, Direction, ThreatType } from '../types';
import { 
  isValidPosition, 
  isFirstMove, 
  getMoveCount, 
  checkWin, 
  isCornerOrEdge, 
  getCenterNearMove 
} from './gameLogic';

// 威胁级别评估函数
export const getThreatLevel = (board: PieceValue[][], row: number, col: number, player: PieceValue): number => {
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
};

// 评估特定方向的威胁
export const evaluateDirection = (board: PieceValue[][], row: number, col: number, dir: Direction, player: PieceValue): number => {
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
};

// 检查是否有双四威胁（44）
export const hasDoubleFour = (board: PieceValue[][], row: number, col: number, player: PieceValue): boolean => {
  let fourCount = 0;
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];
  
  for (const dir of directions) {
    if (evaluateDirection(board, row, col, dir, player) >= 1000) { // 活四
      fourCount++;
    }
  }
  
  return fourCount >= 2;
};

// 检查是否有四三威胁（43）
export const hasFourThree = (board: PieceValue[][], row: number, col: number, player: PieceValue): boolean => {
  let fourCount = 0;
  let threeCount = 0;
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];
  
  for (const dir of directions) {
    const score = evaluateDirection(board, row, col, dir, player);
    if (score >= 1000) { // 活四
      fourCount++;
    } else if (score >= 100) { // 活三
      threeCount++;
    }
  }
  
  return fourCount >= 1 && threeCount >= 1;
};

// 检查是否有活三
export const hasLiveThree = (board: PieceValue[][], row: number, col: number, player: PieceValue): boolean => {
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];
  
  for (const dir of directions) {
    if (evaluateDirection(board, row, col, dir, player) >= 100) { // 活三
      return true;
    }
  }
  
  return false;
};

// 检查是否有双三威胁（33）
export const hasDoubleThree = (board: PieceValue[][], row: number, col: number, player: PieceValue): boolean => {
  let threeCount = 0;
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];
  
  for (const dir of directions) {
    if (evaluateDirection(board, row, col, dir, player) >= 100) { // 活三
      threeCount++;
    }
  }
  
  return threeCount >= 2;
};

// 计算防守点的价值
export const calculateDefenseValue = (
  board: PieceValue[][], 
  row: number, 
  col: number, 
  aiPlayer: PieceValue, 
  humanPlayer: PieceValue
): number => {
  let score = 0;
  
  // 1. 基础防守价值（必须防守）
  score += 1000;
  
  // 2. 检查这个位置对AI的攻击价值
  const aiAttackValue = evaluatePosition(board, row, col, aiPlayer);
  score += aiAttackValue * 0.5; // 攻击价值权重稍低
  
  // 3. 检查是否能形成自己的威胁
  if (hasLiveThree(board, row, col, aiPlayer)) {
    score += 500; // 能形成活三加分
  }
  if (hasDoubleThree(board, row, col, aiPlayer)) {
    score += 800; // 能形成双三加分
  }
  if (hasFourThree(board, row, col, aiPlayer)) {
    score += 1200; // 能形成四三加分
  }
  if (hasDoubleFour(board, row, col, aiPlayer)) {
    score += 2000; // 能形成双四加分
  }
  
  // 4. 位置优势：中心位置加分
  const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
  score += (14 - centerDistance) * 10;
  
  // 5. 检查是否在对手的威胁线上（更有效的防守）
  const humanThreatValue = evaluatePosition(board, row, col, humanPlayer);
  if (humanThreatValue > 0) {
    score += humanThreatValue * 0.3; // 在对手威胁线上加分
  }
  
  // 6. 检查是否能同时阻止多个威胁
  let blockedThreats = 0;
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];
  
  for (const dir of directions) {
    const humanScore = evaluateDirection(board, row, col, dir, humanPlayer);
    if (humanScore >= 100) { // 能阻止活三或以上
      blockedThreats++;
    }
  }
  score += blockedThreats * 200; // 阻止多个威胁加分
  
  return score;
};

// 评估位置价值
export const evaluatePosition = (board: PieceValue[][], row: number, col: number, player: PieceValue): number => {
  let score = 0;
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];
  
  for (const dir of directions) {
    score += evaluateDirection(board, row, col, dir, player);
  }
  
  return score;
};

// 基于颜色的智能评分函数
export const calculateColorBasedScore = (
  board: PieceValue[][], 
  row: number, 
  col: number, 
  aiPlayer: PieceValue, 
  humanPlayer: PieceValue, 
  isAIBlack: boolean
): number => {
  let score = 0;
  
  // 中心位置加分
  const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
  score += (14 - centerDistance) * 2;

  // 检查四个方向的威胁
  const directions: Direction[] = [
    { dx: 0, dy: 1 },   // 横向
    { dx: 1, dy: 0 },   // 纵向
    { dx: 1, dy: 1 },   // 主对角线
    { dx: 1, dy: -1 }   // 副对角线
  ];

  for (const dir of directions) {
    // AI的威胁评分
    const aiThreat = evaluateDirection(board, row, col, dir, aiPlayer);
    // 玩家的威胁评分
    const humanThreat = evaluateDirection(board, row, col, dir, humanPlayer);
    
    if (isAIBlack) {
      // 执黑以攻为首：更注重攻击性
      score += aiThreat * 20;  // 大幅提高AI攻击权重
      score += humanThreat * 5; // 降低防守权重
    } else {
      // 执白以守为攻：更注重防守反击
      score += aiThreat * 12;  // 适中的攻击权重
      score += humanThreat * 15; // 提高防守权重
    }
  }
  
  // 执黑时额外加分：优先选择能形成多个威胁的位置
  if (isAIBlack) {
    const multiThreatBonus = countMultiThreats(board, row, col, aiPlayer);
    score += multiThreatBonus * 30; // 执黑时更注重多威胁
  } else {
    // 执白时加分：优先选择能阻止对手威胁的位置
    const defenseBonus = countDefenseValue(board, row, col, humanPlayer);
    score += defenseBonus * 20;
  }

  return score;
};

// 计算多威胁位置加分
export const countMultiThreats = (board: PieceValue[][], row: number, col: number, player: PieceValue): number => {
  let threatCount = 0;
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];

  for (const dir of directions) {
    const threat = evaluateDirection(board, row, col, dir, player);
    if (threat >= 100) { // 活三或以上
      threatCount++;
    }
  }
  
  return threatCount;
};

// 计算防守价值（执白时使用）
export const countDefenseValue = (board: PieceValue[][], row: number, col: number, humanPlayer: PieceValue): number => {
  let defenseValue = 0;
  const directions: Direction[] = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];

  for (const dir of directions) {
    const threat = evaluateDirection(board, row, col, dir, humanPlayer);
    if (threat >= 100) { // 能阻止活三或以上
      defenseValue += threat / 100; // 按威胁级别加分
    }
  }
  
  return defenseValue;
};
