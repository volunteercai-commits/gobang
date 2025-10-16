import React, { useState, useEffect, useCallback } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { GameControls } from './components/GameControls';
import { GameStatus } from './components/GameStatus';
import { WinnerAnnouncement } from './components/WinnerAnnouncement';
import { useGameState } from './hooks/useGameState';

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

  // 调整棋盘大小 - 确保无滚动条
  const resizeBoard = useCallback(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 计算可用空间
    const headerHeight = 60; // 标题区域
    const statusHeight = 80; // 状态栏
    const controlsHeight = 80; // 控制按钮
    const padding = 32; // 内边距
    
    const availableHeight = windowHeight - headerHeight - statusHeight - controlsHeight - padding;
    const availableWidth = windowWidth - padding;
    
    // 计算最大棋盘尺寸
    const maxSize = Math.min(availableWidth, availableHeight);
    
    // 确保最小尺寸，最大尺寸
    const newSize = Math.max(250, Math.min(maxSize, windowWidth <= 768 ? 300 : 400));
    
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
    <div className="w-full h-screen bg-white overflow-hidden">
      {/* 统一的多端设计 - 固定高度，无滚动条 */}
      <div className="w-full h-full flex flex-col bg-white">
        {/* 标题区域 - 固定高度 */}
        <div className="flex-shrink-0 px-4 py-2">
          <h1 className="text-center text-xl font-bold text-black">五子棋</h1>
        </div>
        
        {/* 棋盘区域 - 自适应高度 */}
        <div className="flex-1 flex justify-center items-center px-4 min-h-0">
          <ChessBoard
            gameState={gameState}
            onCellClick={handleClick}
            cellSize={cellSize}
            boardSize={boardSize}
          />
        </div>
        
        {/* 状态栏 - 固定高度 */}
        <div className="flex-shrink-0">
          <GameStatus gameState={gameState} />
        </div>
        
        {/* 控制按钮 - 固定高度 */}
        <div className="flex-shrink-0">
          <GameControls
            gameState={gameState}
            onResetGame={resetGame}
            onToggleMode={toggleMode}
            onToggleFirstPlayer={toggleFirstPlayer}
            onUndoMove={undoMove}
            onResetScores={resetScores}
          />
        </div>
        
        {/* 胜利提示 - 绝对定位，不影响布局 */}
        <WinnerAnnouncement gameState={gameState} />
      </div>
    </div>
  );
}

export default App;
