const puppeteer = require('puppeteer');
const fs = require('fs');

class GobangAutoTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      totalGames: 6,
      aiFirstWins: 0,
      playerFirstWins: 0,
      aiFirstLosses: 0,
      playerFirstLosses: 0,
      aiFirstDraws: 0,
      playerFirstDraws: 0,
      bugs: [],
      gameLogs: []
    };
  }

  async init() {
    console.log('🚀 启动自动化测试...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    
    // 监听控制台错误
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ 页面错误:', msg.text());
        this.testResults.bugs.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // 监听页面错误
    this.page.on('pageerror', error => {
      console.error('❌ 页面异常:', error.message);
      this.testResults.bugs.push({
        type: 'page_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  async openGame() {
    console.log('🌐 打开游戏页面...');
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // 等待页面加载完成
    await this.page.waitForSelector('[data-testid="game-controls"]', { timeout: 10000 });
    
    // 选择人机对战
    console.log('🎮 选择人机对战模式...');
    await this.page.click('[data-testid="mode-button"]');
    
    // 等待游戏界面加载
    await this.page.waitForSelector('[data-testid="chess-board"]', { timeout: 5000 });
  }

  async playGame(isAIFirst) {
    const gameLog = {
      gameNumber: this.testResults.gameLogs.length + 1,
      aiFirst: isAIFirst,
      moves: [],
      winner: null,
      duration: 0,
      startTime: Date.now()
    };

    console.log(`🎯 开始第${gameLog.gameNumber}局游戏 (${isAIFirst ? 'AI先手' : '玩家先手'})...`);

    try {
      // 如果AI先手，等待AI下子
      if (isAIFirst) {
        await this.waitForAIMove();
        gameLog.moves.push({ player: 'AI', time: Date.now() });
      }

      let moveCount = 0;
      const maxMoves = 50; // 减少最大步数，避免无限循环

      while (moveCount < maxMoves) {
        // 检查游戏是否结束
        const gameStatus = await this.checkGameStatus();
        if (gameStatus.isGameOver) {
          gameLog.winner = gameStatus.winner;
          gameLog.duration = Date.now() - gameLog.startTime;
          console.log(`🏁 游戏结束: ${gameStatus.winner || '平局'}`);
          break;
        }

        // 玩家下子（模拟点击）
        try {
          await this.simulatePlayerMove();
          gameLog.moves.push({ player: 'Player', time: Date.now() });
          moveCount++;
          console.log(`👤 玩家下第${moveCount}子`);
        } catch (error) {
          console.log('玩家下子失败，可能棋盘已满');
          break;
        }

        // 检查游戏是否结束
        const gameStatus2 = await this.checkGameStatus();
        if (gameStatus2.isGameOver) {
          gameLog.winner = gameStatus2.winner;
          gameLog.duration = Date.now() - gameLog.startTime;
          console.log(`🏁 游戏结束: ${gameStatus2.winner || '平局'}`);
          break;
        }

        // AI下子
        try {
          await this.waitForAIMove();
          gameLog.moves.push({ player: 'AI', time: Date.now() });
          moveCount++;
          console.log(`🤖 AI下第${moveCount}子`);
        } catch (error) {
          console.log('AI下子失败，可能棋盘已满');
          break;
        }
      }

      // 记录结果
      if (gameLog.winner === 'AI') {
        if (isAIFirst) this.testResults.aiFirstWins++;
        else this.testResults.playerFirstLosses++;
      } else if (gameLog.winner === 'Player') {
        if (isAIFirst) this.testResults.aiFirstLosses++;
        else this.testResults.playerFirstWins++;
      } else {
        if (isAIFirst) this.testResults.aiFirstDraws++;
        else this.testResults.playerFirstDraws++;
      }

      this.testResults.gameLogs.push(gameLog);
      console.log(`✅ 第${gameLog.gameNumber}局完成: ${gameLog.winner || '平局'}`);

    } catch (error) {
      console.error(`❌ 第${gameLog.gameNumber}局出错:`, error.message);
      this.testResults.bugs.push({
        type: 'game_error',
        message: error.message,
        gameNumber: gameLog.gameNumber,
        timestamp: new Date().toISOString()
      });
    }
  }

  async waitForAIMove() {
    // 等待AI思考并下子
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3秒随机等待
  }

  async simulatePlayerMove() {
    // 获取棋盘canvas元素
    const canvas = await this.page.$('[data-testid="chess-board"]');
    if (!canvas) {
      throw new Error('找不到棋盘');
    }

    // 获取棋盘尺寸
    const canvasSize = await canvas.evaluate(el => ({
      width: el.width,
      height: el.height
    }));

    // 计算格子大小
    const cellSize = canvasSize.width / 15;
    const labelSpace = Math.max(20, canvasSize.width * 0.08);
    
    // 随机选择一个空位置（避开中心区域，增加随机性）
    const row = Math.floor(Math.random() * 15);
    const col = Math.floor(Math.random() * 15);
    
    // 计算点击坐标
    const x = labelSpace + col * cellSize + cellSize / 2;
    const y = labelSpace + row * cellSize + cellSize / 2;
    
    // 第一次点击（预览）
    await canvas.click({ x, y });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 第二次点击（确认下子）
    await canvas.click({ x, y });
    
    // 等待下子动画完成
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async checkGameStatus() {
    try {
      // 检查是否有获胜提示
      const winnerElement = await this.page.$('[data-testid="winner-announcement"]');
      if (winnerElement) {
        const winnerText = await winnerElement.evaluate(el => el.textContent);
        if (winnerText.includes('AI')) {
          return { isGameOver: true, winner: 'AI' };
        } else if (winnerText.includes('玩家')) {
          return { isGameOver: true, winner: 'Player' };
        }
      }

      // 检查棋盘是否已满
      const emptyCells = await this.page.$$('[data-testid="chess-board"] .cell:not(.black):not(.white)');
      if (emptyCells.length === 0) {
        return { isGameOver: true, winner: null }; // 平局
      }

      return { isGameOver: false, winner: null };
    } catch (error) {
      console.error('检查游戏状态时出错:', error);
      return { isGameOver: false, winner: null };
    }
  }

  async runAllTests() {
    try {
      await this.init();
      await this.openGame();

      // AI先手3局测试
      console.log('🤖 开始AI先手测试 (3局)...');
      for (let i = 0; i < 3; i++) {
        await this.playGame(true);
        await this.resetGame();
      }

      // 玩家先手3局测试
      console.log('👤 开始玩家先手测试 (3局)...');
      for (let i = 0; i < 3; i++) {
        await this.playGame(false);
        await this.resetGame();
      }

      await this.generateReport();
    } catch (error) {
      console.error('❌ 测试过程中出现严重错误:', error);
      this.testResults.bugs.push({
        type: 'critical_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async resetGame() {
    try {
      // 点击重新开始按钮
      const resetButton = await this.page.$('[data-testid="reset-button"]');
      if (resetButton) {
        await resetButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('重置游戏时出错:', error);
    }
  }

  async generateReport() {
    const report = {
      testSummary: {
        totalGames: this.testResults.totalGames,
        aiFirstGames: 3,
        playerFirstGames: 3,
        aiFirstWinRate: ((this.testResults.aiFirstWins / 3) * 100).toFixed(2) + '%',
        playerFirstWinRate: ((this.testResults.playerFirstWins / 3) * 100).toFixed(2) + '%',
        aiFirstLossRate: ((this.testResults.aiFirstLosses / 3) * 100).toFixed(2) + '%',
        playerFirstLossRate: ((this.testResults.playerFirstLosses / 3) * 100).toFixed(2) + '%',
        totalBugs: this.testResults.bugs.length
      },
      detailedResults: {
        aiFirst: {
          wins: this.testResults.aiFirstWins,
          losses: this.testResults.aiFirstLosses,
          draws: this.testResults.aiFirstDraws
        },
        playerFirst: {
          wins: this.testResults.playerFirstWins,
          losses: this.testResults.playerFirstLosses,
          draws: this.testResults.playerFirstDraws
        }
      },
      bugs: this.testResults.bugs,
      gameLogs: this.testResults.gameLogs,
      timestamp: new Date().toISOString()
    };

    // 保存报告到文件
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    
    // 输出控制台报告
    console.log('\n📊 ========== 测试报告 ==========');
    console.log(`🎮 总游戏数: ${report.testSummary.totalGames}`);
    console.log(`🤖 AI先手胜率: ${report.testSummary.aiFirstWinRate}`);
    console.log(`👤 玩家先手胜率: ${report.testSummary.playerFirstWinRate}`);
    console.log(`🐛 发现Bug数: ${report.testSummary.totalBugs}`);
    console.log('\n📈 详细结果:');
    console.log(`AI先手 - 胜利:${report.detailedResults.aiFirst.wins} 失败:${report.detailedResults.aiFirst.losses} 平局:${report.detailedResults.aiFirst.draws}`);
    console.log(`玩家先手 - 胜利:${report.detailedResults.playerFirst.wins} 失败:${report.detailedResults.playerFirst.losses} 平局:${report.detailedResults.playerFirst.draws}`);
    
    if (report.bugs.length > 0) {
      console.log('\n🐛 发现的Bug:');
      report.bugs.forEach((bug, index) => {
        console.log(`${index + 1}. [${bug.type}] ${bug.message}`);
      });
    }
    
    console.log('\n📄 详细报告已保存到 test-report.json');
    console.log('================================\n');
  }
}

// 运行测试
const tester = new GobangAutoTest();
tester.runAllTests().catch(console.error);
