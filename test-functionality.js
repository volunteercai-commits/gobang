// 简单的功能测试脚本
console.log('🧪 开始测试五子棋功能...');

// 测试1: 检查页面元素
setTimeout(() => {
  const title = document.querySelector('h1');
  const buttons = document.querySelectorAll('button');
  const status = document.querySelector('[data-testid="game-controls"]');
  
  console.log('✅ 标题:', title ? title.textContent : '未找到');
  console.log('✅ 按钮数量:', buttons.length);
  console.log('✅ 控制面板:', status ? '存在' : '未找到');
  
  // 测试2: 检查按钮功能
  const resetBtn = document.querySelector('[data-testid="reset-button"]');
  const modeBtn = document.querySelector('[data-testid="mode-button"]');
  
  if (resetBtn) {
    console.log('✅ 重置按钮:', resetBtn.textContent);
  }
  
  if (modeBtn) {
    console.log('✅ 模式按钮:', modeBtn.textContent);
  }
  
  // 测试3: 检查棋盘
  const canvas = document.querySelector('canvas');
  if (canvas) {
    console.log('✅ 棋盘尺寸:', canvas.width + 'x' + canvas.height);
  } else {
    console.log('❌ 棋盘未找到');
  }
  
  console.log('🎉 测试完成！');
}, 2000);
