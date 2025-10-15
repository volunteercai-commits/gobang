import React from 'react';
import { GameState } from '../types';

interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  onToggleMode: () => void;
  onToggleFirstPlayer: () => void;
  onUndoMove: () => void;
  onResetScores: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onResetGame,
  onToggleMode,
  onToggleFirstPlayer,
  onUndoMove,
  onResetScores,
}) => {
  // 更新悔棋按钮状态
  const getUndoButtonState = () => {
    if (gameState.gameEnded) {
      return { disabled: true, text: '悔棋 (已结束)' };
    } else if (gameState.currentPlayer === 'black') {
      if (gameState.lastBlackMove && !gameState.blackUndoUsed) {
        return { disabled: false, text: '悔棋 (黑方)' };
      } else if (gameState.blackUndoUsed) {
        return { disabled: true, text: '悔棋 (黑方已用)' };
      } else {
        return { disabled: true, text: '悔棋 (黑方无子)' };
      }
    } else {
      if (gameState.lastWhiteMove && !gameState.whiteUndoUsed) {
        return { disabled: false, text: '悔棋 (白方)' };
      } else if (gameState.whiteUndoUsed) {
        return { disabled: true, text: '悔棋 (白方已用)' };
      } else {
        return { disabled: true, text: '悔棋 (白方无子)' };
      }
    }
  };

  const undoButtonState = getUndoButtonState();

  return (
    <div className="game-controls">
      <div className="button-group">
        <button onClick={onResetGame} className="reset-btn">
          重置游戏
        </button>
        
        <button onClick={onToggleMode} className="mode-btn">
          当前模式：{gameState.mode === 'pvp' ? '人人对战' : '人机对战'}
        </button>
        
        {gameState.mode === 'pvc' && (
          <button onClick={onToggleFirstPlayer} className="first-player-btn">
            先手：{gameState.playerIsBlack ? '玩家' : 'AI'}
          </button>
        )}
        
        <button 
          onClick={onUndoMove} 
          className="undo-btn"
          disabled={undoButtonState.disabled}
          title="悔棋规则：悔自己的棋子时会把对手最后下的棋子也拿掉。如果在对局中悔过棋，赢了也不得分，对方赢了得两分。"
        >
          {undoButtonState.text}
        </button>
        
        {gameState.mode === 'pvc' && (
          <button onClick={onResetScores} className="reset-score-btn">
            重置分数
          </button>
        )}
      </div>
    </div>
  );
};
