// 游戏模式
export type GameMode = 'pvp' | 'pvc';

// 棋子颜色
export type PieceColor = 'black' | 'white';

// 棋子值
export type PieceValue = 0 | 1 | -1; // 0: 空, 1: 黑子, -1: 白子

// 位置坐标
export interface Position {
  row: number;
  col: number;
}

// 移动记录
export interface Move {
  row: number;
  col: number;
  player: PieceColor;
}

// 游戏状态
export interface GameState {
  board: PieceValue[][];
  currentPlayer: PieceColor;
  gameEnded: boolean;
  winner: PieceColor | null;
  mode: GameMode;
  playerIsBlack: boolean;
  blackUndoUsed: boolean;
  whiteUndoUsed: boolean;
  lastBlackMove: Move | null;
  lastWhiteMove: Move | null;
  playerScore: number;
  aiScore: number;
  previewPosition: Position | null;
  isPreviewMode: boolean;
  lastClickPosition: Position | null;
}

// 威胁类型
export type ThreatType = 'live3' | 'sleep3' | 'live4' | 'sleep4' | 'double3' | 'four3' | 'double4';

// 方向
export interface Direction {
  dx: number;
  dy: number;
}

// 评分结果
export interface ScoreResult {
  score: number;
  position: Position;
}
