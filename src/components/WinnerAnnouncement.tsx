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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-2xl font-bold animate-bounce z-50" 
      data-testid="winner-announcement"
    >
      🎉 {winner}胜利！ 🎉
    </div>
  );
};
