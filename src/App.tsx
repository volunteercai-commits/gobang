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
    setAIDifficulty,
  } = useGameState();

  // 计算棋盘大小
  const [boardSize, setBoardSize] = useState(450);
  const [cellSize, setCellSize] = useState(30);

  // 设置动态视口高度 - 解决移动端可视区域问题
  const setViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }, []);

  // 调整棋盘大小 - 确保无滚动条
  const resizeBoard = useCallback(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 计算可用空间 - 移动端需要更精确的计算
    const headerHeight = windowWidth <= 768 ? 50 : 60; // 移动端标题区域更小
    const statusHeight = windowWidth <= 768 ? 60 : 80; // 移动端状态栏更小
    const controlsHeight = windowWidth <= 768 ? 70 : 80; // 移动端控制按钮更小
    const padding = windowWidth <= 768 ? 16 : 32; // 移动端内边距更小
    
    const availableHeight = windowHeight - headerHeight - statusHeight - controlsHeight - padding;
    const availableWidth = windowWidth - padding;
    
    // 计算最大棋盘尺寸
    const maxSize = Math.min(availableWidth, availableHeight);
    
    // 确保最小尺寸，最大尺寸 - 移动端优化
    const newSize = Math.max(200, Math.min(maxSize, windowWidth <= 768 ? 280 : 400));
    
    setBoardSize(newSize);
    setCellSize(newSize / 15);
  }, []);

  // 初始化视口高度和棋盘大小
  useEffect(() => {
    // 设置动态视口高度
    setViewportHeight();
    resizeBoard();
    
    // 监听窗口大小变化
    const handleResize = () => {
      setViewportHeight();
      resizeBoard();
    };
    
    window.addEventListener('resize', handleResize);
    // 监听移动端方向变化
    window.addEventListener('orientationchange', () => {
      // 延迟执行，等待方向变化完成
      setTimeout(() => {
        setViewportHeight();
        resizeBoard();
      }, 100);
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [setViewportHeight, resizeBoard]);

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
    <div className="w-full h-screen bg-white overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* 统一的多端设计 - 固定高度，无滚动条 */}
      <div className="w-full h-full flex flex-col bg-white">
        {/* 标题区域 - 固定高度，移动端更紧凑 */}
        <div className="flex-shrink-0 px-2 sm:px-4 py-1 sm:py-2">
          <h1 className="text-center text-lg sm:text-xl font-bold text-black">五子棋</h1>
        </div>
        
        {/* 棋盘区域 - 自适应高度 */}
        <div className="flex-1 flex justify-center items-center px-2 sm:px-4 min-h-0">
          <ChessBoard
            gameState={gameState}
            onCellClick={handleClick}
            cellSize={cellSize}
            boardSize={boardSize}
          />
        </div>
        
        {/* 状态栏 - 固定高度，移动端更紧凑 */}
        <div className="flex-shrink-0">
          <GameStatus gameState={gameState} />
        </div>
        
        {/* 控制按钮 - 固定高度，确保始终可见 */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200">
          <GameControls
            gameState={gameState}
            onResetGame={resetGame}
            onToggleMode={toggleMode}
            onToggleFirstPlayer={toggleFirstPlayer}
            onUndoMove={undoMove}
            onResetScores={resetScores}
            onSetAIDifficulty={setAIDifficulty}
          />
        </div>
        
        {/* 胜利提示 - 绝对定位，不影响布局 */}
        <WinnerAnnouncement gameState={gameState} />
      </div>
    </div>
  );
}

export default App;
