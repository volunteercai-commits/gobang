const puppeteer = require('puppeteer');

async function detailedDebug() {
  console.log('🔍 开始详细调试...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 等待棋盘加载
    await page.waitForSelector('[data-testid="chess-board"]', { timeout: 5000 });
    console.log('✅ 棋盘加载完成');
    
    // 检查初始游戏状态
    const initialState = await page.evaluate(() => {
      const reactRoot = document.querySelector('#root');
      return {
        hasReact: !!reactRoot,
        boardExists: !!document.querySelector('[data-testid="chess-board"]'),
        controlsExist: !!document.querySelector('[data-testid="game-controls"]')
      };
    });
    console.log('📊 初始状态:', initialState);
    
    // 获取棋盘
    const canvas = await page.$('[data-testid="chess-board"]');
    if (!canvas) {
      console.log('❌ 找不到棋盘canvas');
      return;
    }
    
    // 获取棋盘尺寸
    const canvasSize = await canvas.evaluate(el => ({
      width: el.width,
      height: el.height
    }));
    console.log('📏 棋盘尺寸:', canvasSize);
    
    // 点击中心位置
    const cellSize = canvasSize.width / 15;
    const labelSpace = Math.max(20, canvasSize.width * 0.08);
    const centerX = labelSpace + 7 * cellSize + cellSize / 2;
    const centerY = labelSpace + 7 * cellSize + cellSize / 2;
    
    console.log('🎯 点击中心位置:', { x: centerX, y: centerY });
    await canvas.click({ x: centerX, y: centerY });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 检查是否有棋子出现
    console.log('🔍 检查玩家下子后状态...');
    const afterPlayerMove = await page.evaluate(() => {
      // 尝试获取React状态
      const root = document.querySelector('#root');
      if (root && root._reactInternalFiber) {
        console.log('找到React根组件');
      }
      
      return {
        hasWinner: !!document.querySelector('[data-testid="winner-announcement"]'),
        winnerText: document.querySelector('[data-testid="winner-announcement"]')?.textContent || null,
        boardElement: !!document.querySelector('[data-testid="chess-board"]')
      };
    });
    console.log('📊 玩家下子后状态:', afterPlayerMove);
    
    // 等待AI下子
    console.log('⏳ 等待AI下子...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查AI是否下子
    console.log('🔍 检查AI下子后状态...');
    const afterAIMove = await page.evaluate(() => {
      return {
        hasWinner: !!document.querySelector('[data-testid="winner-announcement"]'),
        winnerText: document.querySelector('[data-testid="winner-announcement"]')?.textContent || null,
        boardElement: !!document.querySelector('[data-testid="chess-board"]')
      };
    });
    console.log('📊 AI下子后状态:', afterAIMove);
    
    // 再次点击测试
    console.log('🎯 再次点击测试...');
    const testX = labelSpace + 6 * cellSize + cellSize / 2;
    const testY = labelSpace + 6 * cellSize + cellSize / 2;
    await canvas.click({ x: testX, y: testY });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 等待AI再次下子
    console.log('⏳ 等待AI再次下子...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 最终状态检查
    const finalState = await page.evaluate(() => {
      return {
        hasWinner: !!document.querySelector('[data-testid="winner-announcement"]'),
        winnerText: document.querySelector('[data-testid="winner-announcement"]')?.textContent || null
      };
    });
    console.log('📊 最终状态:', finalState);
    
    // 截图保存
    await canvas.screenshot({ path: 'debug-board.png' });
    console.log('📸 已保存棋盘截图: debug-board.png');
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  } finally {
    await browser.close();
  }
}

detailedDebug().catch(console.error);
