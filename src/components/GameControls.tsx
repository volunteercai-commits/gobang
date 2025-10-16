import React, { useState } from 'react';
import { GameState, AIDifficulty } from '../types';

interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  onToggleMode: () => void;
  onToggleFirstPlayer: () => void;
  onUndoMove: () => void;
  onResetScores: () => void;
  onSetAIDifficulty: (difficulty: AIDifficulty) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onResetGame,
  onToggleMode,
  onToggleFirstPlayer,
  onUndoMove,
  onResetScores,
  onSetAIDifficulty,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    <>
      <div className="px-2 sm:px-4 py-2 h-16 sm:h-16 flex items-center" data-testid="game-controls">
        {/* 主要操作按钮 */}
        <div className="flex gap-2 sm:gap-3 w-full">
          <button 
            onClick={onResetGame} 
            className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            data-testid="reset-button"
            style={{ minHeight: '44px' }} // 确保触摸区域足够大
          >
            🔄 重置
          </button>
          
          <button 
            onClick={() => {
              onUndoMove();
            }} 
            className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gray-400 rounded-xl hover:bg-gray-500 active:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            disabled={undoButtonState.disabled}
            data-testid="undo-button"
            title="悔棋规则：悔自己的棋子时会把对手最后下的棋子也拿掉。如果在对局中悔过棋，赢了也不得分，对方赢了得两分。"
            style={{ minHeight: '44px' }} // 确保触摸区域足够大
          >
            ↩️ {undoButtonState.text}
          </button>
          
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gray-600 rounded-xl hover:bg-gray-700 active:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px' }} // 确保触摸区域足够大
          >
            ⚙️ 设置
          </button>
        </div>
      </div>

      {/* 设置弹窗 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">游戏设置</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-6">
              {/* 游戏模式设置 */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">游戏模式</label>
                <button 
                  onClick={() => {
                    onToggleMode();
                    setIsSettingsOpen(false);
                  }} 
                  className="w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  data-testid="mode-button"
                >
                  {gameState.mode === 'pvp' ? '👥 人人对战' : '🤖 人机对战'}
                </button>
              </div>

              {/* 先手设置 - 仅人机对战模式显示 */}
              {gameState.mode === 'pvc' && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">先手设置</label>
                  <button 
                    onClick={() => {
                      onToggleFirstPlayer();
                      setIsSettingsOpen(false);
                    }} 
                    className="w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    data-testid="first-player-button"
                  >
                    {gameState.playerIsBlack ? '👤 玩家先手' : '🤖 AI先手'}
                  </button>
                </div>
              )}

              {/* AI难度设置 - 仅人机对战模式显示 */}
              {gameState.mode === 'pvc' && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">AI难度</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'easy', label: '简单', emoji: '😊', desc: '快速思考' },
                      { value: 'medium', label: '中等', emoji: '🤔', desc: '平衡难度' },
                      { value: 'hard', label: '困难', emoji: '🧠', desc: '深度思考' }
                    ].map(({ value, label, emoji, desc }) => (
                      <button
                        key={value}
                        onClick={() => {
                          onSetAIDifficulty(value as AIDifficulty);
                          setIsSettingsOpen(false);
                        }}
                        className={`px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          gameState.aiDifficulty === value
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        data-testid={`ai-difficulty-${value}`}
                      >
                        <div className="text-lg mb-1">{emoji}</div>
                        <div className="font-semibold">{label}</div>
                        <div className="text-xs opacity-75">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}


              {/* 分数重置 - 仅人机对战模式显示 */}
              {gameState.mode === 'pvc' && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">分数管理</label>
                  <button 
                    onClick={() => {
                      onResetScores();
                      setIsSettingsOpen(false);
                    }} 
                    className="w-full px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    data-testid="reset-score-button"
                  >
                    🏆 重置分数
                  </button>
                </div>
              )}

              {/* 游戏规则说明 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">游戏规则</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 五子连珠即可获胜</li>
                  <li>• 悔棋会同时移除双方最后一步</li>
                  <li>• 悔棋后获胜不得分，对方获胜得双倍分</li>
                  <li>• 人机对战支持先手选择</li>
                </ul>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
