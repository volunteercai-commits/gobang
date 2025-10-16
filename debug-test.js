const puppeteer = require('puppeteer');

async function debugTest() {
  console.log('🔍 开始调试测试...');
  
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
    
    // 检查棋盘状态
    const canvas = await page.$('[data-testid="chess-board"]');
    if (canvas) {
      console.log('✅ 找到棋盘canvas');
      
      // 获取棋盘尺寸
      const canvasSize = await canvas.evaluate(el => ({
        width: el.width,
        height: el.height
      }));
      console.log('📏 棋盘尺寸:', canvasSize);
      
      // 尝试点击中心位置
      const cellSize = canvasSize.width / 15;
      const labelSpace = Math.max(20, canvasSize.width * 0.08);
      const centerX = labelSpace + 7 * cellSize + cellSize / 2;
      const centerY = labelSpace + 7 * cellSize + cellSize / 2;
      
      console.log('🎯 点击中心位置:', { x: centerX, y: centerY });
      await canvas.click({ x: centerX, y: centerY });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查是否有棋子出现
      const canvasImage = await canvas.screenshot();
      console.log('📸 已截图棋盘状态');
      
      // 检查游戏状态
      const gameStatus = await page.evaluate(() => {
        // 尝试从React组件获取游戏状态
        const reactRoot = document.querySelector('#root');
        if (reactRoot && reactRoot._reactInternalFiber) {
          console.log('找到React根组件');
        }
        return {
          hasWinner: !!document.querySelector('[data-testid="winner-announcement"]'),
          winnerText: document.querySelector('[data-testid="winner-announcement"]')?.textContent || null
        };
      });
      
      console.log('🎮 游戏状态:', gameStatus);
      
    } else {
      console.log('❌ 找不到棋盘canvas');
    }
    
    // 等待一段时间观察
    console.log('⏳ 等待10秒观察...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  } finally {
    await browser.close();
  }
}

debugTest().catch(console.error);
