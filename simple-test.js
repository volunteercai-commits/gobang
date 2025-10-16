const puppeteer = require('puppeteer');

async function simpleTest() {
  console.log('🔍 开始简化测试...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // 监听控制台输出
  page.on('console', msg => {
    console.log('📱 页面控制台:', msg.text());
  });
  
  try {
    // 打开游戏
    console.log('🌐 打开游戏页面...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // 等待页面加载
    await page.waitForSelector('[data-testid="game-controls"]', { timeout: 10000 });
    console.log('✅ 游戏控件加载完成');
    
    // 选择人机对战
    console.log('🎮 选择人机对战模式...');
    await page.click('[data-testid="mode-button"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 等待棋盘加载
    await page.waitForSelector('[data-testid="chess-board"]', { timeout: 5000 });
    console.log('✅ 棋盘加载完成');
    
    // 点击中心位置
    const canvas = await page.$('[data-testid="chess-board"]');
    const canvasSize = await canvas.evaluate(el => ({
      width: el.width,
      height: el.height
    }));
    
    const cellSize = canvasSize.width / 15;
    const labelSpace = Math.max(20, canvasSize.width * 0.08);
    const centerX = labelSpace + 7 * cellSize + cellSize / 2;
    const centerY = labelSpace + 7 * cellSize + cellSize / 2;
    
    console.log('🎯 第一次点击中心位置（预览）...');
    await canvas.click({ x: centerX, y: centerY });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🎯 第二次点击中心位置（确认下子）...');
    await canvas.click({ x: centerX, y: centerY });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('⏳ 等待AI下子...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查游戏状态
    const gameState = await page.evaluate(() => {
      // 尝试从React DevTools获取状态
      const root = document.querySelector('#root');
      if (root && root._reactInternalFiber) {
        console.log('找到React根组件');
      }
      
      return {
        hasWinner: !!document.querySelector('[data-testid="winner-announcement"]'),
        winnerText: document.querySelector('[data-testid="winner-announcement"]')?.textContent || null
      };
    });
    
    console.log('📊 最终游戏状态:', gameState);
    
    // 截图
    await canvas.screenshot({ path: 'simple-test-board.png' });
    console.log('📸 已保存截图: simple-test-board.png');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  } finally {
    await browser.close();
  }
}

simpleTest().catch(console.error);
