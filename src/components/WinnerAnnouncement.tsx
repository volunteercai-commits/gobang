import React, { useEffect, useState } from 'react';
import { GameState } from '../types';

interface WinnerAnnouncementProps {
  gameState: GameState;
}

export const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({ gameState }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (gameState.gameEnded && gameState.winner) {
      setShow(true);
      // 3秒后自动隐藏
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [gameState.gameEnded, gameState.winner]);

  if (!show || !gameState.winner) {
    return null;
  }

  const winner = gameState.winner === 'black' ? '黑方' : '白方';

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      data-testid="winner-announcement-container"
    >
      <div 
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-2xl shadow-2xl text-lg sm:text-2xl font-bold animate-bounce pointer-events-auto"
        data-testid="winner-announcement"
      >
        🎉 {winner}胜利！ 🎉
      </div>
    </div>
  );
};
