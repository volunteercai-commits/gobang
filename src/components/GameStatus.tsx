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
    <div className="px-4 py-2 h-20 flex flex-col justify-center">
      <div 
        className="bg-gradient-to-r from-pink-300 to-teal-300 text-black px-4 py-2 rounded-lg text-center font-medium text-sm"
        style={{ 
          background: 'linear-gradient(to right, #f9a8d4, #6ee7b7)',
          color: 'black',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: '500'
        }}
      >
        {getStatusText()}
      </div>
      
      {gameState.mode === 'pvc' && (
        <div 
          className="flex justify-center gap-6 bg-gray-100 px-4 py-1 rounded-lg mt-1"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px'
          }}
        >
          <div className="text-center" style={{ textAlign: 'center' }}>
            <div className="text-gray-600 text-xs" style={{ color: '#6b7280', fontSize: '12px' }}>玩家</div>
            <div className="text-blue-600 font-bold text-base" style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '16px' }}>{gameState.playerScore}</div>
          </div>
          <div className="text-center" style={{ textAlign: 'center' }}>
            <div className="text-gray-600 text-xs" style={{ color: '#6b7280', fontSize: '12px' }}>AI</div>
            <div className="text-blue-600 font-bold text-base" style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '16px' }}>{gameState.aiScore}</div>
          </div>
        </div>
      )}
    </div>
  );
};
