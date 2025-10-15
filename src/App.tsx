import React, { useState, useEffect, useCallback } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { GameControls } from './components/GameControls';
import { GameStatus } from './components/GameStatus';
import { WinnerAnnouncement } from './components/WinnerAnnouncement';
import { useGameState } from './hooks/useGameState';
import './styles/App.css';

function App() {
  const {
    gameState,
    resetGame,
    toggleMode,
    toggleFirstPlayer,
    handleCellClick,
    triggerAIMove,
    undoMove,
    resetScores,
  } = useGameState();

  // 计算棋盘大小
  const [boardSize, setBoardSize] = useState(450);
  const [cellSize, setCellSize] = useState(30);

  // 调整棋盘大小
  const resizeBoard = useCallback(() => {
    const container = document.querySelector('.chessboard-container') as HTMLElement;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // 计算合适的棋盘大小
    let maxSize;
    if (window.innerWidth <= 768) {
      // 移动端 - 利用更紧凑的坐标空间，让棋盘更大
      maxSize = Math.min(containerWidth, containerHeight, window.innerWidth * 0.85, window.innerHeight * 0.65);
    } else {
      // 桌面端
      maxSize = Math.min(containerWidth, containerHeight, 500);
    }
    
    const newSize = Math.max(300, Math.min(maxSize, window.innerWidth <= 768 ? 400 : 500));
    setBoardSize(newSize);
    setCellSize(newSize / 15);
  }, []);

  // 初始化棋盘大小
  useEffect(() => {
    resizeBoard();
    window.addEventListener('resize', resizeBoard);
    return () => window.removeEventListener('resize', resizeBoard);
  }, [resizeBoard]);

  // AI下棋逻辑
  useEffect(() => {
    if (gameState.mode === 'pvc' && !gameState.gameEnded) {
      const isAITurn = (gameState.playerIsBlack && gameState.currentPlayer === 'white') || 
                      (!gameState.playerIsBlack && gameState.currentPlayer === 'black');
      
      if (isAITurn) {
        triggerAIMove();
      }
    }
  }, [gameState, triggerAIMove]);

  // 处理点击事件
  const handleClick = useCallback((row: number, col: number) => {
    handleCellClick(row, col);
  }, [handleCellClick]);

  return (
    <div className="App">
      <div className="game-container">
        <h1>五子棋</h1>
        
        <div className="chessboard-container">
          <ChessBoard
            gameState={gameState}
            onCellClick={handleClick}
            cellSize={cellSize}
            boardSize={boardSize}
          />
        </div>
        
        <GameStatus gameState={gameState} />
        
        <GameControls
          gameState={gameState}
          onResetGame={resetGame}
          onToggleMode={toggleMode}
          onToggleFirstPlayer={toggleFirstPlayer}
          onUndoMove={undoMove}
          onResetScores={resetScores}
        />
        
        <WinnerAnnouncement gameState={gameState} />
      </div>
    </div>
  );
}

export default App;
