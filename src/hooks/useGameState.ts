import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Position, PieceColor, GameMode, Move } from '../types';
import { initializeBoard, checkWin } from '../utils/gameLogic';
import { AIDecisionEngine } from '../utils/aiDecision';

const initialGameState: GameState = {
  board: initializeBoard(),
  currentPlayer: 'black',
  gameEnded: false,
  winner: null,
  mode: 'pvp',
  playerIsBlack: true,
  blackUndoUsed: false,
  whiteUndoUsed: false,
  lastBlackMove: null,
  lastWhiteMove: null,
  playerScore: 0,
  aiScore: 0,
  previewPosition: null,
  isPreviewMode: false,
  lastClickPosition: null,
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const aiThinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // 重置游戏
  const resetGame = useCallback(() => {
    // 清除AI思考状态
    if (aiThinkingTimeoutRef.current) {
      clearTimeout(aiThinkingTimeoutRef.current);
      aiThinkingTimeoutRef.current = null;
    }

    setGameState(prevState => ({
      ...prevState,
      board: initializeBoard(),
      currentPlayer: 'black',
      gameEnded: false,
      winner: null,
      blackUndoUsed: false,
      whiteUndoUsed: false,
      lastBlackMove: null,
      lastWhiteMove: null,
      previewPosition: null,
      isPreviewMode: false,
      lastClickPosition: null,
    }));
  }, []);

  // 切换游戏模式
  const toggleMode = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      mode: prevState.mode === 'pvp' ? 'pvc' : 'pvp',
    }));
    resetGame();
  }, [resetGame]);

  // 切换先手
  const toggleFirstPlayer = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      playerIsBlack: !prevState.playerIsBlack,
    }));
    resetGame();
  }, [resetGame]);

  // 下棋
  const placePiece = useCallback((row: number, col: number) => {
    setGameState(prevState => {
      if (prevState.gameEnded || prevState.board[row][col] !== 0) {
        return prevState;
      }

      const newBoard = prevState.board.map(row => [...row]);
      const pieceValue = prevState.currentPlayer === 'black' ? 1 : -1;
      newBoard[row][col] = pieceValue;

      // 记录移动
      const move: Move = { row, col, player: prevState.currentPlayer };
      const newLastBlackMove = prevState.currentPlayer === 'black' ? move : prevState.lastBlackMove;
      const newLastWhiteMove = prevState.currentPlayer === 'white' ? move : prevState.lastWhiteMove;

      // 检查是否获胜
      const isWin = checkWin(newBoard, row, col);
      const newGameEnded = isWin;
      const newWinner = isWin ? prevState.currentPlayer : null;

      // 计算得分
      let newPlayerScore = prevState.playerScore;
      let newAiScore = prevState.aiScore;
      let currentGameResult = null;

      if (isWin && prevState.mode === 'pvc') {
        const playerWon = (prevState.playerIsBlack && prevState.currentPlayer === 'black') || 
                         (!prevState.playerIsBlack && prevState.currentPlayer === 'white');
        const playerUsedUndo = (prevState.playerIsBlack && prevState.blackUndoUsed) || 
                              (!prevState.playerIsBlack && prevState.whiteUndoUsed);
        const aiUsedUndo = (prevState.playerIsBlack && prevState.whiteUndoUsed) || 
                          (!prevState.playerIsBlack && prevState.blackUndoUsed);
        
        if (playerWon) {
          if (playerUsedUndo) {
            currentGameResult = '玩家胜利（悔过棋，不得分）';
          } else {
            newPlayerScore += 1;
            currentGameResult = '玩家胜利 +1分';
          }
        } else {
          if (aiUsedUndo) {
            newPlayerScore += 2;
            currentGameResult = 'AI胜利（AI悔过棋，玩家+2分）';
          } else {
            newAiScore += 1;
            currentGameResult = 'AI胜利 +1分';
          }
        }
      }

      const newCurrentPlayer = isWin ? prevState.currentPlayer : 
                              (prevState.currentPlayer === 'black' ? 'white' : 'black');

      return {
        ...prevState,
        board: newBoard,
        currentPlayer: newCurrentPlayer,
        gameEnded: newGameEnded,
        winner: newWinner,
        lastBlackMove: newLastBlackMove,
        lastWhiteMove: newLastWhiteMove,
        playerScore: newPlayerScore,
        aiScore: newAiScore,
        previewPosition: null,
        isPreviewMode: false,
        lastClickPosition: null,
      };
    });

  }, []);

  // 处理点击事件
  const handleCellClick = useCallback((row: number, col: number) => {
    const now = Date.now();
    
    // 防抖：防止快速重复点击
    if (now - lastClickTimeRef.current < 200) {
      console.log('🚫 点击防抖，忽略');
      return;
    }
    lastClickTimeRef.current = now;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🖱️ 点击事件:', { row, col, timestamp: now });
    }
    
    setGameState(prevState => {
      if (prevState.gameEnded) return prevState;

      // 人机模式下，只有玩家执的棋子才能点击
      if (prevState.mode === 'pvc') {
        if (prevState.playerIsBlack && prevState.currentPlayer === 'white') return prevState;
        if (!prevState.playerIsBlack && prevState.currentPlayer === 'black') return prevState;
      }

      // 如果该位置已有棋子，则不处理
      if (prevState.board[row][col] !== 0) return prevState;

      // 检查是否是重复点击同一位置
      const isRepeatClick = prevState.lastClickPosition && 
          prevState.lastClickPosition.row === row && 
          prevState.lastClickPosition.col === col;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 点击检查:', { 
          isRepeatClick, 
          lastClickPosition: prevState.lastClickPosition,
          currentClick: { row, col }
        });
      }

      if (isRepeatClick) {
        // 确认落子
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 确认落子');
        }
        placePiece(row, col);
        return prevState;
      } else {
        // 显示预览棋子
        if (process.env.NODE_ENV === 'development') {
          console.log('👁️ 显示预览');
        }
        return {
          ...prevState,
          lastClickPosition: { row, col },
          previewPosition: { row, col },
          isPreviewMode: true,
        };
      }
    });
  }, [placePiece]);

  // AI下棋
  const aiMove = useCallback(() => {
    setGameState(prevState => {
      if (prevState.gameEnded || prevState.mode === 'pvp') return prevState;

      // 检查是否轮到AI下棋
      const isAITurn = (prevState.playerIsBlack && prevState.currentPlayer === 'white') || 
                      (!prevState.playerIsBlack && prevState.currentPlayer === 'black');
      
      if (!isAITurn) return prevState;

      const aiPlayer = prevState.playerIsBlack ? -1 : 1;
      const humanPlayer = prevState.playerIsBlack ? 1 : -1;
      
      const aiEngine = new AIDecisionEngine(prevState.board, aiPlayer, humanPlayer);
      // 异步调用AI引擎
      aiEngine.getBestMove().then(bestMove => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🤖 AI思考完成... bestMove:', bestMove);
        }
        
        if (bestMove) {
          setGameState(currentState => {
            if (currentState.gameEnded || currentState.mode === 'pvp') return currentState;
            
            // 检查是否还是AI的回合（防止重复下棋）
            const isStillAITurn = (currentState.playerIsBlack && currentState.currentPlayer === 'white') || 
                                 (!currentState.playerIsBlack && currentState.currentPlayer === 'black');
            
            if (!isStillAITurn) {
              if (process.env.NODE_ENV === 'development') {
                console.log('⚠️ AI回合已结束，跳过下棋');
              }
              return currentState;
            }
            
            // 直接下棋
            const newBoard = currentState.board.map(row => [...row]);
            newBoard[bestMove.row][bestMove.col] = aiPlayer;
            
            // 记录移动
            const move: Move = { row: bestMove.row, col: bestMove.col, player: currentState.currentPlayer };
            const newLastBlackMove = currentState.currentPlayer === 'black' ? move : currentState.lastBlackMove;
            const newLastWhiteMove = currentState.currentPlayer === 'white' ? move : currentState.lastWhiteMove;

            // 检查是否获胜
            const isWin = checkWin(newBoard, bestMove.row, bestMove.col);
            const newGameEnded = isWin;
            const newWinner = isWin ? currentState.currentPlayer : null;

            // 计算得分
            let newPlayerScore = currentState.playerScore;
            let newAiScore = currentState.aiScore;

            if (isWin && currentState.mode === 'pvc') {
              const aiWon = (currentState.playerIsBlack && currentState.currentPlayer === 'white') || 
                           (!currentState.playerIsBlack && currentState.currentPlayer === 'black');
              const aiUsedUndo = (currentState.playerIsBlack && currentState.whiteUndoUsed) || 
                                (!currentState.playerIsBlack && currentState.blackUndoUsed);
              
              if (aiWon) {
                if (aiUsedUndo) {
                  newPlayerScore += 2;
                } else {
                  newAiScore += 1;
                }
              }
            }

            // 切换玩家（除非游戏结束）
            const newCurrentPlayer = isWin ? currentState.currentPlayer : 
                                    (currentState.currentPlayer === 'black' ? 'white' : 'black');

            if (process.env.NODE_ENV === 'development') {
              console.log('🤖 AI下棋完成:', {
                position: bestMove,
                player: currentState.currentPlayer,
                isWin: isWin,
                nextPlayer: newCurrentPlayer
              });
            }

            return {
              ...currentState,
              board: newBoard,
              currentPlayer: newCurrentPlayer,
              gameEnded: newGameEnded,
              winner: newWinner,
              lastBlackMove: newLastBlackMove,
              lastWhiteMove: newLastWhiteMove,
              playerScore: newPlayerScore,
              aiScore: newAiScore,
              previewPosition: null,
              isPreviewMode: false,
              lastClickPosition: null,
            };
          });
        }
      }).catch(error => {
        console.error('AI调用失败:', error);
      });
      
      // 返回当前状态，AI会在异步完成后更新
      return prevState;
    });
  }, []);

  // 触发AI下棋（延迟）
  const triggerAIMove = useCallback(() => {
    if (aiThinkingTimeoutRef.current) {
      clearTimeout(aiThinkingTimeoutRef.current);
    }
    
    aiThinkingTimeoutRef.current = setTimeout(() => {
      aiMove();
      aiThinkingTimeoutRef.current = null;
    }, 500);
  }, [aiMove]);

  // 监听游戏状态变化，触发AI下棋
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 useEffect触发 - mode:', gameState.mode, 'gameEnded:', gameState.gameEnded, 'currentPlayer:', gameState.currentPlayer, 'playerIsBlack:', gameState.playerIsBlack);
    }
    
    if (gameState.mode === 'pvc' && !gameState.gameEnded) {
      const isAITurn = (gameState.playerIsBlack && gameState.currentPlayer === 'white') || 
                      (!gameState.playerIsBlack && gameState.currentPlayer === 'black');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 AI回合检查 - isAITurn:', isAITurn, 'currentPlayer:', gameState.currentPlayer, 'playerIsBlack:', gameState.playerIsBlack);
      }
      
      if (isAITurn) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 触发AI下棋...');
        }
        triggerAIMove();
      }
    }
  }, [gameState.mode, gameState.gameEnded, gameState.currentPlayer, gameState.playerIsBlack, triggerAIMove]);

  // 悔棋
  const undoMove = useCallback(() => {
    setGameState(prevState => {
      if (prevState.gameEnded) return prevState;

      let myMove: Move | null = null;
      let opponentMove: Move | null = null;
      let newBlackUndoUsed = prevState.blackUndoUsed;
      let newWhiteUndoUsed = prevState.whiteUndoUsed;

      // 根据当前玩家确定要悔的棋子
      if (prevState.currentPlayer === 'black' && prevState.lastBlackMove && !prevState.blackUndoUsed) {
        myMove = prevState.lastBlackMove;
        opponentMove = prevState.lastWhiteMove;
        newBlackUndoUsed = true;
      } else if (prevState.currentPlayer === 'white' && prevState.lastWhiteMove && !prevState.whiteUndoUsed) {
        myMove = prevState.lastWhiteMove;
        opponentMove = prevState.lastBlackMove;
        newWhiteUndoUsed = true;
      } else {
        return prevState; // 不能悔棋
      }

      const newBoard = prevState.board.map(row => [...row]);
      
      // 移除自己的棋子
      if (myMove) {
        newBoard[myMove.row][myMove.col] = 0;
      }
      
      // 移除对手最后下的棋子
      if (opponentMove) {
        newBoard[opponentMove.row][opponentMove.col] = 0;
      }

      return {
        ...prevState,
        board: newBoard,
        blackUndoUsed: newBlackUndoUsed,
        whiteUndoUsed: newWhiteUndoUsed,
        lastBlackMove: prevState.currentPlayer === 'black' ? null : prevState.lastBlackMove,
        lastWhiteMove: prevState.currentPlayer === 'white' ? null : prevState.lastWhiteMove,
      };
    });
  }, []);

  // 重置分数
  const resetScores = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      playerScore: 0,
      aiScore: 0,
    }));
  }, []);

  return {
    gameState,
    resetGame,
    toggleMode,
    toggleFirstPlayer,
    placePiece,
    handleCellClick,
    aiMove,
    triggerAIMove,
    undoMove,
    resetScores,
  };
};
