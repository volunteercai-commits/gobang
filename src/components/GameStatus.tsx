import React from 'react';
import { GameState } from '../types';

interface GameStatusProps {
  gameState: GameState;
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState }) => {
  // 更新状态显示
  const getStatusText = () => {
    if (gameState.gameEnded) {
      const winner = gameState.currentPlayer === 'black' ? '黑方' : '白方';
      return `${winner}胜利！`;
    }
    
    if (gameState.mode === 'pvc') {
      if (gameState.playerIsBlack) {
        return gameState.currentPlayer === 'black' ? '轮到您下棋（黑子）' : 'AI思考中...（白子）';
      } else {
        return gameState.currentPlayer === 'white' ? '轮到您下棋（白子）' : 'AI思考中...（黑子）';
      }
    } else {
      return `轮到${gameState.currentPlayer === 'black' ? '黑方' : '白方'}下棋`;
    }
  };

  return (
    <div className="game-status">
      <div className="status">
        {getStatusText()}
      </div>
      
      {gameState.mode === 'pvc' && (
        <div className="score-display">
          <div className="score-item">
            <span className="score-label">玩家:</span>
            <span className="score-value">{gameState.playerScore}</span>
          </div>
          <div className="score-item">
            <span className="score-label">AI:</span>
            <span className="score-value">{gameState.aiScore}</span>
          </div>
        </div>
      )}
    </div>
  );
};
