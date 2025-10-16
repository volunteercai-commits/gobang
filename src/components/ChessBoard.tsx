import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Position } from '../types';

interface ChessBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
  cellSize: number;
  boardSize: number;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  gameState,
  onCellClick,
  cellSize,
  boardSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTouchTimeRef = useRef<number>(0);

  // 绘制棋盘
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 计算棋盘偏移量（为坐标标签留空间）
    const labelSpace = Math.max(20, boardSize * 0.08);
    const offsetX = labelSpace;
    const offsetY = labelSpace;
    
    // 绘制背景
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 15; i++) {
      const pos = i * cellSize + cellSize / 2;
      // 横线
      ctx.beginPath();
      ctx.moveTo(offsetX + cellSize / 2, offsetY + pos);
      ctx.lineTo(offsetX + boardSize - cellSize / 2, offsetY + pos);
      ctx.stroke();
      
      // 竖线
      ctx.beginPath();
      ctx.moveTo(offsetX + pos, offsetY + cellSize / 2);
      ctx.lineTo(offsetX + pos, offsetY + boardSize - cellSize / 2);
      ctx.stroke();
    }
    
    // 绘制星位标记
    const starPoints = [3, 7, 11]; // 星位坐标
    ctx.fillStyle = '#8b4513';
    
    for (let i = 0; i < starPoints.length; i++) {
      for (let j = 0; j < starPoints.length; j++) {
        // 跳过不需要的点（避免重复绘制中心点）
        if ((i === 0 && j === 0) || (i === 0 && j === 2) || 
            (i === 2 && j === 0) || (i === 2 && j === 2) || 
            (i === 1 && j === 1)) {
          ctx.beginPath();
          ctx.arc(
            offsetX + starPoints[i] * cellSize + cellSize / 2,
            offsetY + starPoints[j] * cellSize + cellSize / 2,
            4, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
    
    // 绘制棋子
    if (gameState.board && gameState.board.length === 15) {
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          if (gameState.board[i] && gameState.board[i][j] !== 0) {
            drawPiece(ctx, j, i, gameState.board[i][j], offsetX, offsetY);
          }
        }
      }
    }
    
    // 绘制预览棋子
    if (gameState.previewPosition && !gameState.gameEnded) {
      const player = gameState.currentPlayer === 'black' ? 1 : -1;
      drawPreviewPiece(ctx, gameState.previewPosition.row, gameState.previewPosition.col, player, offsetX, offsetY);
    }
    
    // 绘制坐标标签
    drawCoordinates(ctx, offsetX, offsetY);
  }, [gameState, cellSize, boardSize]);

  // 绘制棋子
  const drawPiece = (ctx: CanvasRenderingContext2D, x: number, y: number, player: number, offsetX: number, offsetY: number) => {
    const centerX = offsetX + x * cellSize + cellSize / 2;
    const centerY = offsetY + y * cellSize + cellSize / 2;
    const radius = cellSize / 2 - 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    // 创建渐变效果使棋子更立体
    const gradient = ctx.createRadialGradient(
      centerX - 3, centerY - 3, 1,
      centerX, centerY, radius
    );
    
    if (player === 1) { // 黑棋
      gradient.addColorStop(0, '#636766');
      gradient.addColorStop(1, '#0a0a0a');
    } else { // 白棋
      gradient.addColorStop(0, '#f9f9f9');
      gradient.addColorStop(1, '#d1d1d1');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制棋子边框
    ctx.strokeStyle = player === 1 ? '#333' : '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // 绘制预览棋子
  const drawPreviewPiece = (ctx: CanvasRenderingContext2D, row: number, col: number, player: number, offsetX: number, offsetY: number) => {
    const x = offsetX + col * cellSize + cellSize / 2;
    const y = offsetY + row * cellSize + cellSize / 2;
    const radius = cellSize / 2 - 2;
    
    // 设置透明度
    ctx.globalAlpha = 0.5;
    
    // 绘制棋子背景
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // 创建渐变效果
    const gradient = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius);
    if (player === 1) { // 黑棋
      gradient.addColorStop(0, '#636766');
      gradient.addColorStop(1, '#0a0a0a');
    } else { // 白棋
      gradient.addColorStop(0, '#f9f9f9');
      gradient.addColorStop(1, '#d1d1d1');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = player === 1 ? '#333' : '#999';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制预览标记（闪烁的圆环）
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    
    // 恢复透明度
    ctx.globalAlpha = 1.0;
  };

  // 绘制坐标标签
  const drawCoordinates = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
    ctx.fillStyle = '#8b4513';
    const fontSize = Math.max(10, cellSize * 0.25);
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制数字坐标 (1-15) 在左侧
    for (let i = 0; i < 15; i++) {
      const x = offsetX - cellSize / 2.5;
      const y = offsetY + i * cellSize + cellSize / 2;
      ctx.fillText((i + 1).toString(), x, y);
    }
    
    // 绘制字母坐标 (A-O) 在底部
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    for (let i = 0; i < 15; i++) {
      const x = offsetX + i * cellSize + cellSize / 2;
      const y = offsetY + boardSize + cellSize / 2.5;
      ctx.fillText(letters[i], x, y);
    }
  };

  // 处理点击事件
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState.gameEnded) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // 计算偏移量
    const labelSpace = Math.max(20, boardSize * 0.08);
    const offsetX = labelSpace;
    const offsetY = labelSpace;
    
    // 获取相对于Canvas的坐标
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // 调整坐标，减去偏移量
    const adjustedX = canvasX - offsetX;
    const adjustedY = canvasY - offsetY;
    
    // 计算格子坐标 - 对齐到格子中心
    const col = Math.round((adjustedX - cellSize / 2) / cellSize);
    const row = Math.round((adjustedY - cellSize / 2) / cellSize);
    
    // 确保点击在棋盘范围内
    if (col < 0 || col >= 15 || row < 0 || row >= 15) {
      return;
    }
    
    onCellClick(row, col);
  }, [gameState.gameEnded, boardSize, cellSize, onCellClick]);

  // 处理触摸事件
  const handleCanvasTouch = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (gameState.gameEnded) return;
    
    // 防抖：防止快速重复触摸
    const now = Date.now();
    if (now - lastTouchTimeRef.current < 300) {
      return;
    }
    lastTouchTimeRef.current = now;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // 获取触摸点坐标
    const touch = event.touches[0];
    const canvasX = touch.clientX - rect.left;
    const canvasY = touch.clientY - rect.top;
    
    // 计算偏移量
    const labelSpace = Math.max(20, boardSize * 0.08);
    const offsetX = labelSpace;
    const offsetY = labelSpace;
    
    // 调整坐标，减去偏移量
    const adjustedX = canvasX - offsetX;
    const adjustedY = canvasY - offsetY;
    
    // 计算格子坐标 - 对齐到格子中心
    const col = Math.round((adjustedX - cellSize / 2) / cellSize);
    const row = Math.round((adjustedY - cellSize / 2) / cellSize);
    
    // 确保点击在棋盘范围内
    if (col < 0 || col >= 15 || row < 0 || row >= 15) {
      return;
    }
    
    // 触摸事件也使用相同的点击逻辑（需要点击两次）
    onCellClick(row, col);
  }, [gameState.gameEnded, boardSize, cellSize, onCellClick]);

  // 绘制棋盘
  useEffect(() => {
    drawBoard();
  }, [drawBoard]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="chess-board"
      width={boardSize + Math.max(20, boardSize * 0.08) * 2}
      height={boardSize + Math.max(20, boardSize * 0.08) * 2}
      onClick={handleCanvasClick}
      onTouchStart={handleCanvasTouch}
      style={{
        display: 'block',
        margin: '0 auto',
        borderRadius: '15px',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25)',
      }}
    />
  );
};
